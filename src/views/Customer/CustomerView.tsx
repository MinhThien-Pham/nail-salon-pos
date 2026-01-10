// src/views/Customer/CustomerView.tsx
import { useState, useEffect } from 'react';
import { X, Search, Plus, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Button, Input, FormField } from '../../components/ui';
import { Customer } from '../../shared/types';
import { AddCustomerModal } from '../../components/AddCustomerModal';

interface CustomerViewProps {
    onClose: () => void;
}

export function CustomerView({ onClose }: CustomerViewProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        dateOfBirthISO: ''
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        const allCustomers = await window.api.getAllCustomers();
        setCustomers(allCustomers);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            loadCustomers();
        } else {
            const results = await window.api.searchCustomers(query);
            setCustomers(results);
        }
    };

    const handleCustomerAdded = (customerId: number) => {
        setShowAddModal(false);
        loadCustomers();
    };

    const handleUpdateCustomer = async () => {
        if (!editingCustomer) return;

        try {
            await window.api.updateCustomer(editingCustomer.customerId, {
                name: editFormData.name || undefined,
                phoneNumber: editFormData.phoneNumber,
                email: editFormData.email || undefined,
                dateOfBirthISO: editFormData.dateOfBirthISO || undefined
            });
            setEditingCustomer(null);
            resetEditForm();
            loadCustomers();
        } catch (error: any) {
            alert(error.message || 'Failed to update customer');
        }
    };

    const handleDeleteCustomer = async (customerId: number) => {
        if (!confirm('Are you sure you want to delete this customer?')) return;

        try {
            await window.api.deleteCustomer(customerId);
            loadCustomers();
        } catch (error: any) {
            alert(error.message || 'Failed to delete customer');
        }
    };

    const openEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setEditFormData({
            name: customer.name,
            phoneNumber: customer.phoneNumber,
            email: customer.email || '',
            dateOfBirthISO: customer.dateOfBirthISO || ''
        });
    };

    const resetEditForm = () => {
        setEditFormData({
            name: '',
            phoneNumber: '',
            email: '',
            dateOfBirthISO: ''
        });
    };

    const closeEditModal = () => {
        setEditingCustomer(null);
        resetEditForm();
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col z-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage customer information and loyalty</p>
                </div>
                <button
                    onClick={onClose}
                    className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                {/* Search and Add Button */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-lg"
                        />
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowAddModal(true)}
                        className="h-14 px-6 flex items-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add Customer
                    </Button>
                </div>

                {/* Customer List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {customers.length === 0 ? (
                        <div className="p-12 text-center">
                            <UserPlus className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Customers Yet</h3>
                            <p className="text-slate-500">Add your first customer to get started!</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tier</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Points</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Visits</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.map((customer) => (
                                    <tr key={customer.customerId} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-slate-900 font-medium">{customer.name || '-'}</td>
                                        <td className="px-6 py-4 text-slate-700">{customer.phoneNumber}</td>
                                        <td className="px-6 py-4 text-slate-700">{customer.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${customer.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                                                customer.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                                                    customer.tier === 'SILVER' ? 'bg-gray-100 text-gray-700' :
                                                        'bg-orange-100 text-orange-700'
                                                }`}>
                                                {customer.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-semibold">{customer.loyaltyPoints}</td>
                                        <td className="px-6 py-4 text-slate-700">{customer.stats.totalVisits}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(customer)}
                                                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCustomer(customer.customerId)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleCustomerAdded}
            />

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">
                                Edit Customer
                            </h2>
                            <button
                                onClick={closeEditModal}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <FormField label="Phone Number" required>
                                <Input
                                    value={editFormData.phoneNumber}
                                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                                    placeholder="(555) 123-4567"
                                />
                            </FormField>

                            <FormField label="Name">
                                <Input
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </FormField>

                            <FormField label="Email">
                                <Input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </FormField>

                            <FormField label="Date of Birth">
                                <Input
                                    type="date"
                                    value={editFormData.dateOfBirthISO}
                                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirthISO: e.target.value })}
                                />
                            </FormField>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="secondary"
                                onClick={closeEditModal}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleUpdateCustomer}
                                disabled={!editFormData.phoneNumber}
                                className="flex-1"
                            >
                                Update Customer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
