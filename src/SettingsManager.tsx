import { useState, useEffect } from 'react';
import { Settings } from './shared/types';

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [nextPayDatePreview, setNextPayDatePreview] = useState<string>('');
  
  // PIN Change State
  const [showSecurity, setShowSecurity] = useState(false); // Controls visibility
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  // Load data on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Recalculate preview whenever settings change
  useEffect(() => {
    if (settings?.periodStartDate && settings?.periodDays) {
        const nextDate = calculateNextPayDate(settings.periodStartDate, settings.periodDays);
        setNextPayDatePreview(nextDate);
    }
  }, [settings?.periodStartDate, settings?.periodDays]);

  const loadSettings = async () => {
    const s = await window.api.getSettings(); 
    setSettings(s);
  };

  const handleSave = async () => {
    if (!settings) return;
    await window.api.updateSettings(settings);
    alert('Settings updated successfully!');
    loadSettings();
  };

  const handleChangeOwnerPin = async () => {
    if (!oldPin || !newPin) return alert("Please enter both current and new PINs.");
    if (newPin.length < 4) return alert("New PIN is too short (min 4 chars).");

    try {
        await window.api.changeOwnPin(1, oldPin, newPin);
        alert("Owner PIN updated successfully!");
        setOldPin('');
        setNewPin('');
        setShowSecurity(false); // Close the section on success
    } catch (err) {
        console.error(err);
        alert("Failed to update PIN. Please check your current PIN.");
    }
  };

  if (!settings) return <div>Loading settings...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>System Settings</h2>
        <button onClick={handleSave}>Save Changes</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* 1. PAYROLL CONFIGURATION */}
        <div className="form-section">
            <h3>Payroll Configuration</h3>
            
            <div className="form-group">
                <label>Pay Period Frequency (Days):</label>
                <input 
                    type="number" 
                    value={settings.periodDays} 
                    onChange={e => setSettings({...settings, periodDays: parseInt(e.target.value) || 0})} 
                />
                <small style={{ display: 'block', color: '#666' }}>Example: 14 for Bi-weekly</small>
            </div>

            <div className="form-group">
                <label>Period Starts On:</label>
                <DatePicker 
                    value={settings.periodStartDate} 
                    onChange={(date) => setSettings({...settings, periodStartDate: date})}
                    disablePast={false} 
                />
                <small style={{ display: 'block', color: '#666', marginTop: 5 }}>
                    Next Pay Date: <strong style={{ color: '#000' }}>{nextPayDatePreview}</strong>
                </small>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 10, borderBottom: '1px solid #eee' }}>Default Staff Rates</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                    <label>Comm. Rate (0-1):</label>
                    <input 
                        type="number" step="0.01" 
                        value={settings.defaultCommissionTechRate} 
                        onChange={e => setSettings({...settings, defaultCommissionTechRate: parseFloat(e.target.value)})} 
                    />
                </div>
                <div className="form-group">
                    <label>Check Rate (0-1):</label>
                    <input 
                        type="number" step="0.01" 
                        value={settings.defaultPayoutCheckRate} 
                        onChange={e => setSettings({...settings, defaultPayoutCheckRate: parseFloat(e.target.value)})} 
                    />
                </div>
            </div>
        </div>

        {/* 2. LOYALTY RULES */}
        <div className="form-section">
            <h3>Loyalty Program Rules</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: 15 }}>
                Define how customers earn points in your salon.
            </p>

            <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5 }}>
                    <input 
                        type="radio" 
                        checked={settings.loyaltyEarn.mode === 'PER_DOLLAR'} 
                        onChange={() => setSettings({
                            ...settings, 
                            loyaltyEarn: { mode: 'PER_DOLLAR', pointsPerDollarSpent: 1 }
                        })}
                    /> 
                    <strong> Earn per Dollar Spent</strong>
                </label>
                
                {settings.loyaltyEarn.mode === 'PER_DOLLAR' && (
                    <div style={{ marginLeft: 25, marginTop: 5, background: '#f9fafb', padding: 10, borderRadius: 4 }}>
                        <label style={{ marginRight: 10 }}>Points per $1:</label>
                        <input 
                            type="number" style={{ width: 80 }} 
                            value={(settings.loyaltyEarn as any).pointsPerDollarSpent} 
                            onChange={e => setSettings({
                                ...settings, 
                                loyaltyEarn: { ...settings.loyaltyEarn, pointsPerDollarSpent: parseFloat(e.target.value) } as any
                            })} 
                        />
                    </div>
                )}
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: 5 }}>
                    <input 
                        type="radio" 
                        checked={settings.loyaltyEarn.mode === 'PER_VISIT'} 
                        onChange={() => setSettings({
                            ...settings, 
                            loyaltyEarn: { mode: 'PER_VISIT', pointsPerVisit: 1, minServiceCentsToCount: 0 }
                        })}
                    /> 
                    <strong> Earn per Visit</strong>
                </label>

                {settings.loyaltyEarn.mode === 'PER_VISIT' && (
                    <div style={{ marginLeft: 25, marginTop: 5, background: '#f9fafb', padding: 10, borderRadius: 4 }}>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: 'inline-block', width: 140 }}>Points per Visit:</label>
                            <input 
                                type="number" style={{ width: 80 }} 
                                value={(settings.loyaltyEarn as any).pointsPerVisit} 
                                onChange={e => setSettings({
                                    ...settings, 
                                    loyaltyEarn: { ...settings.loyaltyEarn, pointsPerVisit: parseFloat(e.target.value) } as any
                                })} 
                            />
                        </div>
                        
                        <div>
                            <label style={{ display: 'inline-block', width: 140 }}>Min Spend ($):</label>
                            <input 
                                type="number" step="0.01" style={{ width: 80 }} 
                                value={((settings.loyaltyEarn as any).minServiceCentsToCount || 0) / 100} 
                                onChange={e => setSettings({
                                    ...settings, 
                                    loyaltyEarn: { 
                                        ...settings.loyaltyEarn, 
                                        minServiceCentsToCount: parseFloat(e.target.value) * 100 
                                    } as any
                                })} 
                            />
                            <small style={{ marginLeft: 10, color: '#666' }}>(0 = No minimum)</small>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>

      {/* 3. SECURITY SECTION (Collapsible) */}
      <div className="form-section" style={{ marginTop: 20, border: '1px solid #fca5a5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#b91c1c', margin: 0 }}>Owner Security</h3>
            {!showSecurity && (
                <button 
                    onClick={() => setShowSecurity(true)} 
                    style={{ backgroundColor: '#dc2626', padding: '8px 16px', fontSize: '0.9em' }}
                >
                    Change Master PIN
                </button>
            )}
        </div>

        {showSecurity && (
            <div style={{ marginTop: 20, borderTop: '1px solid #fecaca', paddingTop: 15 }}>
                <p style={{ fontSize: '0.9em', color: '#666', marginBottom: 15 }}>
                    Enter your current PIN to verify your identity, then set a new one.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Current PIN:</label>
                        <input 
                            type="password" 
                            value={oldPin} 
                            onChange={e => setOldPin(e.target.value)} 
                            placeholder="Verify it's you"
                        />
                    </div>
                    <div className="form-group">
                        <label>New PIN:</label>
                        <input 
                            type="password" 
                            value={newPin} 
                            onChange={e => setNewPin(e.target.value)} 
                            placeholder="New Secret PIN"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={handleChangeOwnerPin} style={{ backgroundColor: '#dc2626', flex: 1, height: '42px' }}>
                            Update
                        </button>
                        <button onClick={() => setShowSecurity(false)} className="secondary" style={{ flex: 1, height: '42px' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// HELPERS & COMPONENTS
// ==========================================

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
    return formatDate(payDate);
}

function formatDate(date: Date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dayName} ${mm} ${dd} ${yyyy}`;
}

function DatePicker({ value, onChange, disablePast = false }: { value: string, onChange: (val: string) => void, disablePast?: boolean }) {
    const today = new Date().toISOString().split('T')[0];
    return (
        <input 
            type="date" 
            value={value} 
            min={disablePast ? today : undefined}
            onChange={(e) => onChange(e.target.value)}
            style={{ 
                padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                fontFamily: 'inherit', width: '180px' 
            }}
        />
    );
}