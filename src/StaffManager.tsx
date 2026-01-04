// src/StaffManager.tsx
import { useState, useEffect } from 'react';
import { Staff, Role } from './shared/types';

export function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // PIN Change State
  const [changingPinId, setChangingPinId] = useState<number | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const list = await window.api.getAllStaff();
    // Filter out Owner (ID 1)
    setStaffList(list.filter(s => s.staffId !== 1));
  };

  const handleSave = async (data: any) => {
    if (editingId) {
      // Edit Mode: Update details, don't touch PIN
      await window.api.updateStaff(editingId, data);
      setEditingId(null);
    } else {
      // Create Mode: Default PIN is 000000
      await window.api.createStaff({ ...data, pin: '000000' });
      setIsCreating(false);
    }
    loadStaff();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await window.api.deleteStaff(id);
      loadStaff();
    }
  };

  // --- METHOD #2: ADMIN SET PIN ---
  const handlePinUpdate = async (newPin: string) => {
    if (changingPinId && newPin.trim()) {
      try {
          await window.api.adminSetPin(changingPinId, newPin);
          alert("PIN updated successfully");
          setChangingPinId(null);
          loadStaff();
      } catch (err) {
          alert("Failed to update PIN.");
      }
    }
  };

  const renderStaffItem = (s: Staff) => {
    if (editingId === s.staffId) {
      return (
        <div key={s.staffId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
          <StaffForm 
            initialData={s} 
            onSave={handleSave} 
            onCancel={() => setEditingId(null)} 
          />
        </div>
      );
    }

    return (
      <div key={s.staffId} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong>{s.name}</strong>
              {!s.isActive && <span style={{ fontSize: '0.7em', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: 4 }}>Inactive</span>}
            </div>
            
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: 4 }}>
               Roles: {s.roles.join(', ')}
            </div>

            {s.roles.includes('TECH') && s.payroll && (
               <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: 2 }}>
                  Comm: {s.payroll.commissionTechRate} | Check: {s.payroll.payoutCheckRate}
               </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 5 }}>
            <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => setChangingPinId(s.staffId)}>
               Change PIN
            </button>
            <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => setEditingId(s.staffId)}>
               Edit
            </button>
            <button style={{ backgroundColor: '#ef4444', padding: '4px 8px', fontSize: '0.8em' }} onClick={() => handleDelete(s.staffId)}>
               Del
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h2>Staff Management</h2>
        {!isCreating && !editingId && (
           <button onClick={() => setIsCreating(true)}>+ Add New Staff</button>
        )}
      </div>

      {/* CHANGE PIN MODAL OVERLAY */}
      {changingPinId && (
        <ChangePinModal 
            onSave={handlePinUpdate} 
            onCancel={() => setChangingPinId(null)} 
        />
      )}

      {isCreating && (
        <div className="form-section" style={{ border: '2px solid #3b82f6' }}>
           <h4 style={{ marginTop: 0 }}>New Staff Member</h4>
           <StaffForm onSave={handleSave} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      <div className="form-section">
         <h4 style={{ color: '#059669', borderBottom: '2px solid #059669', paddingBottom: 5, marginTop: 0 }}>Active Team</h4>
         {staffList.filter(s => s.isActive).map(renderStaffItem)}
         {staffList.filter(s => s.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No active staff</p>}

         <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>Inactive</h4>
         {staffList.filter(s => !s.isActive).map(renderStaffItem)}
         {staffList.filter(s => !s.isActive).length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>No inactive staff</p>}
      </div>
    </div>
  );
}

function ChangePinModal({ onSave, onCancel }: { onSave: (pin: string) => void, onCancel: () => void }) {
    const [newPin, setNewPin] = useState('');

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 300, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>Change Staff PIN</h3>
                <p style={{ fontSize: '0.9em', color: '#666' }}>Enter the new PIN for this staff member.</p>
                
                <input 
                    type="text" 
                    autoFocus
                    value={newPin} 
                    onChange={e => setNewPin(e.target.value)} 
                    placeholder="New PIN" 
                    style={{ width: '100%', padding: '8px', marginBottom: 15, fontSize: '1.2em', textAlign: 'center', letterSpacing: '2px' }}
                />

                <div style={{ display: 'flex', gap: 10 }}>
                    <button style={{ flex: 1 }} onClick={() => onSave(newPin)}>Update</button>
                    <button style={{ flex: 1 }} className="secondary" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

function StaffForm({ initialData, onSave, onCancel }: any) {
  const defaultState = {
    name: '',
    roles: [] as Role[],
    isActive: true,
    skillsTypeIds: [],
    isTech: false,
    isReceptionist: false,
    commRate: '',
    checkRate: ''
  };

  const [data, setData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        isTech: initialData.roles.includes('TECH'),
        isReceptionist: initialData.roles.includes('RECEPTIONIST'),
        commRate: initialData.payroll?.commissionTechRate?.toString() || '',
        checkRate: initialData.payroll?.payoutCheckRate?.toString() || ''
      };
    }
    return defaultState;
  });

  useEffect(() => {
    if (!initialData && data.isTech && !data.commRate) {
      window.api.getSettings().then((s) => {
        setData((prev: any) => ({
           ...prev,
           commRate: s.defaultCommissionTechRate.toString(),
           checkRate: s.defaultPayoutCheckRate.toString()
        }));
      });
    }
  }, [data.isTech]);

  const handleSubmit = () => {
    if (!data.name.trim()) return alert("Name is required");
    if (!data.isTech && !data.isReceptionist) return alert("Select at least one role");

    const roles: Role[] = [];
    if (data.isTech) roles.push('TECH');
    if (data.isReceptionist) roles.push('RECEPTIONIST');

    const payroll = data.isTech ? {
        commissionTechRate: parseFloat(data.commRate) || 0,
        payoutCheckRate: parseFloat(data.checkRate) || 0
    } : undefined;

    const payload = {
        name: data.name,
        roles,
        isActive: data.isActive,
        skillsTypeIds: [],
        payroll
    };
    
    onSave(payload);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Name:</label>
            <input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Jane Doe" />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2', background: '#f9fafb', padding: 10, borderRadius: 4 }}>
            <strong>Roles: </strong>
            <label style={{ marginRight: 15 }}>
              <input type="checkbox" checked={data.isTech} onChange={e => setData({...data, isTech: e.target.checked})} /> Tech
            </label>
            <label>
              <input type="checkbox" checked={data.isReceptionist} onChange={e => setData({...data, isReceptionist: e.target.checked})} /> Receptionist
            </label>
        </div>

        {data.isTech && (
           <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: 10, borderRadius: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Commission Rate (0-1):</label>
                <input type="number" step="0.01" value={data.commRate} onChange={e => setData({...data, commRate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Check Payout Rate (0-1):</label>
                <input type="number" step="0.01" value={data.checkRate} onChange={e => setData({...data, checkRate: e.target.value})} />
              </div>
           </div>
        )}

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>
                <input type="checkbox" checked={data.isActive} onChange={e => setData({...data, isActive: e.target.checked})} style={{ marginRight: 10 }} />
                Active Status
            </label>
        </div>

        <div style={{ gridColumn: 'span 2', marginTop: 5, display: 'flex', gap: 10 }}>
            <button onClick={handleSubmit}>Save Staff</button>
            <button className="secondary" onClick={onCancel}>Cancel</button>
        </div>
    </div>
  );
}