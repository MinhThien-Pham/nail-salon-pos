import { useState, useEffect } from 'react';
import { Settings } from '../../shared/types';
import { NumPadModal } from '../../components/NumPadModal';

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

  // --- Draft States (Holds changes before Save) ---
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
    // Deep copy loyalty config to avoid reference issues
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

  const handlePinSubmit = async (val: string) => {
    if (pinStep === 'VERIFY_OLD') {
        try {
            const isValid = await window.api.verifyOwner(val);
            if (isValid) {
                setTempOldPin(val);
                setPinStep('ENTER_NEW');
            } else {
                setShowPinModal(false);
                setPinMessage({ text: 'Incorrect current PIN.', type: 'error' });
            }
        } catch (e) {
            setShowPinModal(false);
            setPinMessage({ text: 'Error verifying PIN.', type: 'error' });
        }
    } else {
        if (val.length < 4) {
            setShowPinModal(false);
            setPinMessage({ text: 'New PIN too short (min 4).', type: 'error' });
            return;
        }
        await window.api.changeOwnPin(1, tempOldPin, val); 
        setShowPinModal(false);
        setPinMessage({ text: 'Owner PIN updated successfully.', type: 'success' });
    }
  };

  // Helper for rendering
  const nextPayDate = settings ? calculateNextPayDate(
      isEditingPayroll ? payrollDraft.periodStartDate! : settings.periodStartDate, 
      isEditingPayroll ? payrollDraft.periodDays! : settings.periodDays
  ) : '';

  if (!settings) return <div>Loading settings...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>System Settings</h2>
        {/* Global Save Removed - using per-section save */}
      </div>
      
      {/* Feedback Message Area */}
      {pinMessage.text && (
        <div style={{ 
            marginBottom: 20, padding: 10, borderRadius: 6, 
            background: pinMessage.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: pinMessage.type === 'error' ? '#b91c1c' : '#166534'
        }}>
            {pinMessage.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* 1. PAYROLL CONFIGURATION */}
        <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0 }}>Payroll Configuration</h3>
                {!isEditingPayroll && <button className="secondary" style={{padding: '4px 10px', fontSize: '0.8em'}} onClick={startEditPayroll}>Edit</button>}
            </div>
            
            {isEditingPayroll ? (
                // --- EDIT MODE ---
                <>
                    <div className="form-group">
                        <label>Pay Period Frequency (Days):</label>
                        <input type="number" value={payrollDraft.periodDays} onChange={e => setPayrollDraft({...payrollDraft, periodDays: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="form-group">
                        <label>Period Starts On:</label>
                        <input type="date" value={payrollDraft.periodStartDate} onChange={(e) => setPayrollDraft({...payrollDraft, periodStartDate: e.target.value})} style={{padding:8, borderRadius:4, border:'1px solid #ddd'}}/>
                        <small style={{ display: 'block', marginTop: 5 }}>Preview Next Pay Date: <strong>{nextPayDate}</strong></small>
                    </div>
                    <h4 style={{ marginTop: 20, marginBottom: 10, borderBottom: '1px solid #eee' }}>Default Staff Rates</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                            <label>Comm. Rate (0-1):</label>
                            <input type="number" step="0.01" value={payrollDraft.defaultCommissionTechRate} onChange={e => setPayrollDraft({...payrollDraft, defaultCommissionTechRate: parseFloat(e.target.value)})} />
                        </div>
                        <div className="form-group">
                            <label>Check Rate (0-1):</label>
                            <input type="number" step="0.01" value={payrollDraft.defaultPayoutCheckRate} onChange={e => setPayrollDraft({...payrollDraft, defaultPayoutCheckRate: parseFloat(e.target.value)})} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                        <button onClick={savePayroll}>Save</button>
                        <button className="secondary" onClick={cancelEditPayroll}>Cancel</button>
                    </div>
                </>
            ) : (
                // --- VIEW MODE ---
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
            
            {/* 2. OWNER SECURITY (Always Active) */}
            <div className="form-section" style={{ borderColor: '#fca5a5' }}>
                <h3 style={{ marginTop: 0, color: '#b91c1c' }}>Owner Security</h3>
                <p style={{ fontSize: '0.9em', color: '#666' }}>Manage Master PIN access.</p>
                <button onClick={startPinChange} style={{ background: '#ef4444' }}>Change Owner PIN</button>
            </div>

            {/* 3. LOYALTY RULES */}
            <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ margin: 0 }}>Loyalty Rules</h3>
                    {!isEditingLoyalty && <button className="secondary" style={{padding: '4px 10px', fontSize: '0.8em'}} onClick={startEditLoyalty}>Edit</button>}
                </div>

                {isEditingLoyalty ? (
                    // --- EDIT MODE ---
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
                                <div style={{ marginLeft: 25, marginTop: 5 }}>
                                    <label style={{ marginRight: 10 }}>Points per $1:</label>
                                    <input 
                                        type="number" style={{ width: 80 }} 
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
                            <label style={{ display: 'block', marginBottom: 5 }}>
                                <input 
                                    type="radio" 
                                    checked={loyaltyDraft.loyaltyEarn?.mode === 'PER_VISIT'} 
                                    onChange={() => setLoyaltyDraft({
                                        ...loyaltyDraft, 
                                        loyaltyEarn: { mode: 'PER_VISIT', pointsPerVisit: 1, minServiceCentsToCount: 0 }
                                    })}
                                /> 
                                <strong> Earn per Visit</strong>
                            </label>

                            {loyaltyDraft.loyaltyEarn?.mode === 'PER_VISIT' && (
                                <div style={{ marginLeft: 25, marginTop: 5 }}>
                                    <div style={{ marginBottom: 5 }}>
                                        <label style={{ marginRight: 10 }}>Points per Visit:</label>
                                        <input 
                                            type="number" style={{ width: 80 }} 
                                            value={loyaltyDraft.loyaltyEarn.pointsPerVisit} 
                                            onChange={e => setLoyaltyDraft({
                                                ...loyaltyDraft, 
                                                loyaltyEarn: { ...loyaltyDraft.loyaltyEarn, pointsPerVisit: parseFloat(e.target.value) } as any
                                            })} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                            <button onClick={saveLoyalty}>Save</button>
                            <button className="secondary" onClick={cancelEditLoyalty}>Cancel</button>
                        </div>
                    </>
                ) : (
                    // --- VIEW MODE ---
                    <div style={{ fontSize: '0.95em' }}>
                        <div style={{ marginBottom: 10 }}>
                            <span style={{ color: '#666' }}>Strategy:</span> <br/>
                            <strong>{settings.loyaltyEarn.mode === 'PER_DOLLAR' ? 'Earn per Dollar Spent' : 'Earn per Visit'}</strong>
                        </div>
                        
                        {settings.loyaltyEarn.mode === 'PER_DOLLAR' ? (
                            <div>
                                <span style={{ color: '#666' }}>Value:</span> <br/>
                                <strong>{settings.loyaltyEarn.pointsPerDollarSpent} Points</strong> per $1.00
                            </div>
                        ) : (
                            <div>
                                <span style={{ color: '#666' }}>Value:</span> <br/>
                                <strong>{settings.loyaltyEarn.pointsPerVisit} Points</strong> per Visit
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      <NumPadModal 
        isOpen={showPinModal}
        title={pinStep === 'VERIFY_OLD' ? "Enter Current PIN" : "Enter New PIN"}
        isSecure={true}
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