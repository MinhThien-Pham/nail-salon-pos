// src/MarketingManager.tsx
import { useState, useEffect } from 'react';
import { Settings } from './shared/types';

export function MarketingManager() {
  const [promos, setPromos] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  
  // Creation/Editing State
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  
  const [isCreatingRedemption, setIsCreatingRedemption] = useState(false);
  const [editingRedemptionId, setEditingRedemptionId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // We no longer need to load settings here for Loyalty
    // but if you need settings for other things later, use:
    // const s = await window.api.getSettings(); 

    const p = await window.api.getPromos();
    setPromos(p);
    
    const r = await window.api.getRedemptions();
    setRedemptions(r);
  };

  // --- PROMO HANDLERS ---
  const handleSavePromo = async (data: any) => {
    if (editingPromoId) {
        await window.api.updatePromo(editingPromoId, data);
        setEditingPromoId(null);
    } else {
        await window.api.createPromo(data);
        setIsCreatingPromo(false);
    }
    loadData();
  };

  const handleDeletePromo = async (id: number) => {
    if (confirm("Delete this promo?")) await window.api.deletePromo(id);
    loadData();
  };

  // --- REDEMPTION HANDLERS ---
  const handleSaveRedemption = async (data: any) => {
    if (editingRedemptionId) {
        await window.api.updateRedemption(editingRedemptionId, data);
        setEditingRedemptionId(null);
    } else {
        await window.api.createRedemption(data);
        setIsCreatingRedemption(false);
    }
    loadData();
  };

  const handleDeleteRedemption = async (id: number) => {
    if (confirm("Delete this reward?")) await window.api.deleteRedemption(id);
    loadData();
  };

  // --- RENDER HELPERS ---
  const renderPromoItem = (p: any) => {
    if (editingPromoId === p.promoId) {
        return (
            <div key={p.promoId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
                <PromoForm initialData={p} onSave={handleSavePromo} onCancel={() => setEditingPromoId(null)} />
            </div>
        );
    }

    const endDate = new Date(p.time.startISO);
    endDate.setDate(endDate.getDate() + p.time.durationDays);

    return (
        <div key={p.promoId} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong>{p.name}</strong> 
                        {!p.isActive && <span style={{ fontSize: '0.7em', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4 }}>Inactive</span>}
                    </div>
                    
                    <div style={{ fontSize: '0.9em', color: '#4b5563', marginTop: 4, lineHeight: '1.5' }}>
                        Code: <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 4px', borderRadius: 3 }}>{p.couponCode}</span>
                        {' • '}
                        Reward: <strong>{p.reward.type === 'CREDIT' ? `$${(p.reward.creditCents/100).toFixed(2)} Off` : `${p.reward.percentOffService}% Off`}</strong>
                    </div>
                    
                    <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: 2 }}>
                        Min Spend: <strong>${(p.minServiceCents/100).toFixed(2)}</strong>
                        {' • '}
                        Ends: {endDate.toLocaleDateString()} ({p.time.durationDays} days)
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                    <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => setEditingPromoId(p.promoId)}>Edit</button>
                    <button style={{ backgroundColor: '#ef4444', padding: '4px 8px', fontSize: '0.8em' }} onClick={() => handleDeletePromo(p.promoId)}>Del</button>
                </div>
            </div>
        </div>
    );
  };

  const renderRedemptionItem = (r: any) => {
    if (editingRedemptionId === r.redemptionId) {
        return (
            <div key={r.redemptionId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
                <RedemptionForm initialData={r} onSave={handleSaveRedemption} onCancel={() => setEditingRedemptionId(null)} />
            </div>
        );
    }
    return (
        <div key={r.redemptionId} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong>{r.name}</strong>
                        {!r.isActive && <span style={{ fontSize: '0.7em', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4 }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#4b5563', marginTop: 4 }}>
                        Cost: <strong>{r.redeemPointsCost} pts</strong>
                        {' • '}
                        Reward: <strong>{r.reward.type === 'CREDIT' ? `$${(r.reward.creditCents/100).toFixed(2)} Off` : `${r.reward.percentOffService}% Off`}</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                    <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => setEditingRedemptionId(r.redemptionId)}>Edit</button>
                    <button style={{ backgroundColor: '#ef4444', padding: '4px 8px', fontSize: '0.8em' }} onClick={() => handleDeleteRedemption(r.redemptionId)}>Del</button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div>
        <h2>Marketing & Promotions</h2>

        {/* 1. SPLIT LAYOUT: PROMOS (LEFT) & REDEMPTIONS (RIGHT) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 20 }}>
            
            {/* --- LEFT COLUMN: PROMOTIONS --- */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3>Promotions</h3>
                    {!isCreatingPromo && !editingPromoId && (
                        <button onClick={() => setIsCreatingPromo(true)}>+ Add Promo</button>
                    )}
                </div>

                {isCreatingPromo && (
                    <div className="form-section" style={{ border: '2px solid #3b82f6' }}>
                        <h4 style={{ marginTop: 0 }}>New Promotion</h4>
                        <PromoForm onSave={handleSavePromo} onCancel={() => setIsCreatingPromo(false)} />
                    </div>
                )}

                <div className="form-section">
                    <h4 style={{ color: '#059669', borderBottom: '2px solid #059669', paddingBottom: 5, marginTop: 0 }}>Active</h4>
                    {promos.filter(p => p.isActive).map(renderPromoItem)}
                    {promos.filter(p => p.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No active promotions</p>}

                    <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>Inactive</h4>
                    {promos.filter(p => !p.isActive).map(renderPromoItem)}
                    {promos.filter(p => !p.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No inactive promotions</p>}
                </div>
            </div>

            {/* --- RIGHT COLUMN: REDEMPTIONS --- */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3>Reward Redemptions</h3>
                    {!isCreatingRedemption && !editingRedemptionId && (
                        <button onClick={() => setIsCreatingRedemption(true)}>+ Add Redemption</button>
                    )}
                </div>

                {isCreatingRedemption && (
                    <div className="form-section" style={{ border: '2px solid #3b82f6' }}>
                        <h4 style={{ marginTop: 0 }}>New Reward</h4>
                        <RedemptionForm onSave={handleSaveRedemption} onCancel={() => setIsCreatingRedemption(false)} />
                    </div>
                )}

                <div className="form-section">
                    <h4 style={{ color: '#059669', borderBottom: '2px solid #059669', paddingBottom: 5, marginTop: 0 }}>Active</h4>
                    {redemptions.filter(r => r.isActive).map(renderRedemptionItem)}
                    {redemptions.filter(r => r.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No active rewards</p>}

                    <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>Inactive</h4>
                    {redemptions.filter(r => !r.isActive).map(renderRedemptionItem)}
                    {redemptions.filter(r => !r.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No inactive rewards</p>}
                </div>
            </div>

        </div>
    </div>
  );
}

// ==========================================
// REUSABLE FORM COMPONENTS (Keep your existing PromoForm and RedemptionForm helper functions below)
// ==========================================

// --- HELPER: Date Utils ---
const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const getDiffDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

function PromoForm({ initialData, onSave, onCancel }: any) {
    const today = new Date().toISOString().split('T')[0];
    
    const defaultState = {
        name: '',
        couponCode: '',
        isActive: true,
        minServiceCents: 0,
        time: { startISO: today, durationDays: 30 },
        reward: { type: 'CREDIT', creditCents: 500, percentOffService: 10 },
        audience: null as any
    };

    const [data, setData] = useState(initialData || defaultState);
    
    // UI Local State
    const [rewardType, setRewardType] = useState<'CREDIT' | 'PERCENT'>(data.reward.type);
    const [creditValue, setCreditValue] = useState(data.reward.creditCents ? data.reward.creditCents / 100 : 5);
    const [percentValue, setPercentValue] = useState(data.reward.percentOffService || 10);
    const [minSpend, setMinSpend] = useState(data.minServiceCents / 100);

    // Date Logic State
    const [startDate, setStartDate] = useState(data.time.startISO);
    const [duration, setDuration] = useState(data.time.durationDays);
    const [endDate, setEndDate] = useState(addDays(data.time.startISO, data.time.durationDays));

    // Date Calculators
    const handleDurationChange = (d: number) => {
        setDuration(d);
        setEndDate(addDays(startDate, d));
    };

    const handleEndDateChange = (dateStr: string) => {
        setEndDate(dateStr);
        setDuration(getDiffDays(startDate, dateStr));
    };

    const handleStartDateChange = (dateStr: string) => {
        setStartDate(dateStr);
        setEndDate(addDays(dateStr, duration)); // Keep duration fixed when moving start date
    };

    const handleSubmit = () => {
        const payload = {
            ...data,
            minServiceCents: minSpend * 100,
            time: { startISO: startDate, durationDays: duration },
            reward: rewardType === 'CREDIT' 
                ? { type: 'CREDIT', creditCents: creditValue * 100 }
                : { type: 'PERCENT', percentOffService: percentValue }
        };
        onSave(payload);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Promo Name:</label>
                <input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="e.g. Summer Sale" />
            </div>
            <div className="form-group">
                <label>Coupon Code:</label>
                <input value={data.couponCode} onChange={e => setData({...data, couponCode: e.target.value})} placeholder="e.g. SUMMER20" />
            </div>
             <div className="form-group">
                <label>Min. Spend ($):</label>
                <input type="number" step="0.01" value={minSpend} onChange={e => setMinSpend(parseFloat(e.target.value))} />
            </div>

            {/* DATE SECTION */}
            <div style={{ gridColumn: 'span 2', background: '#f0f9ff', padding: 10, borderRadius: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                    <label style={{ fontSize: '0.85em' }}>Start Date</label>
                    <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '0.85em' }}>End Date</label>
                    <input type="date" value={endDate} onChange={e => handleEndDateChange(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '0.85em' }}>Duration (Days)</label>
                    <input type="number" value={duration} onChange={e => handleDurationChange(parseInt(e.target.value))} />
                </div>
            </div>
            
            {/* REWARD SECTION */}
            <div className="form-group" style={{ gridColumn: 'span 2', background: '#f9fafb', padding: 10, borderRadius: 4 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                    <label style={{ fontWeight: 'bold' }}>Reward Type:</label>
                    <label>
                        <input type="radio" checked={rewardType === 'CREDIT'} onChange={() => setRewardType('CREDIT')} /> 
                        $ Fixed Amount Off
                    </label>
                    <label>
                        <input type="radio" checked={rewardType === 'PERCENT'} onChange={() => setRewardType('PERCENT')} /> 
                        % Percentage Off
                    </label>
                </div>

                {rewardType === 'CREDIT' ? (
                    <div>
                        <label>Discount Amount ($): </label>
                        <input type="number" step="0.01" value={creditValue} onChange={e => setCreditValue(parseFloat(e.target.value))} />
                    </div>
                ) : (
                    <div>
                        <label>Percentage Off (%): </label>
                        <input type="number" value={percentValue} onChange={e => setPercentValue(parseFloat(e.target.value))} />
                    </div>
                )}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>
                    <input type="checkbox" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} style={{ marginRight: 10 }} />
                    Active Status
                </label>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: 5, display: 'flex', gap: 10 }}>
                <button onClick={handleSubmit}>Save Promo</button>
                <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

function RedemptionForm({ initialData, onSave, onCancel }: any) {
    const defaultState = {
        name: '',
        isActive: true,
        redeemPointsCost: 100,
        audience: null as any,
        reward: { type: 'CREDIT', creditCents: 500, percentOffService: 10 }
    };

    const [data, setData] = useState(initialData || defaultState);

    const [rewardType, setRewardType] = useState<'CREDIT' | 'PERCENT'>(data.reward.type);
    const [creditValue, setCreditValue] = useState(data.reward.creditCents ? data.reward.creditCents / 100 : 5);
    const [percentValue, setPercentValue] = useState(data.reward.percentOffService || 10);

    const handleSubmit = () => {
        const payload = {
            ...data,
            reward: rewardType === 'CREDIT' 
                ? { type: 'CREDIT', creditCents: creditValue * 100 }
                : { type: 'PERCENT', percentOffService: percentValue }
        };
        onSave(payload);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Reward Name:</label>
                <input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="e.g. $5 Off Voucher" />
            </div>
            <div className="form-group">
                <label>Points Cost:</label>
                <input type="number" value={data.redeemPointsCost} onChange={e => setData({...data, redeemPointsCost: parseInt(e.target.value)})} />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2', background: '#f9fafb', padding: 10, borderRadius: 4 }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                    <label style={{ fontWeight: 'bold' }}>Reward Value:</label>
                    <label>
                        <input type="radio" checked={rewardType === 'CREDIT'} onChange={() => setRewardType('CREDIT')} /> 
                        $ Fixed Amount Off
                    </label>
                    <label>
                        <input type="radio" checked={rewardType === 'PERCENT'} onChange={() => setRewardType('PERCENT')} /> 
                        % Percentage Off
                    </label>
                </div>

                {rewardType === 'CREDIT' ? (
                    <div>
                        <label>Discount Amount ($): </label>
                        <input type="number" step="0.01" value={creditValue} onChange={e => setCreditValue(parseFloat(e.target.value))} />
                    </div>
                ) : (
                    <div>
                        <label>Percentage Off (%): </label>
                        <input type="number" value={percentValue} onChange={e => setPercentValue(parseFloat(e.target.value))} />
                    </div>
                )}
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>
                    <input type="checkbox" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} style={{ marginRight: 10 }} />
                    Active Status
                </label>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: 5, display: 'flex', gap: 10 }}>
                <button onClick={handleSubmit}>Save Reward</button>
                <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}