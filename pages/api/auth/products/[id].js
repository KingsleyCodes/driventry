// pages/api/products/[id].js
import { adminDb } from '../../../../lib/firebase-admin';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const doc = await adminDb.collection('products').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } 
  else if (req.method === 'PUT') {
    const { userId, userEmail, ...updateData } = req.body;

    try {
      const productRef = adminDb.collection('products').doc(id);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const oldProduct = productDoc.data();

      // Update product
      await productRef.update({
        ...updateData,
        updatedAt: new Date()
      });

      // Log the activity
      await adminDb.collection('activityLogs').add({
        action: 'product_updated',
        productId: id,
        productName: updateData.name || oldProduct.name,
        userId,
        userEmail,
        changes: {
          before: oldProduct,
          after: { ...oldProduct, ...updateData, updatedAt: new Date() }
        },
        details: `Updated product ${updateData.name || oldProduct.name}`,
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'DELETE') {
    const { userId, userEmail } = req.body;

    try {
      const productRef = adminDb.collection('products').doc(id);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = productDoc.data();

      // Soft delete (you can change to actual delete if needed)
      await productRef.update({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      });

      // Log the deletion
      await adminDb.collection('activityLogs').add({
        action: 'product_deleted',
        productId: id,
        productName: product.name,
        userId,
        userEmail,
        details: `Deleted product ${product.name}`,
        timestamp: new Date(),
      });

      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}