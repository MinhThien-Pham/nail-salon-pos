// src/StaffManager.tsx
import { useState, useEffect } from 'react';
import { Staff, Role } from './shared/types';
import { NumPadModal } from './components/NumPadModal';

export function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // PIN Change State (using NumPad)
  const [changingPinId, setChangingPinId] = useState<number | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const list = await window.api.getAllStaff();
    setStaffList(list.filter(s => s.staffId !== 1)); // Filter out Owner
  };

  const handleSave = async (data: any) => {
    if (editingId) {
      await window.api.updateStaff(editingId, data);
      setEditingId(null);
    } else {
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

  const startPinChange = (id: number) => {
    setChangingPinId(id);
    setShowPinPad(true);
  };

  const handlePinUpdate = async (newPin: string) => {
    if (changingPinId && newPin.length >= 4) {
      try {
          await window.api.adminSetPin(changingPinId, newPin);
          // Optional: Show success toast/message here if you have a notification system
          setChangingPinId(null);
          setShowPinPad(false);
          loadStaff();
      } catch (err) {
          console.error("Failed to update PIN", err);
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
            <button className="secondary" style={{ padding: '4px 8px', fontSize: '0.8em' }} onClick={() => startPinChange(s.staffId)}>
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

      {isCreating && (
        <div className="form-section" style={{ border: '2px solid #3b82f6' }}>
           <h4 style={{ marginTop: 0 }}>New Staff Member</h4>
           <StaffForm onSave={handleSave} onCancel={() => setIsCreating(false)} />
        </div>
      )}

      <div className="form-section">
         <h4 style={{ color: '#059669', borderBottom: '2px solid #059669', paddingBottom: 5, marginTop: 0 }}>Active Team</h4>
         {staffList.filter(s => s.isActive).map(renderStaffItem)}

         <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}>Inactive</h4>
         {staffList.filter(s => !s.isActive).map(renderStaffItem)}
      </div>

      {/* NUMPAD FOR STAFF PIN CHANGE */}
      <NumPadModal 
        isOpen={showPinPad}
        title="Enter New Staff PIN"
        isSecure={true}
        onClose={() => setShowPinPad(false)}
        onSubmit={handlePinUpdate}
      />
    </div>
  );
}

function StaffForm({ initialData, onSave, onCancel }: any) {
  const defaultState = {
    name: '',
    roles: [] as Role[],
    isActive: true,
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

  // Validation State
  const [errors, setErrors] = useState<{name?: string, roles?: string}>({});

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
    // Validation
    const newErrors: any = {};
    let isValid = true;

    if (!data.name.trim()) {
        newErrors.name = "Staff Name is required.";
        isValid = false;
    }
    if (!data.isTech && !data.isReceptionist) {
        newErrors.roles = "Select at least one role.";
        isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

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
            <label>Name <span style={{color:'red'}}>*</span></label>
            <input 
                value={data.name} 
                onChange={e => { setData({...data, name: e.target.value}); if(errors.name) setErrors({...errors, name: ''}); }} 
                placeholder="Jane Doe" 
                style={{ borderColor: errors.name ? 'red' : undefined }}
            />
            {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2', background: '#f9fafb', padding: 10, borderRadius: 4 }}>
            <strong>Roles <span style={{color:'red'}}>*</span>: </strong>
            <label style={{ marginRight: 15 }}>
              <input type="checkbox" checked={data.isTech} onChange={e => { setData({...data, isTech: e.target.checked}); if(errors.roles) setErrors({...errors, roles: ''}); }} /> Tech
            </label>
            <label>
              <input type="checkbox" checked={data.isReceptionist} onChange={e => { setData({...data, isReceptionist: e.target.checked}); if(errors.roles) setErrors({...errors, roles: ''}); }} /> Receptionist
            </label>
            {errors.roles && <small style={{ display: 'block', color: 'red', marginTop: 5 }}>{errors.roles}</small>}
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