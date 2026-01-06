// src/StaffManager.tsx
import { useState, useEffect } from 'react';
import { Staff, Role, ServiceType } from '../../shared/types';
import { NumPadModal } from '../../components/NumPadModal';

export function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]); // Store types here
  
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // PIN Change State (using NumPad)
  const [changingPinId, setChangingPinId] = useState<number | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const list = await window.api.getAllStaff();
    setStaffList(list.filter(s => s.staffId !== 1)); // Filter out Owner
    
    // Load Service Types for the picker
    const types = await window.api.getServiceTypes();
    setServiceTypes(types);
  };

  const handleSave = async (data: any) => {
    if (editingId) {
      await window.api.updateStaff(editingId, data);
      setEditingId(null);
    } else {
      await window.api.createStaff({ ...data, pin: '000000' });
      setIsCreating(false);
    }
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await window.api.deleteStaff(id);
      loadData();
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
          setChangingPinId(null);
          setShowPinPad(false);
          loadData();
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
            serviceTypes={serviceTypes} // Pass types to form
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
           <StaffForm 
             onSave={handleSave} 
             serviceTypes={serviceTypes} // Pass types to form
             onCancel={() => setIsCreating(false)} 
            />
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

function StaffForm({ initialData, serviceTypes, onSave, onCancel }: { initialData?: Staff, serviceTypes: ServiceType[], onSave: (d: any) => void, onCancel: () => void }) {
  const defaultState = {
    name: '',
    roles: [] as Role[],
    isActive: true,
    isTech: false,
    isReceptionist: false,
    commRate: '',
    checkRate: '',
    skillsTypeIds: [] as number[]
  };

  const [data, setData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        isTech: initialData.roles.includes('TECH'),
        isReceptionist: initialData.roles.includes('RECEPTIONIST'),
        commRate: initialData.payroll?.commissionTechRate?.toString() || '',
        checkRate: initialData.payroll?.payoutCheckRate?.toString() || '',
        skillsTypeIds: initialData.skillsTypeIds || []
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

  // Pill Button Helper (Copied style from MarketingManager)
  const renderSkillButton = (label: string, isSelected: boolean, onClick: () => void) => (
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

  const toggleSkill = (id: number) => {
    const current = data.skillsTypeIds;
    if (current.includes(id)) {
        setData({ ...data, skillsTypeIds: current.filter((x: number) => x !== id) });
    } else {
        setData({ ...data, skillsTypeIds: [...current, id] });
    }
  };

  const handleSubmit = () => {
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
        skillsTypeIds: data.isTech ? data.skillsTypeIds : [], // Only save skills if Tech
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

        {/* SKILLS SECTION (Only for Techs) */}
        {data.isTech && (
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{display:'block', marginBottom: 5}}>Skill Set:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {serviceTypes.length === 0 && <span style={{color:'#666', fontSize:'0.9em'}}>No Service Categories found. Add them in Services tab.</span>}
                    {serviceTypes.map(t => 
                        renderSkillButton(t.name, data.skillsTypeIds.includes(t.serviceTypeId), () => toggleSkill(t.serviceTypeId))
                    )}
                </div>
            </div>
        )}

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