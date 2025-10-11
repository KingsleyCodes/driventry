// lib/firestore.js
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// =============================================================================
// Activity Logs
// =============================================================================

export const logActivity = async (activityData, userId, userEmail) => {
  try {
    const log = {
      ...activityData,
      userId,
      userEmail,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'activityLogs'), log);
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

// Get user-specific activity logs (admin can view even for deactivated users)
export const getUserActivityLogs = async (userId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return logs;
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw error;
  }
};

// Get all activity logs with advanced filtering
export const getActivityLogs = async (filters = {}) => {
  try {
    let q = collection(db, 'activityLogs');
    
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }
    
    if (filters.targetUserId) {
      q = query(q, where('targetUserId', '==', filters.targetUserId));
    }
    
    // Chain multiple query methods for correct filtering
    let finalQuery = query(q, orderBy('timestamp', 'desc'));
    
    if (filters.limit) {
      finalQuery = query(finalQuery, limit(filters.limit));
    }
    
    const snapshot = await getDocs(finalQuery);
    const logs = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

// =============================================================================
// Users Management
// =============================================================================

export const getUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      active: doc.data().active !== false // Default to true if not set
    }));
    
    // Sort users: active first, then admins, then by creation date
    return users.sort((a, b) => {
      // Active users first
      if (a.active !== false && b.active === false) return -1;
      if (a.active === false && b.active !== false) return 1;
      
      // Admins before staff
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      
      // Newest first by createdAt (handles cases where createdAt might be a Firestore Timestamp)
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, newRole, adminId, adminEmail) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const oldData = userDoc.data();
    
    // Update in Firestore
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      updatedByEmail: adminEmail
    });
    
    // Log the activity
    await logActivity(
      {
        action: 'user_role_updated',
        targetUserId: userId,
        targetUserEmail: oldData.email,
        details: `User role updated from ${oldData.role} to ${newRole}`,
        changes: {
          before: { role: oldData.role },
          after: { role: newRole }
        }
      },
      adminId,
      adminEmail
    );
    
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Deactivate user via API (disables login but preserves data)
export const deactivateUser = async (userId, adminId, adminEmail) => {
  try {
    const response = await fetch('/api/users/deactivate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        adminId: adminId,
        adminEmail: adminEmail
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

// Activate user via API (enables login)
export const activateUser = async (userId, adminId, adminEmail) => {
  try {
    const response = await fetch('/api/users/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        adminId: adminId,
        adminEmail: adminEmail
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

// Create staff user via API
export const createStaffUser = async (userData, adminId, adminEmail) => {
  try {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        createdBy: adminId,
        createdByEmail: adminEmail
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Error creating staff user:', error);
    throw error;
  }
};

// =============================================================================
// Products Functions
// =============================================================================

export const getProducts = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProduct = async (id) => {
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// =============================================================================
// Transactions Functions
// =============================================================================

export const addTransaction = async (transactionData, userId, userEmail) => {
  try {
    const transaction = {
      ...transactionData,
      userId,
      userEmail,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async (filters = {}) => {
  try {
    let q = collection(db, 'transactions');
    
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    
    // Chain multiple query methods for correct filtering
    let finalQuery = query(q, orderBy('timestamp', 'desc'));
    
    if (filters.limit) {
      finalQuery = query(finalQuery, limit(filters.limit));
    }
    
    const snapshot = await getDocs(finalQuery);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// =============================================================================
// Stats and Initialization
// =============================================================================

// Get user statistics for admin dashboard
export const getUserStats = async () => {
  try {
    // Fetch users and transactions concurrently
    const [users, transactions] = await Promise.all([
      getUsers(),
      getTransactions({ limit: 1000 }) // Get recent transactions
    ]);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = users.filter(user => {
      const created = user.createdAt?.toDate?.();
      return created && created > thirtyDaysAgo;
    });
    
    const userActivity = await Promise.all(users.map(async user => {
      const userTransactions = transactions.filter(t => t.userId === user.id);
      
      // FIX: Use dedicated log function to find the actual last activity
      const logs = await getUserActivityLogs(user.id, 1); 
      
      let lastActivityTimestamp = user.createdAt; // Default to creation time
      if (logs.length > 0) {
          lastActivityTimestamp = logs[0].timestamp; // Use timestamp from the latest log
      } else if (userTransactions.length > 0) {
          // Fallback to transaction timestamp if no logs (though logs should cover transactions)
          lastActivityTimestamp = userTransactions[0].timestamp;
      }
      
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        active: user.active !== false,
        totalTransactions: userTransactions.length,
        totalSales: userTransactions
          .filter(t => t.type === 'sale')
          .reduce((sum, t) => sum + (t.total || 0), 0),
        lastActivity: lastActivityTimestamp,
        createdAt: user.createdAt
      };
    }));
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.active !== false).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      staffUsers: users.filter(u => u.role === 'staff').length,
      newUsersThisMonth: recentUsers.length,
      // Sort by the actual last activity timestamp
      userActivity: userActivity.sort((a, b) => {
        const aTime = a.lastActivity?.toDate ? a.lastActivity.toDate().getTime() : 0;
        const bTime = b.lastActivity?.toDate ? b.lastActivity.toDate().getTime() : 0;
        return bTime - aTime;
      })
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Initialize default data if needed
export const initializeDefaultData = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (productsSnapshot.empty) {
      console.log('Initializing default products...');
      
      const sampleProducts = [
        {
          name: 'Sample Product 1',
          sku: 'SP001',
          price: 29.99,
          cost: 15.00,
          stock: 100,
          minStock: 10,
          description: 'A sample product for demonstration'
        },
        {
          name: 'Sample Product 2', 
          sku: 'SP002',
          price: 49.99,
          cost: 25.00,
          stock: 50,
          minStock: 5,
          description: 'Another sample product'
        }
      ];
      
      for (const product of sampleProducts) {
        await addProduct(product);
      }
      console.log('Default products initialized');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};
// In lib/firestore.js - add this function if it doesn't exist
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
