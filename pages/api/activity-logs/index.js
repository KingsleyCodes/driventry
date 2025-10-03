// pages/api/activity-logs/index.js
import { adminDb } from '../../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    userId, 
    action, 
    targetUserId, 
    startDate, 
    endDate, 
    limit = 50,
    page = 1 
  } = req.query;

  try {
    let query = adminDb.collection('activityLogs');
    
    // Build filters
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (action) {
      query = query.where('action', '==', action);
    }
    
    if (targetUserId) {
      query = query.where('targetUserId', '==', targetUserId);
    }
    
    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query = query.where('timestamp', '>=', start)
                   .where('timestamp', '<=', end);
    }
    
    // Order by timestamp (newest first)
    query = query.orderBy('timestamp', 'desc');
    
    // Pagination
    const pageSize = parseInt(limit);
    const offset = (parseInt(page) - 1) * pageSize;
    
    const snapshot = await query.limit(pageSize).offset(offset).get();
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Get total count for pagination
    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: error.message });
  }
}