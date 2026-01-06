import { useState, useEffect } from 'react';
import { ServiceType, Service } from '../../shared/types';

export function ServicesManager() {
    const [types, setTypes] = useState<ServiceType[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    
    // UI State
    const [expandedTypeIds, setExpandedTypeIds] = useState<number[]>([]);
    const [showTypeForm, setShowTypeForm] = useState(false);
    const [addingServiceToTypeId, setAddingServiceToTypeId] = useState<number | null>(null);

    // Feedback State
    const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Edit State
    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [editTypeName, setEditTypeName] = useState('');

    const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
    const [editServiceData, setEditServiceData] = useState({ name: '', price: '', duration: '' });

    // Creation State
    const [newTypeName, setNewTypeName] = useState('');
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');
    const [newServiceDuration, setNewServiceDuration] = useState('');

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
        const t = await window.api.getServiceTypes();
        const s = await window.api.getAllServices();
        setTypes(t);
        setServices(s);
    };

    const toggleExpand = (id: number) => {
        if (editingTypeId === id) return;

        if (expandedTypeIds.includes(id)) {
            setExpandedTypeIds(prev => prev.filter(tid => tid !== id));
        } else {
            setExpandedTypeIds(prev => [...prev, id]);
        }
    };

    // --- TYPE HANDLERS ---

    const handleCreateType = async () => {
        if (!newTypeName.trim()) return;
        try {
            await window.api.createServiceType(newTypeName);
            setNewTypeName('');
            setShowTypeForm(false);
            setFeedback({ text: 'Category created successfully.', type: 'success' });
            loadData();
        } catch (e) {
            setFeedback({ text: 'Failed to create category.', type: 'error' });
        }
    };

    const startEditType = (t: ServiceType, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTypeId(t.serviceTypeId);
        setEditTypeName(t.name);
    };

    const saveType = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingTypeId && editTypeName.trim()) {
            try {
                await window.api.updateServiceType(editingTypeId, editTypeName);
                setEditingTypeId(null);
                setFeedback({ text: 'Category updated.', type: 'success' });
                loadData();
            } catch (err) {
                setFeedback({ text: 'Failed to update category.', type: 'error' });
            }
        }
    };

    const handleDeleteType = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this Category? All services inside it will be deleted.")) {
            try {
                await window.api.deleteServiceType(id);
                setFeedback({ text: 'Category deleted.', type: 'success' });
                loadData();
            } catch (err) {
                setFeedback({ text: 'Failed to delete category.', type: 'error' });
            }
        }
    };

    // --- SERVICE HANDLERS ---

    const startAddService = (typeId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddingServiceToTypeId(typeId);
        
        // Auto-expand if collapsed
        setExpandedTypeIds(prev => {
            if (prev.includes(typeId)) return prev;
            return [...prev, typeId];
        });
    };

    const handleCreateService = async () => {
        if (!newServiceName.trim() || !newServicePrice || !addingServiceToTypeId) return;
        
        try {
            await window.api.createService({
                typeId: addingServiceToTypeId,
                name: newServiceName,
                priceCents: Math.round(parseFloat(newServicePrice) * 100),
                durationMin: parseInt(newServiceDuration) || 0
            });

            setAddingServiceToTypeId(null);
            setNewServiceName('');
            setNewServicePrice('');
            setNewServiceDuration('');
            setFeedback({ text: 'Service added successfully.', type: 'success' });
            loadData();
        } catch (err) {
            setFeedback({ text: 'Failed to add service.', type: 'error' });
        }
    };

    const startEditService = (s: Service) => {
        setEditingServiceId(s.serviceId);
        setEditServiceData({
            name: s.name,
            price: (s.priceCents / 100).toFixed(2),
            duration: s.durationMin.toString()
        });
    };

    const saveService = async () => {
        if (editingServiceId && editServiceData.name.trim()) {
            try {
                await window.api.updateService(editingServiceId, {
                    name: editServiceData.name,
                    priceCents: Math.round(parseFloat(editServiceData.price) * 100),
                    durationMin: parseInt(editServiceData.duration) || 0
                });
                setEditingServiceId(null);
                setFeedback({ text: 'Service updated.', type: 'success' });
                loadData();
            } catch (err) {
                setFeedback({ text: 'Failed to update service.', type: 'error' });
            }
        }
    };

    const handleDeleteService = async (id: number) => {
        if (confirm("Delete this service?")) {
            try {
                await window.api.deleteService(id);
                setFeedback({ text: 'Service deleted.', type: 'success' });
                loadData();
            } catch (err) {
                setFeedback({ text: 'Failed to delete service.', type: 'error' });
            }
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2><strong>Service Menu</strong></h2>
                <button onClick={() => setShowTypeForm(!showTypeForm)}>
                    {showTypeForm ? 'Cancel' : '+ Add Category'}
                </button>
            </div>

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

            {/* NEW CATEGORY FORM */}
            {showTypeForm && (
                <div className="form-section" style={{ border: '2px solid #3b82f6', marginBottom: 20 }}>
                    <h4 style={{marginTop:0}}>New Category</h4>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input 
                            placeholder="Category Name (e.g. Pedicure)" 
                            value={newTypeName} 
                            onChange={e => setNewTypeName(e.target.value)} 
                            style={{ flex: 1 }}
                        />
                        <button onClick={handleCreateType}>Save</button>
                    </div>
                </div>
            )}

            {/* CATEGORY LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {types.map(type => {
                    const isExpanded = expandedTypeIds.includes(type.serviceTypeId);
                    const typeServices = services.filter(s => s.typeId === type.serviceTypeId);
                    const isAddingToThis = addingServiceToTypeId === type.serviceTypeId;
                    const isEditingThisType = editingTypeId === type.serviceTypeId;

                    return (
                        <div key={type.serviceTypeId} style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                            
                            {/* HEADER (CATEGORY ROW) */}
                            <div 
                                onClick={() => toggleExpand(type.serviceTypeId)}
                                style={{ 
                                    padding: '12px 15px', 
                                    background: '#f9fafb', 
                                    cursor: 'pointer',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <span>{isExpanded ? '▼' : '▶'}</span>
                                    
                                    {isEditingThisType ? (
                                        <input 
                                            value={editTypeName} 
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => setEditTypeName(e.target.value)}
                                            style={{ fontWeight: 'bold', fontSize: '1em', padding: 4 }}
                                        />
                                    ) : (
                                        <>
                                            <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{type.name}</span>
                                            <span style={{ fontSize: '0.8em', color: '#6b7280' }}>
                                                ({typeServices.length} services)
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    {isEditingThisType ? (
                                        <>
                                            <button onClick={saveType} style={{ padding: '4px 8px', fontSize: '0.8em' }}>Save</button>
                                            <button 
                                                className="secondary" 
                                                onClick={(e) => { e.stopPropagation(); setEditingTypeId(null); }}
                                                style={{ padding: '4px 8px', fontSize: '0.8em' }}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                style={{ fontSize: '0.8em', padding: '4px 8px', backgroundColor: '#059669', color: 'white' }}
                                                onClick={(e) => startAddService(type.serviceTypeId, e)}
                                            >
                                                + Add Service
                                            </button>
                                            <button 
                                                className="secondary"
                                                style={{ fontSize: '0.8em', padding: '4px 8px' }}
                                                onClick={(e) => startEditType(type, e)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                style={{ fontSize: '0.8em', padding: '4px 8px', background: '#fee2e2', color: '#b91c1c' }}
                                                onClick={(e) => handleDeleteType(type.serviceTypeId, e)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* BODY (SERVICES LIST) */}
                            {isExpanded && (
                                <div style={{ padding: 0, background: 'white' }}>
                                    
                                    {/* INLINE ADD SERVICE FORM */}
                                    {isAddingToThis && (
                                        <div style={{ background: '#eff6ff', padding: 15, borderBottom: '1px solid #bfdbfe' }}>
                                            <h5 style={{ marginTop: 0, marginBottom: 10, color: '#1e3a8a' }}>Add Service to {type.name}</h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
                                                <input placeholder="Service Name" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                                                <input type="number" placeholder="Mins" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} />
                                                <input type="number" placeholder="Price ($)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} />
                                                <div style={{display:'flex', gap:5}}>
                                                    <button onClick={handleCreateService} style={{backgroundColor: '#059669'}}>Save</button>
                                                    <button className="secondary" onClick={() => setAddingServiceToTypeId(null)}>Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* LIST */}
                                    {typeServices.length === 0 ? (
                                        <div style={{ color: '#9ca3af', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>No services in this category yet.</div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left', color: '#6b7280', fontSize: '0.85em', background: '#f8fafc' }}>
                                                    <th style={{ padding: '10px 15px' }}>NAME</th>
                                                    <th style={{ padding: '10px 15px', width: '15%' }}>DURATION</th>
                                                    <th style={{ padding: '10px 15px', width: '15%' }}>PRICE</th>
                                                    <th style={{ padding: '10px 15px', width: '120px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {typeServices.map((s, index) => {
                                                    const isEditing = editingServiceId === s.serviceId;
                                                    const rowBg = index % 2 === 0 ? 'white' : '#f9fafb';
                                                    
                                                    return (
                                                        <tr key={s.serviceId} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isEditing ? '#fff7ed' : rowBg }}>
                                                            {isEditing ? (
                                                                <>
                                                                    <td style={{ padding: '8px 15px' }}>
                                                                        <input 
                                                                            value={editServiceData.name} 
                                                                            onChange={e => setEditServiceData({...editServiceData, name: e.target.value})} 
                                                                            style={{width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4}}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '8px 15px' }}>
                                                                        <input 
                                                                            type="number" 
                                                                            value={editServiceData.duration} 
                                                                            onChange={e => setEditServiceData({...editServiceData, duration: e.target.value})} 
                                                                            style={{width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4}}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '8px 15px' }}>
                                                                        <input 
                                                                            type="number" 
                                                                            value={editServiceData.price} 
                                                                            onChange={e => setEditServiceData({...editServiceData, price: e.target.value})} 
                                                                            style={{width: '100%', padding: 6, border: '1px solid #d1d5db', borderRadius: 4}}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '8px 15px', textAlign: 'right' }}>
                                                                        <div style={{display:'flex', gap: 5, justifyContent: 'flex-end'}}>
                                                                            <button onClick={saveService} style={{padding: '4px 8px', fontSize: '0.8em'}}>Save</button>
                                                                            <button className="secondary" onClick={() => setEditingServiceId(null)} style={{padding: '4px 8px', fontSize: '0.8em'}}>Cancel</button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td style={{ padding: '10px 15px', fontWeight: 500, color: '#374151' }}>{s.name}</td>
                                                                    <td style={{ padding: '10px 15px', color: '#6b7280' }}>{s.durationMin} min</td>
                                                                    <td style={{ padding: '10px 15px', color: '#111827' }}>${(s.priceCents / 100).toFixed(2)}</td>
                                                                    <td style={{ padding: '10px 15px', textAlign: 'right' }}>
                                                                        <div style={{display:'flex', gap: 5, justifyContent: 'flex-end'}}>
                                                                            <button 
                                                                                className="secondary" 
                                                                                style={{ padding: '4px 8px', fontSize: '0.75em' }}
                                                                                onClick={() => startEditService(s)}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button 
                                                                                style={{ padding: '4px 8px', fontSize: '0.75em', background: '#fee2e2', color: '#b91c1c' }}
                                                                                onClick={() => handleDeleteService(s.serviceId)}
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}