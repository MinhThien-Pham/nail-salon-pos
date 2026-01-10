// src/components/AddCustomerModal.tsx
import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (customerId: number) => void;
    title?: string;
    initialPhoneNumber?: string;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess, title = 'Add New Customer', initialPhoneNumber = '' }: AddCustomerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: initialPhoneNumber,
        email: '',
        dateOfBirthISO: ''
    });
    const [errors, setErrors] = useState<{ phoneNumber?: string; email?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update phone number when initialPhoneNumber prop changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            phoneNumber: initialPhoneNumber
        }));
    }, [initialPhoneNumber]);

    const validatePhoneNumber = (phone: string): string | undefined => {
        const digitsOnly = phone.replace(/\D/g, '');
        if (!digitsOnly) return 'Phone number is required';
        if (digitsOnly.length !== 10) return 'Phone number must be exactly 10 digits';
        return undefined;
    };

    const validateEmail = (email: string): string | undefined => {
        if (!email.trim()) return undefined;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        return undefined;
    };

    const handleSubmit = async () => {
        const phoneError = validatePhoneNumber(formData.phoneNumber);
        const emailError = validateEmail(formData.email);

        if (phoneError || emailError) {
            setErrors({ phoneNumber: phoneError, email: emailError });
            return;
        }

        setIsSubmitting(true);

        try {
            const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
            const customerId = await window.api.createCustomer({
                name: formData.name.trim() || undefined,
                phoneNumber: cleanedPhone,
                email: formData.email.trim() || undefined,
                dateOfBirthISO: formData.dateOfBirthISO || undefined,
                tier: 'BRONZE',
                stage: 'NEW',
                loyaltyPoints: 0,
                stats: {
                    firstVisitISO: '',
                    lastVisitISO: '',
                    totalSpendCents: 0,
                    totalVisits: 0
                }
            });

            setFormData({ name: '', phoneNumber: '', email: '', dateOfBirthISO: '' });
            setErrors({});
            onSuccess(customerId);
        } catch (error: any) {
            if (error.message?.includes('UNIQUE constraint')) {
                setErrors({ phoneNumber: 'This phone number is already registered' });
            } else {
                alert(error.message || 'Failed to create customer');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', phoneNumber: '', email: '', dateOfBirthISO: '' });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
                    </div>
                    <button onClick={handleClose} disabled={isSubmitting} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                const cleaned = e.target.value.replace(/[^\d\-\(\)\s]/g, '');
                                setFormData({ ...formData, phoneNumber: cleaned });
                                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                            }}
                            placeholder="(555) 123-4567"
                            disabled={isSubmitting}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                                }`}
                        />
                        {errors.phoneNumber && (
                            <p className="mt-1 text-sm text-red-600">⚠ {errors.phoneNumber}</p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            placeholder="john@example.com"
                            disabled={isSubmitting}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                                }`}
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">⚠ {errors.email}</p>
                        )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirthISO}
                            onChange={(e) => setFormData({ ...formData, dateOfBirthISO: e.target.value })}
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Customer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
