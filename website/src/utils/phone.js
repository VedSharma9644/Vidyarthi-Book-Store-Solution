/** Normalize registered/account phone to 10 digits for address forms. */
export function toTenDigitPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

/** Keep only digits, max 10 (for controlled phone inputs). */
export function digitsOnlyPhone(value, maxLen = 10) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, maxLen);
}
