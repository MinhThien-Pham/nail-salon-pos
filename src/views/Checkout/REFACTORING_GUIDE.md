# Checkout Refactoring Guide

## ✅ Completed

### 1. UI Components Moved to `src/components/ui/`
- ✅ `NumberPad.tsx` - Reusable number pad component
- ✅ `DiscountModal.tsx` - Modal for applying discounts  
- ✅ `QuickAmountButtons.tsx` - Quick payment amount buttons
- ✅ Updated `src/components/ui/index.ts` with exports

### 2. Utility Files in `src/views/Checkout/`
- ✅ `paymentUtils.ts` - Payment calculation utilities
- ✅ `constants.ts` - Constants for payment methods, quick amounts, etc.

## 📋 Next Steps: Extract PaymentView

The PaymentView is currently embedded in CheckoutView.tsx (approx lines 530-1000+).
Here's how to extract it:

### Step 1: Create `PaymentView.tsx`

Create file: `src/views/Checkout/PaymentView.tsx`

```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, NumberPad, DiscountModal, QuickAmountButtons, DiscountType } from '../../components/ui';
import { 
    Payment, 
    PaymentMethod, 
    getMethodLabel,
    calculateCashDiscount,
    calculatePotentialCashDiscount 
} from './paymentUtils';
import { PAYMENT_METHODS } from './constants';

interface PaymentViewProps {
    subtotal: number;
    onClose: () => void;
}

export function PaymentView({ subtotal, onClose }: PaymentViewProps) {
    // Move all payment-related state here
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [paymentInput, setPaymentInput] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [discount, setDiscount] = useState(0);
    const [discountInput, setDiscountInput] = useState('');
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discountType, setDiscountType] = useState<DiscountType>('DOLLAR');

    // Move all payment calculation logic here
    const promo = 0;
    const reward = 0;
    const totalBeforeCashDiscount = subtotal - promo - reward - discount;
    const allPaymentsAreCash = payments.length > 0 && payments.every(p => p.method === 'CASH');
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBeforeCashDiscount = totalBeforeCashDiscount - totalPaid;
    const cashDiscount = calculateCashDiscount(payments, totalBeforeCashDiscount, remainingBeforeCashDiscount);
    const potentialCashDiscount = calculatePotentialCashDiscount(totalBeforeCashDiscount);
    const total = totalBeforeCashDiscount - cashDiscount;
    const remaining = total - totalPaid;
    const canComplete = remaining <= 0;
    const isChange = remaining < 0;

    // Move all payment handlers here (handleNumberPad, handleQuickAmount, etc.)
    
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col z-[60]">
            {/* Payment UI */}
        </div>
    );
}
```

### Step 2: Update CheckoutView.tsx

Remove the embedded payment logic and use the component:

```tsx
import { PaymentView } from './PaymentView';

// In CheckoutView component:
{showPayment && (
    <PaymentView
        subtotal={total}
        onClose={() => setShowPayment(false)}
    />
)}
```

### Step 3: Use New UI Components

In both CheckoutView and Payment View, replace inline number pads with:

```tsx
<NumberPad
    value={manualInput}
    onNumberClick={handleNumberPad}
    onAdd={() => handleNumberPad('ADD')}
    addButtonDisabled={!selectedMethod || !paymentInput}
    displayLabel="Payment Amount"
/>
```

Replace discount modal with:

```tsx
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
```

Replace quick amount buttons with:

```tsx
<QuickAmountButtons
    selectedMethod={selectedMethod}
    remaining={remaining}
    onQuickAmount={handleQuickAmount}
    onPayRemaining={handlePayAll}
/>
```

## Benefits After Full Refactor

1. ✅ **CheckoutView.tsx**: ~600 lines (down from 1000+)
2. ✅ **PaymentView.tsx**: ~400 lines (separate file)
3. ✅ **Reusable Components**: NumberPad, DiscountModal, QuickAmountButtons
4. ✅ **Utilities**: Payment logic centralized
5. ✅ **Constants**: No magic numbers
6. ✅ **Type Safety**: Shared TypeScript types

## File Structure After Full Refactor

```
src/
├── components/ui/
│   ├── NumberPad.tsx              ✅ Moved
│   ├── DiscountModal.tsx          ✅ Moved
│   ├── QuickAmountButtons.tsx     ✅ Moved
│   └── index.ts                   ✅ Updated
└── views/Checkout/
    ├── CheckoutView.tsx           📝 To be updated
    ├── PaymentView.tsx            📝 To be created
    ├── paymentUtils.ts            ✅ Created
    ├── constants.ts               ✅ Created
    └── README.md                  ✅ Created
```

## Testing Checklist

After completing the refactor, test:
- [ ] Checkout flow still works
- [ ] Payment methods selection
- [ ] Number pad input
- [ ] Quick amount buttons
- [ ] Discount modal ($ and %)
- [ ] Cash discount calculation (10%)
- [ ] Payment consolidation by method
- [ ] Remaining/Change display
