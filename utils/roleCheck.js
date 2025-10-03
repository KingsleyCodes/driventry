// utils/roleCheck.js
export const isAdmin = (user) => user?.role === 'admin';
export const isStaff = (user) => user?.role === 'staff';