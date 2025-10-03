// pages/api/transactions/new.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, items, userId, userEmail, total, notes } = req.body;

  // Validate required fields
  if (!type || !items || !userId || !userEmail) {
    return res.status(400).json({ 
      error: 'Missing required fields: type, items, userId, userEmail' 
    });
  }

  // Validate transaction type
  const validTypes = ['sale', 'arrival', 'refund', 'swap', 'correction'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  try {
    const batch = adminDb.batch();

    // 1. Create transaction document
    const transactionRef = adminDb.collection('transactions').doc();
    const transaction = {
      id: transactionRef.id,
      type,
      items,
      userId,
      userEmail,
      total: parseFloat(total) || 0,
      notes: notes || '',
      timestamp: new Date(),
    };
    batch.set(transactionRef, transaction);

    // 2. Update product stock levels and create activity logs
    for (const item of items) {
      const productRef = adminDb.collection('products').doc(item.productId);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      const product = productDoc.data();
      const currentStock = product.stock || 0;
      let newStock = currentStock;
      let stockChange = 0;

      // Calculate stock change based on transaction type
      switch (type) {
        case 'sale':
          stockChange = -item.quantity;
          newStock = currentStock - item.quantity;
          break;
        case 'arrival':
          stockChange = item.quantity;
          newStock = currentStock + item.quantity;
          break;
        case 'refund':
          stockChange = item.quantity;
          newStock = currentStock + item.quantity;
          break;
        case 'swap':
          // For swaps, you might handle differently
          stockChange = 0; // Adjust based on your swap logic
          newStock = currentStock;
          break;
        case 'correction':
          stockChange = item.quantity - currentStock;
          newStock = item.quantity;
          break;
      }

      // Update product stock
      batch.update(productRef, { 
        stock: newStock,
        updatedAt: new Date()
      });

      // Create activity log for stock change
      const activityLogRef = adminDb.collection('activityLogs').doc();
      batch.set(activityLogRef, {
        action: `stock_${type}`,
        productId: item.productId,
        productName: product.name,
        userId,
        userEmail,
        transactionId: transactionRef.id,
        changes: {
          before: { stock: currentStock },
          after: { stock: newStock }
        },
        details: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${item.quantity} units of ${product.name}`,
        timestamp: new Date(),
      });
    }

    // 3. Create main transaction activity log
    const mainActivityLogRef = adminDb.collection('activityLogs').doc();
    batch.set(mainActivityLogRef, {
      action: `transaction_${type}`,
      userId,
      userEmail,
      transactionId: transactionRef.id,
      details: `Created ${type} transaction with ${items.length} items`,
      total: transaction.total,
      timestamp: new Date(),
    });

    // Commit all operations
    await batch.commit();

    res.status(200).json({ 
      success: true, 
      id: transactionRef.id,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} recorded successfully` 
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
}