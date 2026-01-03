// src/App.tsx
import { useState } from 'react';
import { Staff } from './shared/types'; // Fixed path
import { StaffManager } from './StaffManager';

function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const user = await window.api.verifyOwner(pin);
    
    if (user) {
      setCurrentUser(user);
    } else {
        setError('Invalid PIN.');
    }
  };

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

  return (
    <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1>Owner Dashboard</h1>
            <button className="secondary" onClick={() => setCurrentUser(null)}>Logout</button>
        </div>
        <StaffManager />
    </div>
  );
}

export default App;