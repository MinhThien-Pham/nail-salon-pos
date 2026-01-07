import { useState, useEffect } from 'react';
import { Staff, Role, ServiceType } from '../../shared/types';
import { PinModal } from '../../components/PinModal';

export function StaffManager({ showForm, onFormToggle }: { showForm: boolean; onFormToggle: () => void }) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // UI State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // PIN Change State
  const [changingPinId, setChangingPinId] = useState<number | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const loadData = async () => {
    const list = await window.api.getAllStaff();
    setStaffList(list.filter(s => s.staffId !== 1)); // Filter out Owner

    // Load Service Types for the picker
    const types = await window.api.getServiceTypes();
    setServiceTypes(types);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingId) {
        await window.api.updateStaff(editingId, data);
        setEditingId(null);
        setFeedback({ text: 'Staff member updated successfully.', type: 'success' });
      } else {
        await window.api.createStaff({ ...data, pin: '000000' });
        onFormToggle(); // Close form
        setFeedback({ text: 'New staff member created.', type: 'success' });
      }
      loadData();
    } catch (e) {
      setFeedback({ text: 'Error saving staff member.', type: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        await window.api.deleteStaff(id);
        setFeedback({ text: 'Staff member deleted.', type: 'success' });
        loadData();
      } catch (e) {
        setFeedback({ text: 'Failed to delete staff member.', type: 'error' });
      }
    }
  };

  const startPinChange = (id: number) => {
    setChangingPinId(id);
    setShowPinPad(true);
  };

  const handlePinUpdate = async (newPin: string): Promise<boolean> => {
    if (changingPinId && newPin.length >= 4) {
      try {
        await window.api.adminSetPin(changingPinId, newPin);
        // REPLACED ALERT
        setFeedback({ text: 'PIN updated successfully.', type: 'success' });

        setChangingPinId(null);
        loadData();
        return true; // Success: Close modal
      } catch (err) {
        setFeedback({ text: 'Failed to update PIN.', type: 'error' });
        return false; // Fail: Keep modal open
      }
    }
    return false;
  };

  // --- Render Helpers ---
  const renderStaffItem = (s: Staff) => {
    if (editingId === s.staffId) {
      return (
        <div key={s.staffId} style={{ marginBottom: 15, border: '1px solid #3b82f6', padding: 10, borderRadius: 6 }}>
          <StaffForm
            initialData={s}
            serviceTypes={serviceTypes}
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
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              onClick={() => startPinChange(s.staffId)}
            >
              Change PIN
            </button>
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition"
              onClick={() => setEditingId(s.staffId)}
            >
              Edit
            </button>
            <button
              type="button"
              className="h-8 px-3 rounded-lg bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition"
              onClick={() => handleDelete(s.staffId)}
            >
              Del
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* FEEDBACK BANNER */}
      {feedback && (
        <div style={{
          marginBottom: 20, padding: 10, borderRadius: 6,
          background: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: feedback.type === 'error' ? '#b91c1c' : '#166534'
        }}>
          {feedback.text}
        </div>
      )}

      {showForm && (
        <div className="form-section" style={{ border: '2px solid #3b82f6', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h4 style={{ marginTop: 0 }}>New Staff Member</h4>
          <StaffForm
            onSave={handleSave}
            serviceTypes={serviceTypes}
            onCancel={onFormToggle}
          />
        </div>
      )}

      <div className="form-section">
        <h4 style={{ color: '#166534', borderBottom: '2px solid #22c55e', paddingBottom: 5, marginTop: 0 }}><strong>🟢 Active</strong></h4>
        {staffList.filter(s => s.isActive).map(renderStaffItem)}

        <h4 style={{ color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: 5, marginTop: 20 }}><strong>⚪ Inactive</strong></h4>
        {staffList.filter(s => !s.isActive).map(renderStaffItem)}
      </div>

      <PinModal
        open={showPinPad}
        title="Enter New Staff PIN"
        onClose={() => setShowPinPad(false)}
        onSubmit={handlePinUpdate}
      />
    </div>
  );
}

// --- The Form Component (No Changes Needed Here, but including for completeness) ---
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

  const [errors, setErrors] = useState<{ name?: string, roles?: string }>({});

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
      skillsTypeIds: data.isTech ? data.skillsTypeIds : [],
      payroll
    };

    onSave(payload);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
        <input
          value={data.name}
          onChange={e => { setData({ ...data, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
          placeholder="Jane Doe"
          className={`w-full h-10 px-3 rounded-xl border text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
        />
        {errors.name && <small className="text-red-500 text-xs mt-1 block">{errors.name}</small>}
      </div>

      <div className="form-group" style={{ gridColumn: 'span 2', background: '#f9fafb', padding: 10, borderRadius: 4 }}>
        <strong>Roles <span style={{ color: 'red' }}>*</span>: </strong>
        <label style={{ marginRight: 15 }}>
          <input type="checkbox" checked={data.isTech} onChange={e => { setData({ ...data, isTech: e.target.checked }); if (errors.roles) setErrors({ ...errors, roles: '' }); }} /> Tech
        </label>
        <label>
          <input type="checkbox" checked={data.isReceptionist} onChange={e => { setData({ ...data, isReceptionist: e.target.checked }); if (errors.roles) setErrors({ ...errors, roles: '' }); }} /> Receptionist
        </label>
        {errors.roles && <small style={{ display: 'block', color: 'red', marginTop: 5 }}>{errors.roles}</small>}
      </div>

      {data.isTech && (
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Skill Set:</label>
          <div className="flex flex-wrap gap-2">
            {serviceTypes.map(t => (
              <button
                key={t.serviceTypeId}
                type="button"
                onClick={() => toggleSkill(t.serviceTypeId)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${data.skillsTypeIds.includes(t.serviceTypeId)
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.isTech && (
        <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: 10, borderRadius: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Commission Rate (0-1):</label>
            <input
              type="number"
              step="0.01"
              value={data.commRate}
              onChange={e => setData({ ...data, commRate: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>
          <div className="form-group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Check Payout Rate (0-1):</label>
            <input
              type="number"
              step="0.01"
              value={data.checkRate}
              onChange={e => setData({ ...data, checkRate: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>
        </div>
      )}

      <div className="form-group" style={{ gridColumn: 'span 2' }}>
        <label>
          <input type="checkbox" checked={data.isActive} onChange={e => setData({ ...data, isActive: e.target.checked })} style={{ marginRight: 10 }} />
          Active Status
        </label>
      </div>

      <div style={{ gridColumn: 'span 2', marginTop: 5, display: 'flex', gap: 10 }}>
        <button
          type="button"
          className="h-10 px-6 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition"
          onClick={handleSubmit}
        >
          Save Staff
        </button>
        <button
          type="button"
          className="h-10 px-6 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}