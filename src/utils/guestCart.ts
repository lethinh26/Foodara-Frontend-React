const GUEST_CART_KEY = 'foodara_guest_cart_id';

export function getGuestCartId(): string {
  let id = localStorage.getItem(GUEST_CART_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_CART_KEY, id);
  }
  return id;
}

export function clearGuestCartId(): void {
  localStorage.removeItem(GUEST_CART_KEY);
}
