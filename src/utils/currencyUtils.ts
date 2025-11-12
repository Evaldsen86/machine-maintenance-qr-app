/**
 * Format a number as Danish currency
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK'
  }).format(amount);
};

/**
 * Calculate VAT amount
 * @param amount Base amount
 * @param vatRate VAT rate as percentage
 * @returns VAT amount
 */
export const calculateVAT = (amount: number, vatRate: number): number => {
  return amount * (vatRate / 100);
};

/**
 * Calculate total amount including VAT
 * @param amount Base amount
 * @param vatRate VAT rate as percentage
 * @returns Total amount including VAT
 */
export const calculateTotalWithVAT = (amount: number, vatRate: number): number => {
  return amount + calculateVAT(amount, vatRate);
};

/**
 * Format a number as a percentage
 * @param value Value to format
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('da-DK', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value / 100);
}; 