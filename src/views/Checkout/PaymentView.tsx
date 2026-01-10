import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button, NumberPad, DiscountModal, QuickAmountButtons, DiscountType } from '../../components/ui';
import {
    Payment,
    PaymentMethod,
    getMethodLabel,
    calculateCashDiscount,
    calculatePotentialCashDiscount,
} from './paymentUtils';
import { PAYMENT_METHODS } from './constants';
import { Customer } from '../../shared/types';
import { AddCustomerModal } from '../../components/AddCustomerModal';

interface PaymentViewProps {
    subtotal: number;
    onClose: () => void;
}

export function PaymentView({ subtotal, onClose }: PaymentViewProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('CARD');
    const [paymentInput, setPaymentInput] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [discount, setDiscount] = useState(0);
    const [discountInput, setDiscountInput] = useState('');
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discountType, setDiscountType] = useState<DiscountType>('DOLLAR');

    // For now, these are placeholders - will be integrated with actual promo/reward system later
    const promo = 0;
    const reward = 0;

    // Customer-related state
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [showCustomerDetail, setShowCustomerDetail] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

    // Handle phone number change with smart lookup
    const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^\d\-\(\)\s]/g, '');
        setCustomerPhone(value);

        const digitsOnly = value.replace(/\D/g, '');

        // Reset states
        setFoundCustomer(null);
        setShowCreateCustomer(false);
        setCustomerName('');

        // If 10 digits entered, lookup customer
        if (digitsOnly.length === 10) {
            try {
                const customer = await window.api.getCustomerByPhone(digitsOnly);
                if (customer) {
                    setFoundCustomer(customer);
                } else {
                    // Phone not found - show create button
                    setShowCreateCustomer(true);
                }
            } catch (error) {
                console.error('Error looking up customer:', error);
            }
        }
    };

    // Handle creating new customer
    const handleCreateNewCustomer = () => {
        setShowAddCustomerModal(true);
    };

    // Handle successful customer creation
    const handleCustomerCreated = async (customerId: number) => {
        setShowAddCustomerModal(false);
        // Reload the customer
        const digitsOnly = customerPhone.replace(/\D/g, '');
        const customer = await window.api.getCustomerByPhone(digitsOnly);
        if (customer) {
            setFoundCustomer(customer);
            setShowCreateCustomer(false);
        }
    };

    // Calculate total before cash discount
    const totalBeforeCashDiscount = subtotal - promo - reward - discount;

    // Calculate cash discount
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBeforeCashDiscount = totalBeforeCashDiscount - totalPaid;
    const cashDiscount = calculateCashDiscount(payments, totalBeforeCashDiscount, remainingBeforeCashDiscount);
    const potentialCashDiscount = calculatePotentialCashDiscount(totalBeforeCashDiscount);

    const total = totalBeforeCashDiscount - cashDiscount;
    const remaining = total - totalPaid;

    // Calculate adjusted remaining for Pay Remaining button
    // Only show discounted amount when CASH is selected AND (no payments or only cash payments exist)
    const allPaymentsAreCashOrNone = payments.length === 0 || payments.every(p => p.method === 'CASH');
    const adjustedRemaining = (selectedMethod === 'CASH' && allPaymentsAreCashOrNone)
        ? (totalBeforeCashDiscount - potentialCashDiscount - totalPaid)
        : remaining;

    const handleNumberPad = (value: string) => {
        if (value === 'C') {
            setPaymentInput('');
        } else if (value === '⌫') {
            setPaymentInput(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!paymentInput.includes('.')) {
                setPaymentInput(prev => prev + '.');
            }
        } else if (value === 'ADD') {
            if (!selectedMethod || !paymentInput) return;
            const amount = parseFloat(paymentInput) * 100;

            // Validation: non-cash payments can't exceed remaining
            if (selectedMethod !== 'CASH' && remaining <= 0) {
                return;
            }

            let amountToAdd = amount;
            if (selectedMethod !== 'CASH' && amount > remaining) {
                if (remaining <= 0) return;
                amountToAdd = remaining;
            }

            if (amountToAdd > 0) {
                const existingPaymentIndex = payments.findIndex(p => p.method === selectedMethod);
                if (existingPaymentIndex >= 0) {
                    const updatedPayments = [...payments];
                    updatedPayments[existingPaymentIndex].amount += amountToAdd;
                    setPayments(updatedPayments);
                } else {
                    setPayments([...payments, { method: selectedMethod, amount: amountToAdd }]);
                }
            }
            setPaymentInput('');
        } else {
            setPaymentInput(prev => prev + value);
        }
    };

    const handleQuickAmount = (amount: number) => {
        if (!selectedMethod) return;
        if (selectedMethod !== 'CASH' && remaining <= 0) return;

        const amountInCents = amount * 100;
        let amountToAdd = amountInCents;

        if (selectedMethod !== 'CASH' && amountInCents > remaining) {
            if (remaining <= 0) return;
            amountToAdd = remaining;
        }

        const existingPaymentIndex = payments.findIndex(p => p.method === selectedMethod);
        if (existingPaymentIndex >= 0) {
            const updatedPayments = [...payments];
            updatedPayments[existingPaymentIndex].amount += amountToAdd;
            setPayments(updatedPayments);
        } else {
            setPayments([...payments, { method: selectedMethod, amount: amountToAdd }]);
        }
    };

    const handlePayAll = () => {
        if (!selectedMethod) return;
        if (remaining <= 0) return;

        const existingPaymentIndex = payments.findIndex(p => p.method === selectedMethod);
        if (existingPaymentIndex >= 0) {
            const updatedPayments = [...payments];
            updatedPayments[existingPaymentIndex].amount += remaining;
            setPayments(updatedPayments);
        } else {
            setPayments([...payments, { method: selectedMethod, amount: remaining }]);
        }
    };

    const removePayment = (method: PaymentMethod) => {
        setPayments(payments.filter(p => p.method !== method));
    };

    const handleDiscountModalNumberPad = (value: string) => {
        if (value === 'C') {
            setDiscountInput('');
        } else if (value === '⌫') {
            setDiscountInput(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!discountInput.includes('.')) {
                setDiscountInput(prev => prev + '.');
            }
        } else if (value === 'ADD') {
            const inputValue = parseFloat(discountInput || '0');
            if (inputValue > 0) {
                if (discountType === 'PERCENT') {
                    const percent = Math.min(inputValue, 100);
                    const discountAmount = Math.round((subtotal * percent) / 100);
                    setDiscount(discountAmount);
                } else {
                    const discountAmount = inputValue * 100;
                    setDiscount(Math.min(discountAmount, subtotal));
                }
                setDiscountInput('');
                setShowDiscountModal(false);
            }
        } else {
            setDiscountInput(prev => prev + value);
        }
    };

    const canComplete = remaining <= 0;
    const isChange = remaining < 0;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col z-[60]">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Payment</h1>
                    <p className="text-sm text-slate-500 mt-1">Select payment method and amount</p>
                </div>
                <button
                    onClick={onClose}
                    className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Main Content - 3 Columns: Payment Methods | Number Pad | Summary */}
            <div className="flex-1 flex overflow-hidden">
                {/* Column 1: Payment Methods (Left) */}
                <div className="w-[240px] bg-white border-r border-slate-200 overflow-auto p-6">
                    <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Payment Method</h3>
                    <div className="space-y-3">
                        {PAYMENT_METHODS.map(method => (
                            <button
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                                className={`w-full p-4 rounded-xl border-2 transition-all ${selectedMethod === method
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                                    }`}
                                disabled={remaining <= 0 && method !== 'CASH'}
                            >
                                <div className="font-bold text-lg">{getMethodLabel(method)}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Column 2: Number Pad (Middle) */}
                <div className="flex-1 bg-white border-r border-slate-200 overflow-auto p-6 flex justify-center">
                    <div className="w-full max-w-md">
                        {/* Customer Section */}
                        <div className="mb-6 p-4 border-2 border-blue-200 rounded-xl bg-blue-50/30">
                            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Customer</h3>

                            <div className="grid grid-cols-6 gap-2 items-end">
                                {/* Phone Number Input */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={handlePhoneChange}
                                        placeholder="(555) 123-4567"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>

                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={foundCustomer ? foundCustomer.name : customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter name..."
                                        disabled={!!foundCustomer}
                                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${foundCustomer ? 'bg-slate-100 cursor-not-allowed' : ''
                                            }`}
                                    />
                                </div>

                                {/* Tier - Only show if customer found */}
                                {foundCustomer && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Tier</label>
                                        <div className={`px-3 py-2 rounded-lg text-sm font-bold text-center ${foundCustomer.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                                                foundCustomer.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                                                    foundCustomer.tier === 'SILVER' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                            }`}>
                                            {foundCustomer.tier}
                                        </div>
                                    </div>
                                )}

                                {/* Stage - Only show if customer found */}
                                {foundCustomer && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
                                        <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-center text-slate-700">
                                            {foundCustomer.stage}
                                        </div>
                                    </div>
                                )}

                                {/* Points - Only show if customer found */}
                                {foundCustomer && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Points</label>
                                        <div className="px-3 py-2 bg-blue-100 rounded-lg text-sm font-bold text-center text-blue-700">
                                            {foundCustomer.loyaltyPoints}
                                        </div>
                                    </div>
                                )}

                                {/* View Detail Button - Only show if customer found */}
                                {foundCustomer && (
                                    <div>
                                        <button
                                            onClick={() => setShowCustomerDetail(true)}
                                            className="w-full px-3 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-xs font-semibold"
                                        >
                                            View Detail
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Create Customer Button - Show when 10 digits but not found */}
                            {showCreateCustomer && (
                                <div className="mt-3">
                                    <button
                                        onClick={handleCreateNewCustomer}
                                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Create Customer ({customerPhone})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Promo, Reward, Discount Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <button
                                onClick={() => {
                                    // Promo button - no action for now
                                }}
                                className="p-2 rounded-lg border border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition text-sm font-semibold"
                            >
                                Promo
                            </button>
                            <button
                                onClick={() => {
                                    // Reward button - no action for now
                                }}
                                className="p-2 rounded-lg border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition text-sm font-semibold"
                            >
                                Reward
                            </button>
                            <button
                                onClick={() => setShowDiscountModal(true)}
                                className="p-2 rounded-lg border border-slate-300 hover:border-green-400 hover:bg-green-50 text-slate-700 hover:text-green-700 transition text-sm font-semibold"
                            >
                                Discount
                            </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Enter Amount</h3>

                        <NumberPad
                            value={paymentInput}
                            onNumberClick={handleNumberPad}
                            onAdd={() => handleNumberPad('ADD')}
                            addButtonDisabled={!selectedMethod || !paymentInput}
                            displayLabel="Payment Amount"
                        />

                        {/* Cash Discount Info - Only show for Cash */}
                        {selectedMethod === 'CASH' && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="text-sm font-semibold text-green-800">
                                    Cash Discount (10%): <span className="text-green-600">-${(potentialCashDiscount / 100).toFixed(2)}</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                    Applied when paying all with cash
                                </div>
                            </div>
                        )}

                        <QuickAmountButtons
                            selectedMethod={selectedMethod}
                            remaining={adjustedRemaining}
                            onQuickAmount={handleQuickAmount}
                            onPayRemaining={handlePayAll}
                            showCashDiscount={selectedMethod === 'CASH' && allPaymentsAreCashOrNone}
                            discountAmount={potentialCashDiscount}
                        />
                    </div>
                </div>

                {/* Column 3: Payment Summary (Right) */}
                <div className="flex-1 min-w-[280px] max-w-[320px] bg-white flex flex-col shadow-xl">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800">Payment Summary</h3>
                    </div>

                    {/* Breakdown */}
                    <div className="flex-1 overflow-auto p-6 space-y-3">
                        {/* Sub-total - All amounts align at w-[120px] container */}
                        <div className="flex items-center">
                            <span className="flex-1 text-slate-700">Sub-total</span>
                            <span className="font-semibold text-slate-900 text-right w-[100px]">${(subtotal / 100).toFixed(2)}</span>
                        </div>

                        {/* Promo (only if exists) */}
                        {promo > 0 && (
                            <div className="flex items-center text-green-600">
                                <span className="flex-1">Promo</span>
                                <span className="font-semibold text-right w-[100px]">-${(promo / 100).toFixed(2)}</span>
                                <button
                                    onClick={() => {/* TODO: Clear promo */ }}
                                    className="ml-2 text-red-500 hover:text-red-700 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Reward (only if exists) */}
                        {reward > 0 && (
                            <div className="flex items-center text-green-600">
                                <span className="flex-1">Reward</span>
                                <span className="font-semibold text-right w-[100px]">-${(reward / 100).toFixed(2)}</span>
                                <button
                                    onClick={() => {/* TODO: Clear reward */ }}
                                    className="ml-2 text-red-500 hover:text-red-700 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Discount (only if exists) */}
                        {discount > 0 && (
                            <div className="flex items-center text-green-600">
                                <span className="flex-1">Discount</span>
                                <span className="font-semibold text-right w-[100px]">-${(discount / 100).toFixed(2)}</span>
                                <button
                                    onClick={() => setDiscount(0)}
                                    className="ml-2 text-red-500 hover:text-red-700 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Total (before cash discount) */}
                        <div className="border-t border-slate-300 pt-3 flex items-center">
                            <span className="flex-1 text-lg font-semibold text-slate-800">Total</span>
                            <span className="text-2xl font-bold text-slate-900 text-right w-[100px]">${(totalBeforeCashDiscount / 100).toFixed(2)}</span>
                        </div>

                        {/* Cash Discount (only if all cash and payment complete) */}
                        {cashDiscount > 0 && (
                            <div className="flex items-center text-green-600">
                                <span className="flex-1">Cash Discount (10%)</span>
                                <span className="font-semibold text-right w-[100px]">-${(cashDiscount / 100).toFixed(2)}</span>
                            </div>
                        )}

                        {/* Cash Total (only if cash discount applied) */}
                        {cashDiscount > 0 && (
                            <div className="border-t border-slate-300 pt-3 flex items-center">
                                <span className="flex-1 text-lg font-semibold text-green-800">Cash Total</span>
                                <span className="text-2xl font-bold text-green-900 text-right w-[100px]">${(total / 100).toFixed(2)}</span>
                            </div>
                        )}

                        {/* Payment Methods */}
                        {payments.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-slate-200">
                                <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Payments</div>
                                {payments.map((payment, index) => (
                                    <div key={index} className="flex items-center">
                                        <span className="flex-1 text-slate-700">{getMethodLabel(payment.method)}</span>
                                        <span className="font-semibold text-slate-900 text-right w-[100px]">
                                            -${(payment.amount / 100).toFixed(2)}
                                        </span>
                                        <button
                                            onClick={() => removePayment(payment.method)}
                                            className="ml-2 text-red-500 hover:text-red-700 transition"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Remaining / Change */}
                        <div className="border-t border-slate-300 pt-3 flex items-center">
                            <span className="flex-1 text-lg font-semibold text-slate-800">{isChange ? 'Change' : 'Remaining'}</span>
                            <span className={`text-2xl font-bold text-right w-[100px] ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.abs(remaining / 100).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-200 p-6 space-y-3">
                        <Button
                            variant="primary"
                            className="w-full h-14 text-lg font-bold"
                            disabled={!canComplete}
                        >
                            Complete Payment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Discount Modal */}
            <DiscountModal
                isOpen={showDiscountModal}
                onClose={() => {
                    setShowDiscountModal(false);
                    setDiscountInput('');
                }}
                discountInput={discountInput}
                discountType={discountType}
                onDiscountTypeChange={setDiscountType}
                onNumberClick={handleDiscountModalNumberPad}
            />

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={showAddCustomerModal}
                onClose={() => setShowAddCustomerModal(false)}
                onSuccess={handleCustomerCreated}
                title={`Create Customer (${customerPhone})`}
                initialPhoneNumber={customerPhone}
            />

            {/* Customer Detail Modal */}
            {showCustomerDetail && foundCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Customer Details</h2>
                            <button
                                onClick={() => setShowCustomerDetail(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Name</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.name || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Phone</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.phoneNumber}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.email || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Date of Birth</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.dateOfBirthISO || '-'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tier</div>
                                    <div className={`text-lg font-bold ${foundCustomer.tier === 'PLATINUM' ? 'text-purple-600' :
                                            foundCustomer.tier === 'GOLD' ? 'text-yellow-600' :
                                                foundCustomer.tier === 'SILVER' ? 'text-gray-600' :
                                                    'text-orange-600'
                                        }`}>{foundCustomer.tier}</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Stage</div>
                                    <div className="text-lg font-bold text-slate-700">{foundCustomer.stage}</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Points</div>
                                    <div className="text-lg font-bold text-blue-600">{foundCustomer.loyaltyPoints}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Visits</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.stats.totalVisits}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Total Spent</div>
                                    <div className="text-sm font-medium text-slate-900">${(foundCustomer.stats.totalSpendCents / 100).toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">First Visit</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.stats.firstVisitISO || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Last Visit</div>
                                    <div className="text-sm font-medium text-slate-900">{foundCustomer.stats.lastVisitISO || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setShowCustomerDetail(false)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
