import { useState, useEffect } from 'react';
import { X, DollarSign, Split } from 'lucide-react';
import { Button, ExpandCollapseIcon } from '../../components/ui';
import { QueueEntry, ServiceType, Service, CheckoutSplit, CheckoutSplitItem } from '../../shared/types';
import { PaymentView } from './PaymentView';

interface CheckoutViewProps {
    onClose: () => void;
}


type CheckoutItem = CheckoutSplitItem;

type ViewMode = 'tech' | 'services-amount';

export function CheckoutView({ onClose }: CheckoutViewProps) {
    const [busyTechs, setBusyTechs] = useState<QueueEntry[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
    const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('tech');
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [manualInput, setManualInput] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [splits, setSplits] = useState<CheckoutSplit[]>([]);

    // Load data on mount
    useEffect(() => {
        loadData();
        loadSplits();
    }, []);

    const loadData = async () => {
        try {
            const [techs, types, svc] = await Promise.all([
                window.api.getBusyTechs(),
                window.api.getServiceTypes(),
                window.api.getAllServices()
            ]);
            setBusyTechs(techs);
            setServiceTypes(types);
            setServices(svc);
            // Auto-select first service type if available
            if (types.length > 0) {
                setSelectedTypeId(types[0].serviceTypeId);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const loadSplits = async () => {
        try {
            const allSplits = await window.api.getAllCheckoutSplits();
            setSplits(allSplits);
        } catch (error) {
            console.error('Failed to load splits:', error);
        }
    };

    // Calculate total
    const total = checkoutItems.reduce((sum, item) => {
        if (item.manualAmount !== undefined) {
            return sum + item.manualAmount;
        }
        return sum + item.services.reduce((s, svc) => s + svc.priceCents, 0);
    }, 0);

    // Check if all techs have amounts
    const allTechsHaveAmounts = checkoutItems.every(item => {
        if (item.manualAmount !== undefined && item.manualAmount > 0) {
            return true;
        }
        return item.services.length > 0;
    });

    const handleTechClick = (techId: number) => {
        // Check if tech is already added
        const existing = checkoutItems.find(item => item.techId === techId);
        if (existing) {
            // Just select this tech and switch to Services/Amount view
            setSelectedTechId(techId);
            setViewMode('services-amount');
            setManualInput('');
        } else {
            // Add new tech to checkout
            const tech = busyTechs.find(t => t.staffId === techId);
            if (!tech) return;

            setCheckoutItems([...checkoutItems, {
                techId: tech.staffId,
                techName: tech.name,
                services: [],
                manualAmount: undefined
            }]);
            setSelectedTechId(techId);
            setViewMode('services-amount');
            setManualInput('');
        }
    };

    const handleRemoveTech = (techId: number) => {
        setCheckoutItems(checkoutItems.filter(item => item.techId !== techId));
        if (selectedTechId === techId) {
            setSelectedTechId(null);
            setViewMode('tech');
        }
    };

    const handleCreateSplit = async () => {
        try {
            await window.api.createCheckoutSplit(checkoutItems, total);
            // Reload splits from database
            await loadSplits();
            // Clear current checkout
            setCheckoutItems([]);
            setSelectedTechId(null);
            setViewMode('tech');
            setManualInput('');
        } catch (error) {
            console.error('Failed to create split:', error);
        }
    };

    const handleLoadSplit = async (split: CheckoutSplit) => {
        setCheckoutItems(split.items);
        setViewMode('tech');
        // Remove the split from database
        try {
            await window.api.deleteCheckoutSplit(split.splitId);
            await loadSplits();
        } catch (error) {
            console.error('Failed to delete split:', error);
        }
    };

    const handleDeleteSplit = async (splitId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await window.api.deleteCheckoutSplit(splitId);
            await loadSplits();
        } catch (error) {
            console.error('Failed to delete split:', error);
        }
    };

    const handleServiceClick = (service: Service) => {
        if (!selectedTechId) return;

        setCheckoutItems(checkoutItems.map(item => {
            if (item.techId === selectedTechId) {
                // If manual amount was set, clear it when adding services
                return {
                    ...item,
                    services: [...item.services, {
                        serviceId: service.serviceId,
                        name: service.name,
                        priceCents: service.priceCents
                    }],
                    manualAmount: undefined
                };
            }
            return item;
        }));
    };

    const handleRemoveService = (techId: number, serviceId: number) => {
        setCheckoutItems(checkoutItems.map(item => {
            if (item.techId === techId) {
                return {
                    ...item,
                    services: item.services.filter(s => s.serviceId !== serviceId)
                };
            }
            return item;
        }));
    };

    const handleNumberPad = (value: string) => {
        if (!selectedTechId) return;

        if (value === 'C') {
            setManualInput('');
        } else if (value === '⌫') {
            setManualInput(prev => prev.slice(0, -1));
        } else if (value === '.') {
            if (!manualInput.includes('.')) {
                setManualInput(prev => prev + '.');
            }
        } else if (value === 'SET') {
            // Convert to cents and set manual amount
            const amount = parseFloat(manualInput || '0') * 100;
            setCheckoutItems(checkoutItems.map(item => {
                if (item.techId === selectedTechId) {
                    return {
                        ...item,
                        services: [], // Clear services when using manual amount
                        manualAmount: amount
                    };
                }
                return item;
            }));
            setManualInput('');
        } else {
            setManualInput(prev => prev + value);
        }
    };

    const getTechInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const selectedTech = selectedTechId ? checkoutItems.find(item => item.techId === selectedTechId) : null;
    const isTechInCheckout = (techId: number) => checkoutItems.some(item => item.techId === techId);

    // Get services for selected type
    const selectedTypeServices = selectedTypeId
        ? services.filter(s => s.typeId === selectedTypeId)
        : [];

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col z-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Checkout</h1>
                        <p className="text-sm text-slate-500 mt-1">Complete the transaction</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {/* Back Button - Only show in service mode */}
                {viewMode === 'services-amount' && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            setViewMode('tech');
                            setManualInput('');
                        }}
                    >
                        ← Back to Tech Selection
                    </Button>
                )}
            </div>

            {/* Main Content - 3 Panels */}
            <div className="flex-1 flex overflow-hidden">
                {/* Panel 1: Slips (Left Most - Only visible in tech view) */}
                <div className={`bg-white border-r border-slate-200 overflow-auto transition-all ${viewMode === 'tech' ? 'w-[400px]' : 'w-0 invisible'
                    }`}>
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Splits</h3>
                        {splits.length === 0 ? (
                            <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                                <div className="text-slate-400 text-sm">No splits saved</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {splits.map((split) => (
                                    <button
                                        key={split.splitId}
                                        onClick={() => handleLoadSplit(split)}
                                        className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-semibold text-slate-800 text-sm">
                                                    {split.items.length} Tech{split.items.length !== 1 ? 's' : ''}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(split.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSplit(split.splitId, e)}
                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-right font-bold text-lg text-blue-600">
                                            ${(split.totalCents / 100).toFixed(2)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel 2: Tech / Services+Amount (Middle - Switches) */}
                <div className="flex-1 bg-white border-r border-slate-200 overflow-auto">
                    <div className="p-6 h-full">
                        {viewMode === 'tech' ? (
                            /* Tech Selection */
                            <div>
                                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Serving Techs</h3>
                                {busyTechs.length === 0 ? (
                                    <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                                        <div className="text-slate-400 text-sm">No techs currently serving</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {busyTechs.map(tech => {
                                            const isSelected = selectedTechId === tech.staffId;
                                            const isInCheckout = isTechInCheckout(tech.staffId);

                                            return (
                                                <button
                                                    key={tech.staffId}
                                                    onClick={() => handleTechClick(tech.staffId)}
                                                    className={`p-3 rounded-xl border-2 transition-all ${isSelected
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : isInCheckout
                                                            ? 'border-slate-300 bg-slate-100 grayscale opacity-60'
                                                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm border-2 border-blue-200">
                                                            {getTechInitials(tech.name)}
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-semibold text-slate-800 text-sm">{tech.name}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Services + Amount Selection */
                            <div className="h-full flex flex-col">

                                {/* 3-Column Split: Service Types | Services | Number Pad */}
                                <div className="flex-1 flex gap-0 overflow-hidden">
                                    {/* Service Types (Left) */}
                                    <div className="w-[400px] flex-shrink-0 box-border bg-white border-r border-slate-200 overflow-auto">
                                        <div className="p-6">
                                            <h4 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Categories</h4>
                                            <div className="space-y-3">
                                                {serviceTypes.length === 0 ? (
                                                    <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
                                                        <div className="text-slate-400 text-xs">No categories</div>
                                                    </div>
                                                ) : (
                                                    serviceTypes.map(type => (
                                                        <button
                                                            key={type.serviceTypeId}
                                                            onClick={() => setSelectedTypeId(type.serviceTypeId)}
                                                            disabled={!selectedTechId}
                                                            className={`w-full p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedTypeId === type.serviceTypeId
                                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                                                                }`}
                                                        >
                                                            <div className="font-bold text-lg">{type.name}</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Services List (Middle) - Flexes with min-width */}
                                    <div className="flex-1 min-w-[220px] max-w-[280px] overflow-auto">
                                        <h4 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Services</h4>
                                        <div className="space-y-2">
                                            {selectedTypeServices.length === 0 ? (
                                                <div className="bg-slate-50 rounded-lg p-8 text-center border border-slate-200">
                                                    <div className="text-slate-400 text-sm">
                                                        {selectedTypeId ? 'No services in this category' : 'Select a category'}
                                                    </div>
                                                </div>
                                            ) : (
                                                selectedTypeServices.map(service => (
                                                    <button
                                                        key={service.serviceId}
                                                        onClick={() => handleServiceClick(service)}
                                                        disabled={!selectedTechId}
                                                        className="w-full p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm text-slate-800">{service.name}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{service.durationMin} min</div>
                                                            </div>
                                                            <div className="font-bold text-slate-900 ml-3">
                                                                ${(service.priceCents / 100).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Number Pad (Right) */}
                                    <div className="w-[280px] flex-shrink-0 overflow-auto">
                                        <h4 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Manual Amount</h4>
                                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                                            {/* Display */}
                                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                <div className="text-xs text-slate-500 mb-1">Amount</div>
                                                <div className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                                                    <DollarSign className="h-6 w-6 text-slate-400" />
                                                    {manualInput || '0.00'}
                                                </div>
                                            </div>

                                            {/* Number Pad */}
                                            <div className="grid grid-cols-4 gap-2">
                                                {['7', '8', '9', 'C'].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => handleNumberPad(num)}
                                                        disabled={!selectedTechId}
                                                        className={`h-14 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${num === 'C'
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
                                                        onClick={() => handleNumberPad(num)}
                                                        disabled={!selectedTechId}
                                                        className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                                {['1', '2', '3', '.'].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => handleNumberPad(num)}
                                                        disabled={!selectedTechId}
                                                        className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => handleNumberPad('0')}
                                                    disabled={!selectedTechId}
                                                    className="h-14 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold transition-all col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    0
                                                </button>
                                                <button
                                                    onClick={() => handleNumberPad('SET')}
                                                    disabled={!selectedTechId || !manualInput}
                                                    className="h-14 rounded-lg bg-green-600 text-white hover:bg-green-700 font-bold transition-all col-span-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                >
                                                    SET
                                                </button>
                                            </div>

                                            <div className="text-xs text-slate-500 text-center">
                                                Setting manual amount will clear all selected services
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel 3: Order Summary (Right) */}
                <div className="w-[280px] bg-white flex flex-col shadow-xl">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800">Order Summary</h3>
                        <p className="text-sm text-slate-500 mt-1">{checkoutItems.length} technician{checkoutItems.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-auto p-6 space-y-4">
                        {checkoutItems.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-slate-400 mb-2">No items yet</div>
                                <div className="text-sm text-slate-500">Select a busy technician to begin</div>
                            </div>
                        ) : (
                            checkoutItems.map((item) => {
                                const techTotal = item.manualAmount !== undefined
                                    ? item.manualAmount
                                    : item.services.reduce((s, svc) => s + svc.priceCents, 0);

                                return (
                                    <div
                                        key={item.techId}
                                        className={`bg-slate-50 rounded-xl p-4 border-2 transition-all cursor-pointer ${selectedTechId === item.techId
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        onClick={() => {
                                            setSelectedTechId(item.techId);
                                            setViewMode('services-amount');
                                            setManualInput('');
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800">{item.techName}</div>
                                                <div className="text-sm text-slate-500 mt-1">
                                                    {item.manualAmount !== undefined
                                                        ? 'Manual amount'
                                                        : `${item.services.length} service${item.services.length !== 1 ? 's' : ''}`
                                                    }
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTech(item.techId);
                                                }}
                                                className="text-red-500 hover:text-red-700 transition p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {item.manualAmount !== undefined ? (
                                            <div className="text-right font-bold text-xl text-slate-800">
                                                ${(item.manualAmount / 100).toFixed(2)}
                                            </div>
                                        ) : item.services.length > 0 ? (
                                            <div className="space-y-2">
                                                {item.services.map((svc, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm py-1 group">
                                                        <span className="text-slate-600 flex-1">{svc.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-800 font-medium">
                                                                ${(svc.priceCents / 100).toFixed(2)}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveService(item.techId, svc.serviceId);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between font-semibold">
                                                    <span className="text-slate-700">Subtotal</span>
                                                    <span className="text-slate-800">${(techTotal / 100).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Sub-total and Action Buttons */}
                    <div className="border-t border-slate-200 p-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-slate-700">Sub-total</span>
                            <span className="text-3xl font-bold text-slate-900">${(total / 100).toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="secondary"
                                className="h-14 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={checkoutItems.length === 0 || total === 0 || !allTechsHaveAmounts}
                                onClick={handleCreateSplit}
                            >
                                <Split className="h-4 w-4" />
                                Create Split
                            </Button>
                            <Button
                                variant="primary"
                                className="h-14 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={checkoutItems.length === 0 || total === 0 || !allTechsHaveAmounts}
                                onClick={() => setShowPayment(true)}
                            >
                                <DollarSign className="h-4 w-4" />
                                Pay
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment View Modal */}
            {showPayment && (
                <PaymentView
                    subtotal={total}
                    onClose={() => setShowPayment(false)}
                />
            )}
        </div>
    );
}
