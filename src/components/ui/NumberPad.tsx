import React from 'react';
import { DollarSign } from 'lucide-react';
import { NUMBER_PAD_NUMBERS } from '../../views/Checkout/constants';

interface NumberPadProps {
    value: string;
    onNumberClick: (num: string) => void;
    onAdd: () => void;
    addButtonLabel?: string;
    addButtonDisabled?: boolean;
    showDollarSign?: boolean;
    displayLabel?: string;
}

export function NumberPad({
    value,
    onNumberClick,
    onAdd,
    addButtonLabel = 'ADD',
    addButtonDisabled = false,
    showDollarSign = true,
    displayLabel = 'Amount',
}: NumberPadProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            {/* Display */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">{displayLabel}</div>
                <div className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    {showDollarSign && <DollarSign className="h-6 w-6 text-slate-400" />}
                    {value || '0.00'}
                </div>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-4 gap-2">
                {NUMBER_PAD_NUMBERS.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map(num => (
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
                    </React.Fragment>
                ))}
                <button
                    onClick={() => onNumberClick('0')}
                    className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all col-span-2"
                >
                    0
                </button>
                <button
                    onClick={onAdd}
                    disabled={addButtonDisabled}
                    className="h-14 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold transition-all col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {addButtonLabel}
                </button>
            </div>
        </div>
    );
}

export type { NumberPadProps };
