// pages/api/auth/setRole.js
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, role } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: 'UID and role are required' });
  }

  // Validate role
  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await adminDb.collection('users').doc(uid).set({
      role: role,
      updatedAt: new Date(),
    }, { merge: true });

    res.status(200).json({ 
      success: true, 
      message: `Role updated to ${role} for user ${uid}` 
    });
  } catch (error) {
    console.error('Error setting role:', error);
    res.status(500).json({ error: error.message });
  }
}