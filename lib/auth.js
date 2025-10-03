// lib/auth.js
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';

export const loginUser = async (email, password) => {
  try {
    console.log('Attempting login for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User authenticated, fetching user data:', user.uid);
    
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.log('No user document found, creating default...');
      // Create user document if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'staff',
        createdAt: new Date(),
      });
    }
    
    const userData = userDoc.data() || { role: 'staff' };
    console.log('User data retrieved:', userData);
    
    return {
      uid: user.uid,
      email: user.email,
      role: userData.role || 'staff'
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const registerUser = async (email, password) => {
  try {
    console.log('Attempting registration for:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User registered, checking if first user...');
    
    // Check if this is the first user (make them admin)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const isFirstUser = usersSnapshot.empty;
    const role = isFirstUser ? 'admin' : 'staff';
    
    console.log('Is first user?', isFirstUser, 'Role:', role);
    
    // Store user role in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role: role,
      createdAt: new Date(),
      isFirstUser: isFirstUser
    });
    
    console.log('User document created successfully');
    
    return {
      uid: user.uid,
      email: user.email,
      role: role
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logoutUser = () => {
  console.log('Logging out user');
  return signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    console.log('Checking current user...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        console.log('User found, fetching data:', user.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          console.log('User data:', userData);
          resolve({
            uid: user.uid,
            email: user.email,
            role: userData?.role || 'staff'
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Return basic user info even if Firestore fails
          resolve({
            uid: user.uid,
            email: user.email,
            role: 'staff'
          });
        }
      } else {
        console.log('No user found');
        resolve(null);
      }
    });
  });
};

// Check if user is admin
export const isAdmin = (user) => user?.role === 'admin';

// Check if user is staff or admin
export const isStaff = (user) => user?.role === 'staff' || user?.role === 'admin';