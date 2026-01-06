// src/App.tsx
import { useState } from 'react';
import { Staff } from './shared/types';
import { StaffManager } from './StaffManager';
import { MarketingManager } from './MarketingManager';
import { SettingsManager } from './SettingsManager';
import { NumPadModal } from './components/NumPadModal';

type View = 'STAFF' | 'MARKETING' | 'SETTINGS';

function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPad, setShowPad] = useState(false);
  const [currentView, setCurrentView] = useState<View>('STAFF');

  const handleLogin = async (inputPin: string = pin) => {
    setError('');
    const user = await window.api.verifyOwner(inputPin);
    
    if (user) {
        setCurrentUser(user);
        setPin(''); 
    } else {
        setError('Invalid PIN or not an Owner.');
        setPin(''); 
    }
  };

  if (!currentUser) {
    return (
      <div className="container login-screen">
        <h1>Nail POS System</h1>
        <p>Please enter Owner PIN to continue</p>
        
        <div style={{ maxWidth: 300, margin: '0 auto' }}>
            {/* ReadOnly input triggers NumPad */}
            <input 
              type="password" 
              value={pin} 
              readOnly 
              placeholder="Tap to enter PIN"
              onClick={() => setShowPad(true)}
              style={{ width: '100%', textAlign: 'center', height: 45, fontSize: '1.2em', cursor: 'pointer' }}
            />
            
            <button 
                onClick={() => handleLogin(pin)} 
                style={{ width: '100%', marginTop: 15, padding: 12 }}
            >
                Login
            </button>
            
            {error && <p style={{ color: '#ef4444', marginTop: 15, fontWeight: 'bold' }}>{error}</p>}
        </div>

        <NumPadModal 
            isOpen={showPad}
            title="Enter Owner PIN"
            isSecure={true}
            onClose={() => setShowPad(false)}
            onSubmit={(val) => {
                setPin(val);
                setShowPad(false);
                handleLogin(val);
            }}
        />
      </div>
    );
  }

  return (
    <div className="container">
        <header style={{ marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h1>Owner Dashboard</h1>
                <button className="secondary" onClick={() => setCurrentUser(null)}>Logout</button>
            </div>
            
            <nav style={{ display: 'flex', gap: 10 }}>
                <button className={currentView === 'STAFF' ? '' : 'secondary'} onClick={() => setCurrentView('STAFF')}>Staff</button>
                <button className={currentView === 'MARKETING' ? '' : 'secondary'} onClick={() => setCurrentView('MARKETING')}>Marketing</button>
                <button className={currentView === 'SETTINGS' ? '' : 'secondary'} onClick={() => setCurrentView('SETTINGS')}>Settings</button>
            </nav>
        </header>

        {currentView === 'STAFF' && <StaffManager />}
        {currentView === 'MARKETING' && <MarketingManager />}
        {currentView === 'SETTINGS' && <SettingsManager />}
    </div>
  );
}

export default App;