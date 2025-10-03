// pages/api/customers/followup.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Record a follow-up action
    const { customerPhone, type, notes, userId, userEmail, status = 'pending' } = req.body;

    if (!customerPhone || !type || !userId || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const followupRef = adminDb.collection('customerFollowups').doc();
      
      await followupRef.set({
        id: followupRef.id,
        customerPhone,
        type,
        notes: notes || '',
        userId,
        userEmail,
        status,
        scheduledDate: new Date(),
        createdAt: new Date(),
        completedAt: null
      });

      // Log the activity
      await adminDb.collection('activityLogs').add({
        action: 'customer_followup_scheduled',
        userId,
        userEmail,
        targetCustomerPhone: customerPhone,
        details: `Scheduled ${type} follow-up for customer ${customerPhone}`,
        timestamp: new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Follow-up scheduled successfully',
        followupId: followupRef.id
      });

    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'PUT') {
    // Update follow-up status
    const { followupId, status, notes, userId, userEmail } = req.body;

    if (!followupId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const followupRef = adminDb.collection('customerFollowups').doc(followupId);
      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (notes !== undefined) updateData.notes = notes;
      if (status === 'completed') updateData.completedAt = new Date();

      await followupRef.update(updateData);

      // Log the activity
      await adminDb.collection('activityLogs').add({
        action: 'customer_followup_updated',
        userId,
        userEmail,
        targetFollowupId: followupId,
        details: `Updated follow-up status to ${status}`,
        timestamp: new Date(),
      });

      res.status(200).json({
        success: true,
        message: 'Follow-up updated successfully'
      });

    } catch (error) {
      console.error('Error updating follow-up:', error);
      res.status(500).json({ error: error.message });
    }
  }
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}