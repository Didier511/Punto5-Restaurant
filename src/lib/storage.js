const namespace = 'punto5:';

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(namespace + key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(namespace + key, JSON.stringify(value));
}

export function removeStorage(key) {
  localStorage.removeItem(namespace + key);
}

export function createId(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function createCode(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}
