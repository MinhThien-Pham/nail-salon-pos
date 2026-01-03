// src/App.tsx
import { useState } from 'react';
import { Staff } from './shared/types';
import { StaffManager } from './StaffManager';
import { MarketingManager } from './MarketingManager';
import { SettingsManager } from './SettingsManager';

// 1. Update View Type
type View = 'STAFF' | 'MARKETING' | 'SETTINGS';

function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  // Navigation State
  const [currentView, setCurrentView] = useState<View>('STAFF');

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
    setError('');
    const user = await window.api.verifyOwner(pin);
    
    if (user) {
        setCurrentUser(user);
    } else {
        setError('Invalid PIN or not an Owner.');
    }
  };

  // --- VIEW: LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div className="container login-screen">
        <h1>Nail POS System</h1>
        <p>Please enter Owner PIN to continue</p>
        
        <input 
          type="password" 
          value={pin} 
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button onClick={handleLogin}>Login</button>
        
        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="container">
        {/* HEADER */}
        <header style={{ marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h1>Owner Dashboard</h1>
                <button className="secondary" onClick={() => setCurrentUser(null)}>Logout</button>
            </div>
            
            {/* NAVIGATION */}
            <nav style={{ display: 'flex', gap: 10 }}>
                <button 
                    className={currentView === 'STAFF' ? '' : 'secondary'} 
                    onClick={() => setCurrentView('STAFF')}
                >
                    Staff
                </button>
                <button 
                    className={currentView === 'MARKETING' ? '' : 'secondary'}
                    onClick={() => setCurrentView('MARKETING')}
                >
                    Marketing
                </button>
                <button 
                    className={currentView === 'SETTINGS' ? '' : 'secondary'}
                    onClick={() => setCurrentView('SETTINGS')}
                >
                    Settings
                </button>
            </nav>
        </header>

        {/* VIEW RENDERER */}
        {currentView === 'STAFF' && <StaffManager />}
        {currentView === 'MARKETING' && <MarketingManager />}
        {currentView === 'SETTINGS' && <SettingsManager />}
    </div>
  );
}

export default App;