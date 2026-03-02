const COINS_KEY   = 'fan_coins';
const DEFAULT_COINS = 150;

export function getCoins(): number {
  if (typeof window === 'undefined') return DEFAULT_COINS;
  const stored = localStorage.getItem(COINS_KEY);
  return stored !== null ? parseInt(stored, 10) : DEFAULT_COINS;
}

export function setCoins(amount: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COINS_KEY, Math.max(0, amount).toString());
}

export function addCoins(amount: number): number {
  const next = getCoins() + amount;
  setCoins(next);
  return next;
}

export function spendCoins(amount: number): boolean {
  const current = getCoins();
  if (current < amount) return false;
  setCoins(current - amount);
  return true;
}
