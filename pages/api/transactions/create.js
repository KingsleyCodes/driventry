// pages/api/transactions/create.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    type, 
    items, 
    userId, 
    userEmail, 
    total, 
    paymentMethod, 
    customerInfo, 
    notes 
  } = req.body;

  // Validation
  if (!type || !items || !userId || !userEmail) {
    return res.status(400).json({ 
      error: 'Missing required fields: type, items, userId, userEmail' 
    });
  }

  if (!['sale', 'arrival', 'refund', 'swap', 'correction'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required and cannot be empty' });
  }

  try {
    const batch = adminDb.batch();
    const transactionRef = adminDb.collection('transactions').doc();
    const transactionId = transactionRef.id;

    // 1. Create transaction document
    const transactionData = {
      id: transactionId,
      type,
      items: items.map(item => ({
        ...item,
        productId: item.productId,
        productName: item.productName,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        total: parseFloat(item.total)
      })),
      userId,
      userEmail,
      total: parseFloat(total) || 0,
      paymentMethod: paymentMethod || 'cash',
      customerInfo: customerInfo || {},
      notes: notes || '',
      status: 'completed',
      timestamp: new Date(),
      createdAt: new Date()
    };

    batch.set(transactionRef, transactionData);

    // 2. Update product stock levels and log changes
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
        case 'correction':
          stockChange = item.quantity - currentStock;
          newStock = item.quantity;
          break;
        case 'swap':
          // For swaps, stock might remain the same or change based on items
          stockChange = 0;
          newStock = currentStock;
          break;
      }

      // Update product stock
      batch.update(productRef, { 
        stock: newStock,
        updatedAt: new Date()
      });

      // Create stock change log
      const stockLogRef = adminDb.collection('activityLogs').doc();
      batch.set(stockLogRef, {
        action: `stock_${type}`,
        productId: item.productId,
        productName: product.name,
        userId,
        userEmail,
        transactionId: transactionId,
        changes: {
          before: { stock: currentStock },
          after: { stock: newStock }
        },
        details: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${item.quantity} units of ${product.name}`,
        timestamp: new Date(),
      });
    }

    // 3. Create main transaction activity log
    const activityLogRef = adminDb.collection('activityLogs').doc();
    batch.set(activityLogRef, {
      action: `transaction_${type}`,
      userId,
      userEmail,
      transactionId: transactionId,
      details: `Created ${type} transaction with ${items.length} items - Total: $${total}`,
      total: parseFloat(total),
      itemsCount: items.length,
      timestamp: new Date(),
    });

    // Commit all operations
    await batch.commit();

    res.status(201).json({ 
      success: true, 
      id: transactionId,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} recorded successfully` 
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
}