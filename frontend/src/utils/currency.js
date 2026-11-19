/**
 * Formats a number into Cameroon Central African CFA Franc (FCFA / XAF) display string.
 * Example: 385000 -> "385 000 FCFA"
 */
export function formatFCFA(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 FCFA';
  }
  const numericAmount = Math.round(Number(amount));
  const formatted = new Intl.NumberFormat('fr-FR').format(numericAmount);
  return `${formatted} FCFA`;
}

