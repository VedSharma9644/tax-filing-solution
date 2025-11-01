// Helper script to check and fix admin permissions
// Run this in browser console if you need to debug

export const checkAdminPermissions = () => {
  const adminUser = localStorage.getItem('adminUser');
  if (adminUser) {
    const admin = JSON.parse(adminUser);
    console.log('Current Admin Data:', admin);
    console.log('Has Permissions:', !!admin.permissions);
    console.log('Permissions Array:', admin.permissions);
    console.log('Role:', admin.role);
    return admin;
  }
  return null;
};

export const clearAdminAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
  console.log('Admin auth cleared. Please login again.');
  window.location.href = '/login';
};

