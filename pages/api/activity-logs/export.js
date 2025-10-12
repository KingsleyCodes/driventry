// pages/api/activity-logs/export.js
// FIX: Changed '../../../../lib/firebase-admin' to '../../../lib/firebase-admin'
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    userId, 
    action, 
    startDate, 
    endDate 
  } = req.query;

  try {
    let query = adminDb.collection('activityLogs');
    
    // Build filters (same as index endpoint)
    if (userId) query = query.where('userId', '==', userId);
    if (action) query = query.where('action', '==', action);
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.where('timestamp', '>=', start)
                   .where('timestamp', '<=', end);
    }
    
    query = query.orderBy('timestamp', 'desc');
    
    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Convert to CSV format
    const csvHeaders = [
      'Timestamp',
      'Action',
      'User Email',
      'Target User Email',
      'Details',
      'Transaction ID',
      'Product ID',
      'Changes'
    ].join(',');

    const csvRows = logs.map(log => [
      log.timestamp?.toDate?.().toISOString() || '',
      log.action || '',
      log.userEmail || '',
      log.targetUserEmail || '',
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.transactionId || '',
      log.productId || '',
      `"${JSON.stringify(log.changes || {}).replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({ error: error.message });
  }
}