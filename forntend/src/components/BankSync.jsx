import React, { useState } from 'react';
import { Compass, RefreshCw, Unlink, Key, Check, Eye, EyeOff } from 'lucide-react';

const BANKS = [
  { id: 'Chase', name: 'Kotak Mahindra Bank', logo: '🏛️', color: '#115ec9' },
  { id: 'BofA', name: 'State Bank of India', logo: '🏛️', color: '#dc2626' },
  { id: 'CapitalOne', name: 'Card ', logo: '💳', color: '#092147' },
  { id: 'WellsFargo', name: 'Bank of Maharashtra', logo: '🏛️', color: '#d97706' },
];

const SYNC_STEPS = [
  { pct: 15, msg: 'Establishing secure tunnel...' },
  { pct: 40, msg: 'Authenticating credentials with OAuth...' },
  { pct: 65, msg: 'Parsing statement ledgers...' },
  { pct: 85, msg: 'Auto-categorizing merchants...' },
  { pct: 100, msg: 'Finalizing database sync...' },
];

function BankSync({ user, setUser, apiBase, showToast, refreshData, syncing, setSyncing }) {
  const [selectedBank, setSelectedBank] = useState(null);
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sync Animation State
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const startSyncSimulation = async (bankId) => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncStatusMsg('Contacting bank servers...');

    // Animate progress bar over 4 seconds
    const intervalTime = 80; // milliseconds
    const totalSteps = 50;   // 50 * 80ms = 4000ms
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentPct = Math.min((currentStep / totalSteps) * 100, 100);
      setSyncProgress(currentPct);

      // Update message based on progress percentage
      const matchedStep = SYNC_STEPS.find(s => currentPct <= s.pct);
      if (matchedStep) {
        setSyncStatusMsg(matchedStep.msg);
      }

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        // Execute actual backend request once the animation completes
        finalizeSync(bankId);
      }
    }, intervalTime);
  };

  const finalizeSync = async (bankId) => {
    try {
      const res = await fetch(`${apiBase}/bank/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ provider: bankId }),
      });

      const data = await res.json();

      if (res.ok) {
        // Update user state globally in App.jsx
        const updatedUser = { ...user, linkedBank: data.data.linkedBank };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        showToast(data.message, 'success');
        refreshData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showToast(err.message || 'Bank connection failed', 'danger');
    } finally {
      setSyncing(false);
      setSelectedBank(null);
    }
  };

  const handleConnectClick = (bank) => {
    setSelectedBank(bank);
    setCredentialsModal(true);
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Please enter credentials', 'warning');
      return;
    }
    setCredentialsModal(false);
    // Start progress simulation
    startSyncSimulation(selectedBank.id);
    // Reset credentials fields
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect your linked bank account?`)) return;

    setSyncing(true);
    try {
      const res = await fetch(`${apiBase}/bank/disconnect`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        const updatedUser = { ...user, linkedBank: data.data.linkedBank };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        showToast('Bank disconnected successfully', 'success');
        refreshData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showToast(err.message || 'Failed to disconnect bank', 'danger');
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = user.linkedBank && user.linkedBank.connected;
  const connectedProvider = isConnected ? BANKS.find(b => b.id === user.linkedBank.provider) : null;

  return (
    <div className="glass-panel bank-widget animate-slide-up" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px' }}>
        Bank Feed Integration
      </h3>

      {syncing ? (
        // Sync Loading State
        <div className="sync-panel" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <RefreshCw className="sync-spinner" size={40} />
          <h4 style={{ fontWeight: 700, marginTop: '10px' }}>Syncing Transactions...</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{syncStatusMsg}</p>

          <div className="sync-progress-bar">
            <div className="sync-progress-fill" style={{ width: `${syncProgress}%` }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1' }}>{syncProgress.toFixed(0)}%</span>
        </div>
      ) : isConnected ? (
        // Bank Connected UI
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', padding: '10px 0' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
          }}>
            <div style={{ fontSize: '2.5rem' }}>
              {connectedProvider ? connectedProvider.logo : '🏦'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  {connectedProvider ? connectedProvider.name : user.linkedBank.provider}
                </h4>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#fff', fontSize: '0.6rem', padding: '3px' }}>
                  <Check size={10} strokeWidth={3} />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Active Feed Connection
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '15px' }}>
              <span>Last Synchronized:</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                {user.linkedBank.lastSync
                  ? new Date(user.linkedBank.lastSync).toLocaleString()
                  : 'Never'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => startSyncSimulation(user.linkedBank.provider)}
              >
                <RefreshCw size={14} />
                Sync Now
              </button>

              <button
                className="btn btn-danger"
                style={{ padding: '10px' }}
                onClick={handleDisconnect}
                title="Disconnect Bank Account"
              >
                <Unlink size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Link Bank Choice State
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4' }}>
            Link your bank to securely download, categorize, and track transactions in real-time. No manual input required.
          </p>

          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Select Provider</span>
            <div className="bank-grid">
              {BANKS.map((bank) => (
                <div
                  key={bank.id}
                  className="bank-option"
                  onClick={() => handleConnectClick(bank)}
                >
                  <span className="bank-logo">{bank.logo}</span>
                  <span>{bank.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credentials Input Modal */}
      {credentialsModal && selectedBank && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{selectedBank.logo}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Link with {selectedBank.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Secure connection facilitated by Plaid Sandbox API
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit}>
              <div className="form-group">
                <label className="form-label">Online Banking ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. user123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Passcode</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingRight: '48px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setCredentialsModal(false);
                    setShowPassword(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Key size={14} />
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankSync;
