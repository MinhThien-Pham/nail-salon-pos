import { useState, useEffect } from 'react';
import { Settings } from '../../shared/types';
import { PinModal } from '../../components/PinModal';

export function SettingsManager() {
    const [settings, setSettings] = useState<Settings | null>(null);

    // --- PIN Change State ---
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinStep, setPinStep] = useState<'VERIFY_OLD' | 'ENTER_NEW'>('VERIFY_OLD');
    const [tempOldPin, setTempOldPin] = useState('');
    const [pinMessage, setPinMessage] = useState({ text: '', type: '' as 'error' | 'success' });

    // --- Section Edit States ---
    const [isEditingPayroll, setIsEditingPayroll] = useState(false);
    const [isEditingLoyalty, setIsEditingLoyalty] = useState(false);

    // --- Draft States ---
    const [payrollDraft, setPayrollDraft] = useState<Partial<Settings>>({});
    const [loyaltyDraft, setLoyaltyDraft] = useState<Partial<Settings>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const s = await window.api.getSettings();
        setSettings(s);
    };

    // --- PAYROLL HANDLERS ---
    const startEditPayroll = () => {
        if (!settings) return;
        setPayrollDraft({
            periodDays: settings.periodDays,
            periodStartDate: settings.periodStartDate,
            defaultCommissionTechRate: settings.defaultCommissionTechRate,
            defaultPayoutCheckRate: settings.defaultPayoutCheckRate
        });
        setIsEditingPayroll(true);
    };

    const cancelEditPayroll = () => {
        setIsEditingPayroll(false);
        setPayrollDraft({});
    };

    const savePayroll = async () => {
        await window.api.updateSettings(payrollDraft);
        setPinMessage({ text: 'Payroll settings saved.', type: 'success' });
        setTimeout(() => setPinMessage({ text: '', type: 'success' }), 3000);
        setIsEditingPayroll(false);
        loadSettings();
    };

    // --- LOYALTY HANDLERS ---
    const startEditLoyalty = () => {
        if (!settings) return;
        setLoyaltyDraft({
            loyaltyEarn: JSON.parse(JSON.stringify(settings.loyaltyEarn))
        });
        setIsEditingLoyalty(true);
    };

    const cancelEditLoyalty = () => {
        setIsEditingLoyalty(false);
        setLoyaltyDraft({});
    };

    const saveLoyalty = async () => {
        await window.api.updateSettings(loyaltyDraft);
        setPinMessage({ text: 'Loyalty rules saved.', type: 'success' });
        setTimeout(() => setPinMessage({ text: '', type: 'success' }), 3000);
        setIsEditingLoyalty(false);
        loadSettings();
    };

    // --- PIN LOGIC ---
    const startPinChange = () => {
        setPinStep('VERIFY_OLD');
        setTempOldPin('');
        setPinMessage({ text: '', type: 'success' });
        setShowPinModal(true);
    };

    const handlePinSubmit = async (val: string): Promise<boolean> => {
        if (pinStep === 'VERIFY_OLD') {
            try {
                const isValid = await window.api.verifyOwner(val);
                if (isValid) {
                    setTempOldPin(val);
                    setPinStep('ENTER_NEW');
                    setTimeout(() => setShowPinModal(true), 100);
                    return true;
                } else {
                    setPinMessage({ text: 'Incorrect current PIN.', type: 'error' });
                    return false;
                }
            } catch (e) {
                setPinMessage({ text: 'Error verifying PIN.', type: 'error' });
                return false;
            }
        } else {
            if (val.length < 4) {
                setPinMessage({ text: 'New PIN too short (min 4).', type: 'error' });
                return false;
            }
            await window.api.changeOwnPin(1, tempOldPin, val);
            setPinMessage({ text: 'Owner PIN updated successfully.', type: 'success' });
            return true;
        }
    };

    const nextPayDate = settings ? calculateNextPayDate(
        isEditingPayroll ? payrollDraft.periodStartDate! : settings.periodStartDate,
        isEditingPayroll ? payrollDraft.periodDays! : settings.periodDays
    ) : '';

    if (!settings) return <div>Loading settings...</div>;

    return (
        <div>
            {pinMessage.text && (
                <div style={{ marginBottom: 20, padding: 10, borderRadius: 6, background: pinMessage.type === 'error' ? '#fee2e2' : '#dcfce7', color: pinMessage.type === 'error' ? '#b91c1c' : '#166534' }}>
                    {pinMessage.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* 1. PAYROLL */}
                <div className="form-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <h3 style={{ margin: 0 }}><strong>Payroll Configuration</strong></h3>
                        {!isEditingPayroll && (
                            <button
                                type="button"
                                className="h-8 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
                                onClick={startEditPayroll}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditingPayroll ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pay Period Frequency (Days):</label>
                                <input
                                    type="number"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    value={payrollDraft.periodDays}
                                    onChange={e => setPayrollDraft({ ...payrollDraft, periodDays: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Period Starts On:</label>
                                <input
                                    type="date"
                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                    value={payrollDraft.periodStartDate}
                                    onChange={(e) => setPayrollDraft({ ...payrollDraft, periodStartDate: e.target.value })}
                                />
                                <small className="block mt-2 text-slate-500 text-xs">Preview Next Pay Date: <strong className="text-slate-700">{nextPayDate}</strong></small>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">Default Staff Rates</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Comm. Rate (0-1):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            value={payrollDraft.defaultCommissionTechRate}
                                            onChange={e => setPayrollDraft({ ...payrollDraft, defaultCommissionTechRate: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Check Rate (0-1):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            value={payrollDraft.defaultPayoutCheckRate}
                                            onChange={e => setPayrollDraft({ ...payrollDraft, defaultPayoutCheckRate: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={savePayroll}
                                    className="h-10 px-6 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="h-10 px-6 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                                    onClick={cancelEditPayroll}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.95em', lineHeight: '1.8' }}>
                            <div><strong>Frequency:</strong> {settings.periodDays} Days</div>
                            <div><strong>Starts On:</strong> {settings.periodStartDate}</div>
                            <div style={{ color: '#059669', marginTop: 4 }}><strong>Next Pay Date:</strong> {nextPayDate}</div>

                            <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 10 }}>
                                <strong>Default Rates</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 5 }}>
                                    <div>Comm: {settings.defaultCommissionTechRate}</div>
                                    <div>Check: {settings.defaultPayoutCheckRate}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* 2. OWNER SECURITY */}
                    <button
                        type="button"
                        onClick={startPinChange}
                        className="w-full h-12 px-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-100 transition active:translate-y-[1px]"
                    >
                        Change Owner PIN
                    </button>

                    {/* 3. LOYALTY RULES */}
                    <div className="form-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <h3 style={{ margin: 0 }}><strong>Loyalty Rules</strong></h3>
                            {!isEditingLoyalty && (
                                <button
                                    type="button"
                                    className="h-8 px-4 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
                                    onClick={startEditLoyalty}
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {isEditingLoyalty ? (
                            <>
                                <div style={{ marginBottom: 15 }}>
                                    <label style={{ display: 'block', marginBottom: 5 }}>
                                        <input
                                            type="radio"
                                            checked={loyaltyDraft.loyaltyEarn?.mode === 'PER_DOLLAR'}
                                            onChange={() => setLoyaltyDraft({
                                                ...loyaltyDraft,
                                                loyaltyEarn: { mode: 'PER_DOLLAR', pointsPerDollarSpent: 1 }
                                            })}
                                        />
                                        <strong> Earn per Dollar Spent</strong>
                                    </label>

                                    {loyaltyDraft.loyaltyEarn?.mode === 'PER_DOLLAR' && (
                                        <div className="ml-6 mt-3 flex items-center gap-3">
                                            <label className="text-sm font-medium text-slate-600">Points per $1:</label>
                                            <input
                                                type="number"
                                                className="w-20 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                value={loyaltyDraft.loyaltyEarn.pointsPerDollarSpent}
                                                onChange={e => setLoyaltyDraft({
                                                    ...loyaltyDraft,
                                                    loyaltyEarn: { ...loyaltyDraft.loyaltyEarn, pointsPerDollarSpent: parseFloat(e.target.value) } as any
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            checked={loyaltyDraft.loyaltyEarn?.mode === 'PER_VISIT'}
                                            onChange={() => setLoyaltyDraft({
                                                ...loyaltyDraft,
                                                loyaltyEarn: { mode: 'PER_VISIT', pointsPerVisit: 1, minServiceCentsToCount: 0 }
                                            })}
                                        />
                                        <strong className="text-slate-800">Earn per Visit</strong>
                                    </label>

                                    {loyaltyDraft.loyaltyEarn?.mode === 'PER_VISIT' && (
                                        <div className="ml-6 mt-3 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm font-medium text-slate-600 w-28">Points per Visit:</label>
                                                <input
                                                    type="number"
                                                    className="w-24 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    value={loyaltyDraft.loyaltyEarn.pointsPerVisit}
                                                    onChange={e => setLoyaltyDraft({
                                                        ...loyaltyDraft,
                                                        loyaltyEarn: { ...loyaltyDraft.loyaltyEarn, pointsPerVisit: parseFloat(e.target.value) } as any
                                                    })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="text-sm font-medium text-slate-600 w-28">Min. Spend (¢):</label>
                                                <input
                                                    type="number"
                                                    className="w-24 h-9 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                                    value={loyaltyDraft.loyaltyEarn.minServiceCentsToCount}
                                                    onChange={e => setLoyaltyDraft({
                                                        ...loyaltyDraft,
                                                        loyaltyEarn: { ...loyaltyDraft.loyaltyEarn, minServiceCentsToCount: parseInt(e.target.value) } as any
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={saveLoyalty}
                                        className="h-10 px-6 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="h-10 px-6 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                                        onClick={cancelEditLoyalty}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: '0.95em' }}>
                                <div style={{ marginBottom: 10 }}>
                                    <strong>Strategy:</strong> <br />
                                    <span>{settings.loyaltyEarn.mode === 'PER_DOLLAR' ? 'Earn per Dollar Spent' : 'Earn per Visit'}</span>
                                </div>

                                {settings.loyaltyEarn.mode === 'PER_DOLLAR' ? (
                                    <div>
                                        <strong>Value:</strong> <br />
                                        <span>{settings.loyaltyEarn.pointsPerDollarSpent} Points</span> per $1.00
                                    </div>
                                ) : (
                                    <div>
                                        <strong>Value:</strong> <br />
                                        <span>{settings.loyaltyEarn.pointsPerVisit} Points</span> per Visit (Min {settings.loyaltyEarn.minServiceCentsToCount}¢)
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PinModal
                open={showPinModal}
                title={pinStep === 'VERIFY_OLD' ? "Enter Current PIN" : "Enter New PIN"}
                onClose={() => setShowPinModal(false)}
                onSubmit={handlePinSubmit}
            />
        </div>
    );
}

// Helpers
function calculateNextPayDate(startISO: string, freqDays: number): string {
    if (!startISO || freqDays <= 0) return "Invalid settings";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = startISO.split('-').map(Number);
    const startDate = new Date(y, m - 1, d);
    if (isNaN(startDate.getTime())) return "Invalid settings";
    let payDate = new Date(startDate);
    payDate.setDate(payDate.getDate() + (freqDays - 1));
    while (payDate < today) {
        payDate.setDate(payDate.getDate() + freqDays);
    }
    return payDate.toDateString();
}