// Constants for checkout and payment

export const PAYMENT_METHODS = ['CARD', 'CASH', 'CHECK', 'GIFT_CARD'] as const;

export const QUICK_AMOUNTS = [100, 50, 20, 10, 5, 2, 1] as const;

export const CASH_DISCOUNT_PERCENTAGE = 0.1;

export const NUMBER_PAD_NUMBERS = [
    ['7', '8', '9', 'C'],
    ['4', '5', '6', '⌫'],
    ['1', '2', '3', '.'],
] as const;
