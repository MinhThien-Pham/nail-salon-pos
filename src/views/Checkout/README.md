# Checkout View - Code Organization

This directory contains the checkout and payment flow components for the nail salon POS system.

## Directory Structure

```
src/views/Checkout/
├── CheckoutView.tsx          # Main checkout component
├── components/               # Reusable UI components
│   ├── index.ts             # Component exports
│   ├── NumberPad.tsx        # Reusable number pad component
│   ├── DiscountModal.tsx    # Discount modal with %/$ options
│   └── QuickAmountButtons.tsx # Quick payment amount buttons
├── paymentUtils.ts          # Payment calculation utilities
├── constants.ts             # Constants and magic numbers
└── README.md               # This file
```

## Components

### NumberPad
A reusable number pad component used throughout the checkout flow.

**Props:**
- `value`: Current display value
- `onNumberClick`: Handler for number/operator clicks
- `onAdd`: Handler for ADD button
- `addButtonLabel`: Custom label for the ADD button
- `addButtonDisabled`: Disable state for ADD button
- `showDollarSign`: Whether to show $ symbol
- `displayLabel`: Label above the display

**Usage:**
```tsx
<NumberPad
    value={paymentInput}
    onNumberClick={handleNumberPad}
    onAdd={() => handleNumberPad('ADD')}
    displayLabel="Payment Amount"
/>
```

### DiscountModal
Modal for applying discounts with percentage or dollar amount options.

**Props:**
- `isOpen`: Modal visibility
- `onClose`: Close handler
- `discountInput`: Current input value
- `discountType`: 'PERCENT' | 'DOLLAR'
- `onDiscountTypeChange`: Handler for changing discount type
- `onNumberClick`: Handler for number pad clicks

### QuickAmountButtons
Quick payment buttons for common amounts ($100, $50, $20, etc.).

**Props:**
- `selectedMethod`: Currently selected payment method
- `remaining`: Remaining amount to pay
- `onQuickAmount`: Handler for quick amount clicks
- `onPayRemaining`: Handler for "Pay Remaining" button

## Utilities

### paymentUtils.ts
Contains all payment-related calculations and type definitions.

**Functions:**
- `getMethodLabel(method)`: Get display label for payment method
- `calculateTotalPaid(payments)`: Calculate total amount paid
- `allPaymentsAreCash(payments)`: Check if all payments are cash
- `calculateCashDiscount(...)`: Calculate cash discount (10% if applicable)
- `calculatePotentialCashDiscount(total)`: Calculate potential cash discount

**Types:**
- `PaymentMethod`: 'CASH' | 'CARD' | 'CHECK' | 'GIFT_CARD'
- `Payment`: { method, amount }

## Constants

### constants.ts
Centralized constants to avoid magic numbers.

**Exports:**
- `PAYMENT_METHODS`: Array of all payment methods
- `QUICK_AMOUNTS`: Array of quick amount values [100, 50, 20, 10, 5, 2, 1]
- `CASH_DISCOUNT_PERCENTAGE`: 0.1 (10%)
- `NUMBER_PAD_NUMBERS`: Grid layout for number pad

## Benefits of This Structure

1. **Reusability**: NumberPad is used in 3+ places, now it's a single component
2. **Maintainability**: Changes to number pad logic happen in one place
3. **Testability**: Utility functions can be easily unit tested
4. **Readability**: Constants make code self-documenting
5. **Separation of Concerns**: UI, logic, and data are properly separated

## Future Improvements

Consider extracting:
- PaymentView into a separate file (it's quite large)
- Payment summary section into its own component
- Service/Tech selection components
