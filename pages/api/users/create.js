// pages/api/users/create.js
import { adminDb } from '../../../lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, role, createdBy, createdByEmail } = req.body;

  // Input validation
  if (!email || !password || !role || !createdBy || !createdByEmail) {
    return res.status(400).json({ 
      error: 'All fields are required: email, password, role, createdBy, createdByEmail' 
    });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!['admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "admin" or "staff"' });
  }

  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await getAuth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false,
    });

    // 2. Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: email,
      role: role,
      active: true,
      createdAt: new Date(),
      createdBy: createdBy,
      createdByEmail: createdByEmail,
      lastLoginAt: null,
      loginCount: 0
    });

    // 3. Log the activity
    await adminDb.collection('activityLogs').add({
      action: 'user_created',
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      userId: createdBy,
      userEmail: createdByEmail,
      details: `Created new ${role} account for ${email}`,
      changes: {
        role: role,
        status: 'active'
      },
      timestamp: new Date(),
    });

    // 4. Send welcome email (you can integrate with your email service)
    // await sendWelcomeEmail(email, role, createdByEmail);

    res.status(201).json({ 
      success: true, 
      message: 'Staff account created successfully',
      userId: userRecord.uid,
      email: email,
      role: role
    });

  } catch (error) {
    console.error('Error creating staff account:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    res.status(500).json({ 
      error: 'Failed to create staff account: ' + error.message 
    });
  }
}