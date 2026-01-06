// src/NumPadModal.tsx
import React, { useState, useEffect } from 'react';

interface NumPadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    title: string;
    isSecure?: boolean; // If true, masks the input (for PINs)
}

export const NumPadModal: React.FC<NumPadModalProps> = ({ isOpen, onClose, onSubmit, title, isSecure }) => {
    const [value, setValue] = useState('');

    // Reset value when modal opens
    useEffect(() => {
        if (isOpen) setValue('');
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNum = (num: string) => {
        if (num === '.' && value.includes('.')) return; // Prevent double decimals
        setValue(prev => prev + num);
    };

    const handleClear = () => setValue('');
    const handleBackspace = () => setValue(prev => prev.slice(0, -1));
    
    const handleSubmit = () => {
        onSubmit(value);
        setValue('');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: 25, borderRadius: 12, width: 320, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <h3 style={{ textAlign: 'center', marginTop: 0, color: '#374151' }}>{title}</h3>
                
                {/* Display Screen */}
                <div style={{ 
                    background: '#f3f4f6', 
                    padding: '15px 20px', 
                    fontSize: 24, 
                    textAlign: 'right', 
                    marginBottom: 20, 
                    borderRadius: 8, 
                    minHeight: 32,
                    border: '1px solid #e5e7eb',
                    fontFamily: 'monospace'
                }}>
                    {isSecure ? '•'.repeat(value.length) : (value || <span style={{color: '#9ca3af', fontSize: '0.8em'}}>0</span>)}
                </div>
                
                {/* Numpad Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} onClick={() => handleNum(n.toString())} style={{ padding: 15, fontSize: 20, background: 'white', border: '1px solid #d1d5db', color: '#1f2937' }}>
                            {n}
                        </button>
                    ))}
                    
                    {/* Bottom Row: Dot, 0, Backspace */}
                    <button onClick={() => handleNum('.')} style={{ padding: 15, fontSize: 20, background: 'white', border: '1px solid #d1d5db', fontWeight: 'bold' }}>.</button>
                    <button onClick={() => handleNum('0')} style={{ padding: 15, fontSize: 20, background: 'white', border: '1px solid #d1d5db' }}>0</button>
                    <button onClick={handleBackspace} style={{ background: '#fbbf24', border: 'none', color: 'white', fontSize: 20 }}>⌫</button>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button onClick={onClose} className="secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
                    <button onClick={handleSubmit} style={{ flex: 1, padding: 12, backgroundColor: '#3b82f6', color: 'white' }}>Enter</button>
                </div>
            </div>
        </div>
    );
};