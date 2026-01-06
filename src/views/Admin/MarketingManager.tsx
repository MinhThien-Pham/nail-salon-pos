import React, { useState, useEffect } from 'react';
import { Promo, LoyaltyTier, LifecycleStage, Reward, Audience, RewardRedemption } from '../../shared/types';

export function MarketingManager() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [isCreatingRedemption, setIsCreatingRedemption] = useState(false);
  const [editingRedemptionId, setEditingRedemptionId] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
        const p = await window.api.getPromos();
        setPromos(p || []);
        const r = await window.api.getRedemptions();
        setRedemptions(r || []);
    } catch(err) {
        console.error("Failed to load marketing data", err);
    }
  };

  const handleSavePromo = async (data: Promo) => {
    try {
        if (editingPromoId) {
            await window.api.updatePromo(editingPromoId, data);
            setEditingPromoId(null);
        } else {
            await window.api.createPromo(data);
            setIsCreatingPromo(false);
        }
        loadData();
    } catch (e) {
        console.error(e);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (id <= 2) return; 
    if (confirm("Delete this promo?")) {
        await window.api.deletePromo(id);
        loadData();
    }
  };

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
    if (confirm("Delete this reward?")) {
        await window.api.deleteRedemption(id);
        loadData();
    }
  };

  // --- HELPER: CATEGORIZE PROMOS ---
  const categorizePromos = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const live: Promo[] = [];
    const scheduled: Promo[] = [];
    const expired: Promo[] = [];
    const inactive: Promo[] = [];

    promos.forEach(p => {
        if (!p.isActive) {
            inactive.push(p);
            return;
        }
        if (p.promoId <= 2) {
            live.push(p);
            return;
        }
        if (p.startISO && p.endISO) {
            if (p.startISO > today) {
                scheduled.push(p);
            } else if (p.endISO < today) {
                expired.push(p);
            } else {
                live.push(p);
            }
        } else {
            inactive.push(p);
        }
    });

    return { live, scheduled, expired, inactive };
  };

  const { live, scheduled, expired, inactive } = categorizePromos();

  // --- RENDERERS ---

  const badgeStyle = (bgColor: string, color: string, border: string = 'none') => ({
    fontSize: '0.75em',
    background: bgColor,
    color: color,
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 600,
    marginRight: 6,
    display: 'inline-block',
    border: border
  });

  // Audience Pill Style
  const audienceStyle = (type: 'TIER' | 'STAGE') => ({
    fontSize: '0.7em',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
    marginRight: 4,
    backgroundColor: type === 'TIER' ? '#fef9c3' : '#e0f2fe', // Yellow for Tiers, Blue for Stages
    color: type === 'TIER' ? '#854d0e' : '#0369a1',
    border: type === 'TIER' ? '1px solid #fde047' : '1px solid #bae6fd'
  });

  const renderAudienceBadges = (audience: Audience) => {
      const items: React.ReactNode[] = []; // FIXED: Use React.ReactNode[]
      if (audience?.tiers) {
          audience.tiers.forEach((t) => items.push(<span key={t} style={audienceStyle('TIER')}>{t}</span>));
      }
      if (audience?.stages) {
          audience.stages.forEach((s) => items.push(<span key={s} style={audienceStyle('STAGE')}>{s}</span>));
      }
      return items;
  };

  const renderPromoItem = (p: Promo, status: 'LIVE' | 'FUTURE' | 'EXPIRED' | 'INACTIVE') => {
    if (editingPromoId === p.promoId) {
        return (
            <div key={p.promoId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
                <PromoForm initialData={p} onSave={handleSavePromo} onCancel={() => setEditingPromoId(null)} />
            </div>
        );
    }

    const isSystem = p.promoId <= 2;
    
    // --- Badge Logic ---
    const badges = [];

    if (p.triggerType === 'CUSTOMER_DATE_DRIVEN') {
        const label = p.promoId === 1 ? '🎂 Birthday' : '🎉 Anniversary';
        badges.push(<span key="trig" style={badgeStyle('#e0e7ff', '#3730a3')}>{label}</span>);
    } 
    
    if (status === 'LIVE' && !isSystem) {
        badges.push(<span key="date" style={badgeStyle('#fff1f2', '#be123c', '1px solid #fecdd3')}>Expires {p.endISO}</span>);
    } else if (status === 'FUTURE') {
        badges.push(<span key="date" style={badgeStyle('#eff6ff', '#1d4ed8')}>Starts {p.startISO}</span>);
    } else if (status === 'EXPIRED') {
        badges.push(<span key="date" style={badgeStyle('#f3f4f6', '#6b7280')}>Ended {p.endISO}</span>);
    }

    if (p.recurEveryDays > 0) {
        badges.push(
            <span key="recur" style={badgeStyle('#fef3c7', '#92400e')}>
                Repeats every <strong>{p.recurEveryDays}</strong> days
            </span>
        );
    }

    // Border color based on status
    let borderColor = '#eee'; 
    if (status === 'LIVE') borderColor = '#22c55e';
    if (status === 'FUTURE') borderColor = '#3b82f6'; 
    if (status === 'EXPIRED') borderColor = '#9ca3af'; 

    return (
        <div key={p.promoId} style={{ 
            borderLeft: `4px solid ${borderColor}`, 
            borderBottom: '1px solid #eee', 
            borderTop: '1px solid #eee',
            borderRight: '1px solid #eee',
            padding: '12px', 
            marginBottom: 8,
            borderRadius: 4,
            backgroundColor: 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <strong style={{ fontSize: '1.05em'}}>{p.name}</strong> 
                    </div>

                    <div style={{ marginBottom: 6 }}>{badges}</div>
                    
                    {/* INFO GRID */}
                    <div style={{ fontSize: '0.9em', color: '#4b5563', lineHeight: '1.6' }}>
                        <div>Reward: <strong>{p.reward.type === 'CREDIT' ? `$${(p.reward.creditCents/100).toFixed(2)} Off` : `${p.reward.percentOffService}% Off`}</strong></div>
                        
                        {p.couponCode && (
                            <div>Code: <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 4px', borderRadius: 3, border: '1px solid #e5e7eb' }}>{p.couponCode}</span></div>
                        )}
                        
                        {p.minServiceCents > 0 && (
                            <div>Min Spend: <strong>${(p.minServiceCents/100).toFixed(2)}</strong></div>
                        )}

                        {(p.audience?.tiers || p.audience?.stages) && (
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ marginRight: 6 }}>Target:</span>
                                {renderAudienceBadges(p.audience)}
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: 5 }}>
                    <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => setEditingPromoId(p.promoId)}>Edit</button>
                    {!isSystem && <button style={{ backgroundColor: '#ef4444', padding: '4px 8px', fontSize: '0.8em' }} onClick={() => handleDeletePromo(p.promoId)}>Del</button>}
                </div>
            </div>
        </div>
    );
  };

  const renderRedemptionItem = (r: RewardRedemption) => {
    if (editingRedemptionId === r.redemptionId) {
        return (
            <div key={r.redemptionId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
                <RedemptionForm initialData={r} onSave={handleSaveRedemption} onCancel={() => setEditingRedemptionId(null)} />
            </div>
        );
    }
    
    // Border logic for consistency
    const borderColor = r.isActive ? '#22c55e' : '#e5e7eb';

    return (
        <div key={r.redemptionId} style={{ 
            borderLeft: `4px solid ${borderColor}`,
            borderBottom: '1px solid #eee', 
            borderTop: '1px solid #eee', 
            borderRight: '1px solid #eee',
            padding: '12px',
            marginBottom: 8,
            borderRadius: 4,
            backgroundColor: 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ marginBottom: 4 }}>
                        <strong style={{ fontSize: '1.05em' }}>{r.name}</strong> 
                        <span style={{ color:'#6b7280', fontSize:'0.9em', marginLeft: 8 }}>({r.redeemPointsCost} pts)</span>
                    </div>

                    <div style={{ fontSize: '0.9em', color: '#4b5563', lineHeight: '1.6' }}>
                        <div>Reward: <strong>{r.reward.type === 'CREDIT' ? `$${(r.reward.creditCents/100).toFixed(2)} Off` : `${r.reward.percentOffService}% Off`}</strong></div>
                        
                        {(r.audience?.tiers || r.audience?.stages) && (
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ marginRight: 6 }}>Target:</span>
                                {renderAudienceBadges(r.audience)}
                            </div>
                        )}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: 20 }}>
            {/* --- PROMOS COLUMN --- */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3>Promotions</h3>
                    {!isCreatingPromo && !editingPromoId && <button onClick={() => setIsCreatingPromo(true)}>+ Add Promo</button>}
                </div>
                
                {isCreatingPromo && <div className="form-section" style={{ border: '2px solid #3b82f6' }}><PromoForm onSave={handleSavePromo} onCancel={() => setIsCreatingPromo(false)} /></div>}

                <div className="form-section" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    {/* LIVE NOW */}
                    {live.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ color: '#166534', borderBottom: '2px solid #22c55e', paddingBottom: 5, marginTop: 0 }}>🟢 Live Now</h4>
                            {live.map(p => renderPromoItem(p, 'LIVE'))}
                        </div>
                    )}

                    {/* SCHEDULED */}
                    {scheduled.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ color: '#1e40af', borderBottom: '2px solid #3b82f6', paddingBottom: 5, marginTop: 0 }}>⏳ Scheduled</h4>
                            {scheduled.map(p => renderPromoItem(p, 'FUTURE'))}
                        </div>
                    )}

                    {/* EXPIRED */}
                    {expired.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ color: '#92400e', borderBottom: '2px solid #f59e0b', paddingBottom: 5, marginTop: 0 }}>⚠️ Expired (Active)</h4>
                            {expired.map(p => renderPromoItem(p, 'EXPIRED'))}
                        </div>
                    )}

                    {/* INACTIVE */}
                    <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>⚪ Inactive</h4>
                    {inactive.map(p => renderPromoItem(p, 'INACTIVE'))}
                    {inactive.length === 0 && <p style={{color:'#999', fontSize:'0.9em'}}>No inactive promos.</p>}
                </div>
            </div>

            {/* --- REDEMPTIONS COLUMN --- */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h3>Redemptions</h3>
                    {!isCreatingRedemption && !editingRedemptionId && <button onClick={() => setIsCreatingRedemption(true)}>+ Add Redemption</button>}
                </div>
                
                {isCreatingRedemption && <div className="form-section" style={{ border: '2px solid #3b82f6' }}><RedemptionForm onSave={handleSaveRedemption} onCancel={() => setIsCreatingRedemption(false)} /></div>}

                <div className="form-section" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <h4 style={{ color: '#166534', borderBottom: '2px solid #22c55e', paddingBottom: 5, marginTop: 0 }}>🟢 Active</h4>
                    {redemptions.filter(r => r.isActive).map(renderRedemptionItem)}
                    {redemptions.filter(r => r.isActive).length === 0 && <p style={{color:'#999', fontSize:'0.9em'}}>No active rewards.</p>}

                    <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>⚪ Inactive</h4>
                    {redemptions.filter(r => !r.isActive).map(renderRedemptionItem)}
                    {redemptions.filter(r => !r.isActive).length === 0 && <p style={{color:'#999', fontSize:'0.9em'}}>No inactive rewards.</p>}
                </div>
            </div>
        </div>
    </div>
  );
}

// --- UTILS ---
const addDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

const getDiffDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)); 
};

// --- PROMO FORM ---
function PromoForm({ initialData, onSave, onCancel }: any) {
    const today = new Date().toISOString().split('T')[0];
    const isSystem = initialData && (initialData.promoId === 1 || initialData.promoId === 2);

    const defaultState: any = {
        name: '', 
        isActive: true, 
        triggerType: 'MANUAL',
        startISO: today,
        endISO: addDays(today, 30),
        recurEveryDays: 0,
        usageLimitPerCustomer: 1,
        reward: { type: 'CREDIT', creditCents: 500 },
        audience: { tiers: null, stages: null },
        windowDaysBefore: 0, 
        windowDaysAfter: 0,
        minServiceCents: 0,
        couponCode: ''
    };

    const [data, setData] = useState<Promo>(initialData || defaultState);
    
    // UI Toggles
    const [showAudience, setShowAudience] = useState(!!(data.audience?.tiers || data.audience?.stages));
    const [showRecur, setShowRecur] = useState(data.recurEveryDays > 0);
    const [showCoupon, setShowCoupon] = useState(!!data.couponCode);
    const [showMinSpend, setShowMinSpend] = useState(data.minServiceCents > 0);

    const [dateMode, setDateMode] = useState<'DURATION' | 'END_DATE'>('DURATION');
    const [duration, setDuration] = useState(30);

    // Helpers
    const [rewardType, setRewardType] = useState<'CREDIT' | 'PERCENT'>(data.reward.type);
    const [val, setVal] = useState(data.reward.type === 'CREDIT' ? (data.reward as any).creditCents / 100 : (data.reward as any).percentOffService);
    
    // Validation
    const [errors, setErrors] = useState<{name?: string, amount?: string}>({});

    // Init duration from ISOs if editing
    useEffect(() => {
        if (data.startISO && data.endISO) {
            setDuration(getDiffDays(data.startISO, data.endISO));
        }
    }, []);

    const handleDurationChange = (d: number) => {
        setDuration(d);
        if (data.startISO) setData({ ...data, endISO: addDays(data.startISO, d) });
    };

    const handleEndDateChange = (end: string) => {
        setData({ ...data, endISO: end });
        if (data.startISO) setDuration(getDiffDays(data.startISO, end));
    };

    const toggleTier = (t: LoyaltyTier) => {
        const prev = (data.audience?.tiers || []) as LoyaltyTier[];
        const next = prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t];
        setData({ ...data, audience: { ...data.audience, tiers: next.length ? next : null, stages: data.audience?.stages || null } });
    };

    const toggleStage = (s: LifecycleStage) => {
        const prev = (data.audience?.stages || []) as LifecycleStage[];
        const next = prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s];
        setData({ ...data, audience: { ...data.audience, stages: next.length ? next : null, tiers: data.audience?.tiers || null } });
    };

    const renderAudienceButton = (label: string, isSelected: boolean, onClick: () => void) => (
        <button 
            key={label} 
            onClick={onClick}
            style={{ 
                marginRight: 6,
                marginBottom: 6,
                padding: '4px 10px',
                borderRadius: '15px',
                border: isSelected ? '1px solid #2563eb' : '1px solid #d1d5db',
                backgroundColor: isSelected ? '#eff6ff' : 'white',
                color: isSelected ? '#1e40af' : '#374151',
                fontSize: '0.85em',
                cursor: 'pointer'
            }}
        >
            {label}
        </button>
    );

    const handleSubmit = () => {
        const newErrors: {name?: string, amount?: string} = {};
        if (!data.name.trim()) newErrors.name = "Promo Name is required";
        if (!val || val <= 0) newErrors.amount = "Reward amount is required";
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload: Promo = {
            ...data,
            promoId: data.promoId || 0,
            couponCode: showCoupon ? data.couponCode : undefined,
            recurEveryDays: showRecur ? data.recurEveryDays : 0,
            minServiceCents: showMinSpend ? data.minServiceCents : 0,
            audience: showAudience ? data.audience : null,
            reward: rewardType === 'CREDIT' 
                ? { type: 'CREDIT', creditCents: val * 100 }
                : { type: 'PERCENT', percentOffService: val }
        };
        onSave(payload);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* NAME */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Name <span style={{color:'red'}}>*</span></label>
                <input 
                    value={data.name} 
                    onChange={e => { setData({...data, name: e.target.value}); if(errors.name) setErrors({...errors, name: ''}); }} 
                    style={{ borderColor: errors.name ? 'red' : undefined }}
                />
                {errors.name && <small style={{color:'red', display:'block'}}>{errors.name}</small>}
            </div>

            {/* SYSTEM PROMO (ID 1 & 2): SPECIAL EDIT MODE */}
            {isSystem ? (
                <div style={{ gridColumn: 'span 2', background: '#e0e7ff', padding: 10, borderRadius: 4 }}>
                    <strong>System Settings</strong>
                    <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                        <label>Window Before (Days): <input type="number" style={{width:50}} value={data.windowDaysBefore} onChange={e => setData({...data, windowDaysBefore: parseInt(e.target.value)})}/></label>
                        <label>Window After (Days): <input type="number" style={{width:50}} value={data.windowDaysAfter} onChange={e => setData({...data, windowDaysAfter: parseInt(e.target.value)})}/></label>
                    </div>
                </div>
            ) : (
                /* MANUAL PROMO DATES */
                <div style={{ gridColumn: 'span 2', background: '#f0f9ff', padding: 10, borderRadius: 4 }}>
                    <div style={{display:'flex', gap:10, marginBottom:10}}>
                        <label>Start Date: <input type="date" value={data.startISO} onChange={e => setData({...data, startISO: e.target.value, endISO: addDays(e.target.value, duration)})} /></label>
                        <select value={dateMode} onChange={(e: any) => setDateMode(e.target.value)}>
                            <option value="DURATION">Use Duration</option>
                            <option value="END_DATE">Use End Date</option>
                        </select>
                    </div>
                    {dateMode === 'DURATION' ? (
                        <div>
                            <label>Duration (Days): <input type="number" value={duration} onChange={e => handleDurationChange(parseInt(e.target.value))} /></label>
                            <div style={{ fontSize: '0.8em', color: '#6b7280', marginTop: 4, marginLeft: 2 }}>
                                ➜ Calculated End: {addDays(data.startISO, duration)}
                            </div>
                        </div>
                    ) : (
                        <label>End Date: <input type="date" value={data.endISO} onChange={e => handleEndDateChange(e.target.value)} /></label>
                    )}
                </div>
            )}

            {/* REWARD SECTION (Moved up) */}
            <div style={{ gridColumn: 'span 2', border: '1px solid #eee', padding: 10, borderRadius: 4, background: '#f9fafb' }}>
                <strong style={{fontSize:'0.9em', color:'#6b7280'}}>Reward Value <span style={{color:'red'}}>*</span></strong>
                <div style={{ display: 'flex', gap: 20, marginTop: 5 }}>
                    <label><input type="radio" checked={rewardType==='CREDIT'} onChange={()=>setRewardType('CREDIT')}/> $ Off</label>
                    <label><input type="radio" checked={rewardType==='PERCENT'} onChange={()=>setRewardType('PERCENT')}/> % Off</label>
                </div>
                <input 
                    type="number" step={rewardType==='CREDIT' ? 0.01 : 1} 
                    value={val} 
                    onChange={e => { setVal(parseFloat(e.target.value)); if(errors.amount) setErrors({...errors, amount: ''}); }} 
                    placeholder="Amount" 
                    style={{marginTop:5, borderColor: errors.amount ? 'red' : undefined}} 
                />
                 {errors.amount && <small style={{color:'red', display:'block'}}>{errors.amount}</small>}
            </div>

            {/* USAGE LIMIT (Standalone) */}
            <div style={{ gridColumn: 'span 2' }}>
                <label>Usage Limit Per Customer:</label>
                <input 
                    type="number" style={{width:80, marginLeft: 10}} 
                    value={data.usageLimitPerCustomer} 
                    onChange={e => setData({...data, usageLimitPerCustomer: parseInt(e.target.value)})} 
                />
            </div>

            {/* OPTIONAL CONFIG GROUP (Moved to bottom) */}
            {!isSystem && (
            <div style={{ gridColumn: 'span 2', border: '1px solid #e5e7eb', padding: 10, borderRadius: 4, marginTop: 5 }}>
                <strong style={{fontSize:'0.9em', color:'#6b7280'}}>Optional Configuration</strong>
                
                {/* 1. MIN SPEND */}
                <div style={{ marginTop: 8 }}>
                    <label>
                        <input type="checkbox" checked={showMinSpend} onChange={e => setShowMinSpend(e.target.checked)} /> Minimum Spend
                    </label>
                    {showMinSpend && (
                         <div style={{ marginTop: 5, marginLeft: 20 }}>
                            <input type="number" value={(data.minServiceCents || 0)/100} onChange={e => setData({...data, minServiceCents: parseFloat(e.target.value)*100})} placeholder="0.00" />
                        </div>
                    )}
                </div>

                {/* 2. RECURRENCE */}
                <div style={{ marginTop: 8 }}>
                    <label>
                        <input type="checkbox" checked={showRecur} onChange={e => setShowRecur(e.target.checked)} /> Recurring (Auto-Reset)
                    </label>
                    {showRecur && (
                        <div style={{ marginTop: 5, marginLeft: 20 }}>
                            <label>Reset Every (Days): <input type="number" style={{width:60}} value={data.recurEveryDays} onChange={e => setData({...data, recurEveryDays: parseInt(e.target.value)})} /></label>
                        </div>
                    )}
                </div>

                {/* 3. COUPON CODE */}
                <div style={{ marginTop: 8 }}>
                    <label>
                        <input type="checkbox" checked={showCoupon} onChange={e => setShowCoupon(e.target.checked)} /> Coupon Code
                    </label>
                    {showCoupon && (
                        <div style={{ marginTop: 5, marginLeft: 20 }}>
                            <input value={data.couponCode || ''} onChange={e => setData({...data, couponCode: e.target.value})} placeholder="e.g. SUMMER20" />
                        </div>
                    )}
                </div>

                {/* 4. AUDIENCE */}
                <div style={{ marginTop: 8 }}>
                    <label>
                        <input type="checkbox" checked={showAudience} onChange={e => setShowAudience(e.target.checked)} /> Limit Audience
                    </label>
                    {showAudience && (
                        <div style={{ marginTop: 5, marginLeft: 20 }}>
                            <div style={{marginBottom:8}}>
                                <div style={{fontSize:'0.85em', fontWeight:'bold', marginBottom:4}}>Loyalty Tiers</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {['BRONZE','SILVER','GOLD','PLATINUM'].map((t: any) => 
                                        renderAudienceButton(t, data.audience?.tiers?.includes(t), () => toggleTier(t))
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{fontSize:'0.85em', fontWeight:'bold', marginBottom:4}}>Lifecycle Stages</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {['NEW','ACTIVE','AT_RISK','CHURNED'].map((s: any) => 
                                        renderAudienceButton(s, data.audience?.stages?.includes(s), () => toggleStage(s))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            )}
            
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, marginTop: 10 }}>
                <label><input type="checkbox" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} /> Active</label>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                <button onClick={handleSubmit}>Save</button>
                <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

// --- REDEMPTION FORM (UPDATED) ---
function RedemptionForm({ initialData, onSave, onCancel }: any) {
    const defaultState: Partial<RewardRedemption> & { audience: Audience } = { 
        name: '', 
        isActive: true, 
        redeemPointsCost: 100, 
        reward: { type: 'CREDIT', creditCents: 500 }, 
        audience: { tiers: null, stages: null } 
    };
    const [data, setData] = useState(initialData || defaultState);
    
    // UI Toggles
    const [showAudience, setShowAudience] = useState(!!(data.audience?.tiers || data.audience?.stages));

    const [rewardType, setRewardType] = useState<'CREDIT' | 'PERCENT'>(data.reward.type);
    const [val, setVal] = useState(data.reward.type === 'CREDIT' ? (data.reward as any).creditCents / 100 : (data.reward as any).percentOffService);
    const [errors, setErrors] = useState<{name?: string, amount?: string}>({});

    const toggleTier = (t: LoyaltyTier) => {
        const prev = (data.audience?.tiers || []) as LoyaltyTier[];
        const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
        setData({ ...data, audience: { ...data.audience, tiers: next.length ? next : null, stages: data.audience?.stages || null } });
    };

    const toggleStage = (s: LifecycleStage) => {
        const prev = (data.audience?.stages || []) as LifecycleStage[];
        const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
        setData({ ...data, audience: { ...data.audience, stages: next.length ? next : null, tiers: data.audience?.tiers || null } });
    };

    const renderAudienceButton = (label: string, isSelected: boolean, onClick: () => void) => (
        <button 
            key={label} 
            onClick={onClick}
            style={{ 
                marginRight: 6,
                marginBottom: 6,
                padding: '4px 10px',
                borderRadius: '15px',
                border: isSelected ? '1px solid #2563eb' : '1px solid #d1d5db',
                backgroundColor: isSelected ? '#eff6ff' : 'white',
                color: isSelected ? '#1e40af' : '#374151',
                fontSize: '0.85em',
                cursor: 'pointer'
            }}
        >
            {label}
        </button>
    );

    const handleSubmit = () => {
        const newErrors: {name?: string, amount?: string} = {};
        if (!data.name.trim()) newErrors.name = "Reward Name is required";
        if (!val || val <= 0) newErrors.amount = "Reward amount is required";
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const payload = {
            ...data,
            audience: showAudience ? data.audience : null,
            reward: rewardType === 'CREDIT' 
                ? { type: 'CREDIT', creditCents: val * 100 } 
                : { type: 'PERCENT', percentOffService: val }
        };
        onSave(payload);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Name <span style={{color:'red'}}>*</span></label>
                <input 
                    value={data.name} 
                    onChange={e => { setData({...data, name: e.target.value}); if(errors.name) setErrors({...errors, name: ''}); }} 
                    style={{ borderColor: errors.name ? 'red' : undefined }}
                />
                {errors.name && <small style={{color:'red', display:'block'}}>{errors.name}</small>}
            </div>
            <div className="form-group"><label>Points Cost:</label><input type="number" value={data.redeemPointsCost} onChange={e => setData({...data, redeemPointsCost: parseInt(e.target.value)})} /></div>
            
             {/* REWARD */}
             <div style={{ gridColumn: 'span 2', borderTop: '1px solid #eee', paddingTop: 10 }}>
                 <strong style={{fontSize:'0.9em', color:'#6b7280'}}>Reward Value <span style={{color:'red'}}>*</span></strong>
                <div style={{ display: 'flex', gap: 20, marginTop:5 }}>
                    <label><input type="radio" checked={rewardType==='CREDIT'} onChange={()=>setRewardType('CREDIT')}/> $ Off</label>
                    <label><input type="radio" checked={rewardType==='PERCENT'} onChange={()=>setRewardType('PERCENT')}/> % Off</label>
                </div>
                <input 
                    type="number" step={rewardType==='CREDIT' ? 0.01 : 1} 
                    value={val} 
                    onChange={e => { setVal(parseFloat(e.target.value)); if(errors.amount) setErrors({...errors, amount: ''}); }} 
                    placeholder="Amount" 
                    style={{marginTop:5, borderColor: errors.amount ? 'red' : undefined}} 
                />
                {errors.amount && <small style={{color:'red', display:'block'}}>{errors.amount}</small>}
            </div>

            {/* OPTIONAL: AUDIENCE */}
            <div style={{ gridColumn: 'span 2', border: '1px solid #e5e7eb', padding: 10, borderRadius: 4, marginTop: 5 }}>
                <strong style={{fontSize:'0.9em', color:'#6b7280'}}>Optional Configuration</strong>
                <div style={{ marginTop: 8 }}>
                    <label>
                        <input type="checkbox" checked={showAudience} onChange={e => setShowAudience(e.target.checked)} /> Limit Audience
                    </label>
                    {showAudience && (
                        <div style={{ marginTop: 5, marginLeft: 20 }}>
                            <div style={{marginBottom:8}}>
                                <div style={{fontSize:'0.85em', fontWeight:'bold', marginBottom:4}}>Loyalty Tiers</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {['BRONZE','SILVER','GOLD','PLATINUM'].map((t: any) => 
                                        renderAudienceButton(t, data.audience?.tiers?.includes(t), () => toggleTier(t))
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{fontSize:'0.85em', fontWeight:'bold', marginBottom:4}}>Lifecycle Stages</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {['NEW','ACTIVE','AT_RISK','CHURNED'].map((s: any) => 
                                        renderAudienceButton(s, data.audience?.stages?.includes(s), () => toggleStage(s))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

             <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, marginTop: 10 }}>
                <label><input type="checkbox" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} /> Active</label>
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                <button onClick={handleSubmit}>Save</button>
                <button className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}