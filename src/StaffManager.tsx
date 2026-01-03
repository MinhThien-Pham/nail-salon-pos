// src/StaffManager.tsx
import { useState, useEffect } from 'react';
import { Staff, Role } from './shared/types'; // Fixed path

export function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);

  // --- Form State ---
  const [name, setName] = useState('');
  const [isTech, setIsTech] = useState(false);
  const [isReceptionist, setIsReceptionist] = useState(false);
  
  const [commRate, setCommRate] = useState(''); 
  const [checkRate, setCheckRate] = useState('');

  // 1. Load Staff on Mount
  useEffect(() => {
    loadStaff();
  }, []);

  // 2. Auto-fill Defaults when "Tech" is checked
  useEffect(() => {
    if (isTech) {
      window.api.getDefaultRates().then((rates) => {
        if (!commRate) setCommRate(rates.defaultCommissionTechRate.toString());
        if (!checkRate) setCheckRate(rates.defaultPayoutCheckRate.toString());
      });
    } else {
        setCommRate('');
        setCheckRate('');
    }
  }, [isTech]);

  const loadStaff = async () => {
    const list = await window.api.getAllStaff();
    setStaffList(list);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert("Name is required");
    if (!isTech && !isReceptionist) return alert("Select at least one role");

    const roles: Role[] = [];
    if (isTech) roles.push('TECH');
    if (isReceptionist) roles.push('RECEPTIONIST');

    const payroll = isTech ? {
        commissionTechRate: parseFloat(commRate) || 0,
        payoutCheckRate: parseFloat(checkRate) || 0
    } : undefined;

    await window.api.createStaff({
        name,
        roles,
        pin: '000000', // Default
        isActive: true,
        skillsTypeIds: [],
        payroll
    });

    // Reset Form
    setShowForm(false);
    setName('');
    setIsTech(false);
    setIsReceptionist(false);
    setCommRate('');
    setCheckRate('');
    
    // Refresh List
    loadStaff();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Staff Management</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Staff'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <h3>New Staff Details</h3>
          
          <div className="form-group">
            <label>Name: </label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" />
          </div>

          <div className="form-group">
            <strong>Roles: </strong>
            <label style={{ marginRight: 15 }}>
              <input type="checkbox" checked={isTech} onChange={e => setIsTech(e.target.checked)} /> Tech
            </label>
            <label>
              <input type="checkbox" checked={isReceptionist} onChange={e => setIsReceptionist(e.target.checked)} /> Receptionist
            </label>
          </div>

          {isTech && (
            <div className="form-section" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <h4 style={{ marginTop: 0 }}>Payroll Settings</h4>
              <div className="form-group">
                <label>Commission Rate (0-1): </label>
                <input 
                  type="number" step="0.01" 
                  value={commRate} onChange={e => setCommRate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Check Payout Rate (0-1): </label>
                <input 
                  type="number" step="0.01" 
                  value={checkRate} onChange={e => setCheckRate(e.target.value)} 
                />
              </div>
            </div>
          )}
          
          <button onClick={handleSubmit} style={{ marginTop: 15 }}>Save Staff</button>
        </div>
      )}

      <ul className="staff-list">
        {staffList.map(s => (
          <li key={s.staffId} className="staff-item">
            <div>
              <strong>{s.name}</strong>
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                {s.roles.join(' • ')} 
                {s.payroll?.commissionTechRate ? ` | Comm: ${s.payroll.commissionTechRate}` : ''}
              </div>
            </div>
            <div style={{ color: s.isActive ? 'green' : 'red' }}>
                {s.isActive ? 'Active' : 'Inactive'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}