// pages/api/users/activate.js
import { adminDb } from '../../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, adminId, adminEmail } = req.body;

  if (!userId || !adminId || !adminEmail) {
    return res.status(400).json({ error: 'Missing required fields: userId, adminId, adminEmail' });
  }

  try {
    // 1. Get user data first for logging and validation
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const userData = userDoc.data();

    // 2. Check if user is already active
    if (userData.active !== false) {
      return res.status(400).json({ error: 'User is already active' });
    }

    // 3. Enable user in Firebase Authentication (allows login again)
    await getAuth().updateUser(userId, {
      disabled: false
    });

    // 4. Update user document in Firestore
    await userRef.update({
      active: true,
      activatedAt: new Date(),
      activatedBy: adminId,
      activatedByEmail: adminEmail,
      deactivatedAt: null,
      deactivatedBy: null,
      deactivatedByEmail: null
    });

    // 5. Log the activation activity
    await adminDb.collection('activityLogs').add({
      action: 'user_activated',
      targetUserId: userId,
      targetUserEmail: userData.email,
      userId: adminId,
      userEmail: adminEmail,
      details: `User account activated by ${adminEmail}. User can now login again.`,
      timestamp: new Date(),
    });

    res.status(200).json({ 
      success: true, 
      message: 'User activated successfully. User can now login to the system.',
      userEmail: userData.email,
      activatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error activating user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found in authentication system' });
    }

    res.status(500).json({ 
      error: 'Failed to activate user: ' + error.message 
    });
  }
}