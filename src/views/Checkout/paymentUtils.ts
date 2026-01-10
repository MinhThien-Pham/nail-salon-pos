// Payment calculation utilities

export interface Payment {
    method: PaymentMethod;
    amount: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'CHECK' | 'GIFT_CARD';

export const getMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
        case 'CASH': return 'Cash';
        case 'CARD': return 'Card';
        case 'CHECK': return 'Check';
        case 'GIFT_CARD': return 'Gift Card';
    }
};

export const calculateTotalPaid = (payments: Payment[]): number => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
};

export const allPaymentsAreCash = (payments: Payment[]): boolean => {
    return payments.length > 0 && payments.every(p => p.method === 'CASH');
};

export const calculateCashDiscount = (
    payments: Payment[],
    totalBeforeCashDiscount: number,
    remainingBeforeCashDiscount: number
): number => {
    const isCashOnly = allPaymentsAreCash(payments);
    const isPaymentComplete = remainingBeforeCashDiscount <= 0;
    return (isCashOnly && isPaymentComplete) ? Math.round(totalBeforeCashDiscount * 0.1) : 0;
};

export const calculatePotentialCashDiscount = (totalBeforeCashDiscount: number): number => {
    return Math.round(totalBeforeCashDiscount * 0.1);
};
