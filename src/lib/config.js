export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'Punto 5',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  currency: 'GHS',
  deliveryFee: 20,
  restaurantAddress: 'Liberation Road, Accra, Ghana',
  openingHours: '11:00 AM - 10:00 PM',
};

export const STAFF_ROLES = ['admin', 'order_mgr', 'product_mgr'];

export const ROLE_LABELS = {
  admin: 'Super Admin',
  order_mgr: 'Order Manager',
  product_mgr: 'Product Manager',
  customer: 'Customer',
};
