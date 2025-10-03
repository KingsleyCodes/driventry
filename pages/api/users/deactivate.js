// pages/api/users/deactivate.js
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
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const userData = userDoc.data;

    // 2. Check if user is already deactivated
    if (userData.active === false) {
      return res.status(400).json({ error: 'User is already deactivated' });
    }

    // 3. Disable user in Firebase Authentication (prevents login)
    await getAuth().updateUser(userId, {
      disabled: true
    });

    // 4. Update user document in Firestore (marks as inactive but preserves all data)
    await userRef.update({
      active: false,
      deactivatedAt: new Date(),
      deactivatedBy: adminId,
      deactivatedByEmail: adminEmail,
      // Note: We DON'T delete any data - all user records, logs, transactions are preserved
    });

    // 5. Log the deactivation activity
    await adminDb.collection('activityLogs').add({
      action: 'user_deactivated',
      targetUserId: userId,
      targetUserEmail: userData.email,
      userId: adminId,
      userEmail: adminEmail,
      details: `User account deactivated by ${adminEmail}. User can no longer login but all data is preserved.`,
      timestamp: new Date(),
    });

    res.status(200).json({ 
      success: true, 
      message: 'User deactivated successfully. All user data and logs are preserved.',
      userEmail: userData.email,
      deactivatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found in authentication system' });
    }

    res.status(500).json({ 
      error: 'Failed to deactivate user: ' + error.message 
    });
  }
}