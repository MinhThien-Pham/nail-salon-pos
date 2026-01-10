import React from 'react';
import { Banknote } from 'lucide-react';
import { QUICK_AMOUNTS } from '../../views/Checkout/constants';

interface QuickAmountButtonsProps {
    selectedMethod: string | null;
    remaining: number;
    onQuickAmount: (amount: number) => void;
    onPayRemaining: () => void;
    showCashDiscount?: boolean;
    discountAmount?: number;
}

export function QuickAmountButtons({
    selectedMethod,
    remaining,
    onQuickAmount,
    onPayRemaining,
    showCashDiscount = false,
    discountAmount = 0,
}: QuickAmountButtonsProps) {
    if (!selectedMethod) return null;

    const buttonClass = showCashDiscount
        ? 'w-full h-12 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg'
        : 'w-full h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
                Quick Amount
            </div>

            {/* Pay Remaining Button - Universal for all methods */}
            <button
                onClick={onPayRemaining}
                disabled={remaining <= 0}
                className={buttonClass}
            >
                <div className="flex items-center justify-center gap-2">
                    {showCashDiscount && <Banknote className="h-5 w-5" />}
                    {showCashDiscount ? (
                        <span>
                            Pay Remaining + 10% Off (${(remaining / 100).toFixed(2)})
                        </span>
                    ) : (
                        <span>Pay Remaining (${(remaining / 100).toFixed(2)})</span>
                    )}
                </div>
            </button>

            {/* Quick Amount Buttons - Universal for all methods */}
            <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map(amount => (
                    <button
                        key={amount}
                        onClick={() => onQuickAmount(amount)}
                        className="h-10 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-semibold transition-all text-sm"
                    >
                        ${amount}
                    </button>
                ))}
            </div>
        </div>
    );
}

export type { QuickAmountButtonsProps };

