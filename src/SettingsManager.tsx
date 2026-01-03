import { useState, useEffect } from 'react';
import { Settings, DayOfWeek } from './shared/types';

export function SettingsManager() {
  const [settings, setSettings] = useState<Settings | null>(null);
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await window.api.getSettings(); 
    setSettings(s)
  };

  const handleSave = async () => {
    if (!settings) return;
    await window.api.updateSettings(settings);
    alert('Settings updated successfully!');
    loadSettings();
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
                    onChange={e => setSettings({...settings, periodDays: parseInt(e.target.value)})} 
                />
                <small style={{ display: 'block', color: '#666' }}>Example: 14 for Bi-weekly</small>
            </div>

            <div className="form-group">
                <label>Period Starts On:</label>
                <select 
                    value={settings.periodStartDayofWeek} 
                    onChange={e => setSettings({...settings, periodStartDayofWeek: e.target.value as DayOfWeek})}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
                >
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
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
                    <div style={{ marginLeft: 25, marginTop: 5 }}>
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
                    <div style={{ marginLeft: 25, marginTop: 5 }}>
                        <div style={{ marginBottom: 5 }}>
                            <label style={{ marginRight: 10 }}>Points per Visit:</label>
                            <input 
                                type="number" style={{ width: 80 }} 
                                value={(settings.loyaltyEarn as any).pointsPerVisit} 
                                onChange={e => setSettings({
                                    ...settings, 
                                    loyaltyEarn: { ...settings.loyaltyEarn, pointsPerVisit: parseFloat(e.target.value) } as any
                                })} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}