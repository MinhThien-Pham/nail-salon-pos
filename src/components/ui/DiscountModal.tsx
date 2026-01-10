import React from 'react';
import { X, DollarSign } from 'lucide-react';

export type DiscountType = 'PERCENT' | 'DOLLAR';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discountInput: string;
    discountType: DiscountType;
    onDiscountTypeChange: (type: DiscountType) => void;
    onNumberClick: (value: string) => void;
}

export function DiscountModal({
    isOpen,
    onClose,
    discountInput,
    discountType,
    onDiscountTypeChange,
    onNumberClick,
}: DiscountModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[500px] max-w-[90vw]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Add Discount</h2>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Discount Type Selection */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => onDiscountTypeChange('DOLLAR')}
                        className={`p-4 rounded-xl border-2 transition-all font-bold ${discountType === 'DOLLAR'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-slate-200 hover:border-green-300 hover:bg-slate-50 text-slate-700'
                            }`}
                    >
                        Dollar ($)
                    </button>
                    <button
                        onClick={() => onDiscountTypeChange('PERCENT')}
                        className={`p-4 rounded-xl border-2 transition-all font-bold ${discountType === 'PERCENT'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-slate-200 hover:border-green-300 hover:bg-slate-50 text-slate-700'
                            }`}
                    >
                        Percent (%)
                    </button>
                </div>

                {/* Display */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                    <div className="text-xs text-slate-500 mb-1">
                        Discount {discountType === 'PERCENT' ? 'Percentage' : 'Amount'}
                    </div>
                    <div className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        {discountType === 'DOLLAR' ? (
                            <DollarSign className="h-6 w-6 text-slate-400" />
                        ) : (
                            <span className="text-slate-400">%</span>
                        )}
                        {discountInput || '0.00'}
                    </div>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {['7', '8', '9', 'C'].map(num => (
                        <button
                            key={num}
                            onClick={() => onNumberClick(num)}
                            className={`h-14 rounded-lg font-bold transition-all ${num === 'C'
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                    {['4', '5', '6', '⌫'].map(num => (
                        <button
                            key={num}
                            onClick={() => onNumberClick(num)}
                            className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    {['1', '2', '3', '.'].map(num => (
                        <button
                            key={num}
                            onClick={() => onNumberClick(num)}
                            className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => onNumberClick('0')}
                        className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all col-span-2"
                    >
                        0
                    </button>
                    <button
                        onClick={() => onNumberClick('ADD')}
                        disabled={!discountInput}
                        className="h-14 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold transition-all col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ADD
                    </button>
                </div>
            </div>
        </div>
    );
}

export type { DiscountModalProps };
