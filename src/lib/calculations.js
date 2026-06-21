import { APP_CONFIG } from './config';

export function money(value) {
  return `${APP_CONFIG.currency} ${Number(value || 0).toFixed(2)}`;
}

export function cartCount(cart) {
  return cart.reduce((total, item) => total + item.qty, 0);
}

export function cartSubtotal(cart, dishes) {
  return cart.reduce((total, item) => {
    const dish = dishes.find((candidate) => candidate.id === item.id);
    return total + (dish ? dish.price * item.qty : 0);
  }, 0);
}

export function orderTotal(cart, dishes, promo) {
  const subtotal = cartSubtotal(cart, dishes);
  let discount = 0;

  if (promo) {
    discount = promo.type === 'percent' ? subtotal * (promo.discount / 100) : promo.discount;
    discount = Math.min(discount, subtotal);
  }

  return {
    subtotal,
    delivery: APP_CONFIG.deliveryFee,
    discount,
    total: subtotal + APP_CONFIG.deliveryFee - discount,
  };
}
