import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, LogOut, CheckCircle, AlertCircle, RefreshCw, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import Dashboard from './components/Dashboard';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Auth Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('50000');
  const [verifyingEmail, setVerifyingEmail] = useState(null);
  const [otp, setOtp] = useState('');

  // Global Toast Notification
  const [toast, setToast] = useState(null);

  // Income Verification Prompt after Login
  const [showIncomePrompt, setShowIncomePrompt] = useState(false);
  const [incomePromptVal, setIncomePromptVal] = useState('');

  const checkPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'transparent', isStrong: false };

    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const isStrong = pwd.length >= 8 && hasLetter && hasNumber;

    let label = '';
    if (pwd.length < 8) {
      label = 'Must be at least 8 characters';
    } else if (!hasLetter || !hasNumber) {
      label = 'Must contain both letters and numbers';
    } else {
      label = 'Strong Alphanumeric Password';
    }

    return {
      label,
      color: isStrong ? '#10b981' : '#ef4444',
      isStrong
    };
  };

  const pwdStrength = checkPasswordStrength(password);

  // Check if user token exists in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        showToast(`Welcome back, ${parsedUser.name}!`, 'success');
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Apply theme class on mount and theme state change
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setName('');
    setEmail('');
    setPassword('');
    showToast('Logged out successfully', 'success');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (authView === 'register') {
      const strength = checkPasswordStrength(password);
      if (!strength.isStrong) {
        showToast('Password must contain both letters and numbers, and be at least 8 characters long!', 'warning');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = authView === 'login' ? '/auth/login' : '/auth/register';
      const body = authView === 'login'
        ? { email, password }
        : { name, email, password, monthlyIncome: Number(monthlyIncome) };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isUnverified) {
          setVerifyingEmail(data.email);
          showToast(data.message, 'warning');
          return;
        }
        throw new Error(data.message || 'Authentication failed');
      }

      // If OTP flow triggered on registration
      if (data.message && data.message.includes('OTP sent')) {
        setVerifyingEmail(email);
        showToast(data.message, 'success');
        return;
      }

      // Save user profile + JWT token
      localStorage.setItem('user', JSON.stringify(data.data));
      setUser(data.data);
      showToast(
        authView === 'login'
          ? `Welcome back, ${data.data.name}!`
          : 'Account created successfully!',
        'success'
      );

      if (authView === 'login') {
        setIncomePromptVal((data.data.monthlyIncome || 5500).toString());
        setShowIncomePrompt(true);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'An error occurred during authentication', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit verification code', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verifyingEmail, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      // Save user profile + JWT token
      localStorage.setItem('user', JSON.stringify(data.data));
      setUser(data.data);
      setVerifyingEmail(null);
      setOtp('');
      showToast('Email verified successfully! Welcome to FinSync!', 'success');

      // Show income verification prompt
      setIncomePromptVal((data.data.monthlyIncome || 5500).toString());
      setShowIncomePrompt(true);
    } catch (err) {
      showToast(err.message || 'Verification failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verifyingEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      showToast('Verification code resent successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resend code', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomePromptSubmit = async (e) => {
    e.preventDefault();
    const parsedIncome = parseFloat(incomePromptVal);
    if (isNaN(parsedIncome) || parsedIncome <= 0) {
      showToast('Please enter a valid positive income amount', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/income`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ income: parsedIncome }),
      });

      const resData = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, monthlyIncome: resData.data.monthlyIncome };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowIncomePrompt(false);
        showToast('Monthly income verified successfully!', 'success');
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      showToast(err.message || 'Could not update income', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleKeepCurrentIncome = () => {
    setShowIncomePrompt(false);
    showToast(`Income kept at ₹${Number(user?.monthlyIncome || 5500).toLocaleString()}`, 'info');
  };

  // If user is authenticated, render the dashboard
  if (user) {
    return (
      <div className="animate-fade-in">
        {/* Navigation / Header */}
        <header style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          borderBottom: '1px solid var(--border-light)',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
            }}>
              ₹
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--text-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FinSync
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Smart Expense Tracker</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{ padding: '10px' }}
            >
              {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
            </button>

            <button className="btn btn-secondary btn-icon" onClick={handleLogout} title="Log Out" style={{ padding: '10px' }}>
              <LogOut size={18} style={{ color: '#ef4444' }} />
            </button>
          </div>
        </header>

        {/* Dashboard Component */}
        <Dashboard
          user={user}
          setUser={setUser}
          apiBase={API_BASE}
          showToast={showToast}
        />

        {/* Verify Monthly Income Modal */}
        {showIncomePrompt && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="glass-panel modal-content animate-slide-up" style={{ maxWidth: '450px', padding: '36px', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '15px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                  marginBottom: '5px'
                }}>
                  ₹
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
                  Verify Monthly Income
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Welcome back, <strong>{user?.name}</strong>! To ensure your budget dashboard, savings rate, and metrics are accurate, please verify or update your monthly income.
                </p>
              </div>

              <form onSubmit={handleIncomePromptSubmit} style={{ marginTop: '24px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'left' }}>Monthly Income (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1rem' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: '48px', fontSize: '1.1rem', fontWeight: 600 }}
                      placeholder="50000"
                      value={incomePromptVal}
                      onChange={(e) => setIncomePromptVal(e.target.value)}
                      required
                      min="1"
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleKeepCurrentIncome}
                    style={{ flex: 1, padding: '12px' }}
                    disabled={loading}
                  >
                    Keep Current
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}
                    disabled={loading}
                  >
                    {loading && <RefreshCw className="sync-spinner" size={16} />}
                    Confirm & Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div className="toast animate-slide-up" style={{
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: 500,
          }}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // Otherwise render the auth screen
  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      {/* Absolute positioned theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="btn btn-secondary btn-icon"
        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 1000
        }}
      >
        {theme === 'dark' ? <Sun size={20} style={{ color: '#f59e0b' }} /> : <Moon size={20} style={{ color: '#6366f1' }} />}
      </button>
      {verifyingEmail ? (
        <div className="glass-panel auth-card animate-slide-up">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(90deg, #f8fafc, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Verify Your Email
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              We have sent a 6-digit verification code to <strong>{verifyingEmail}</strong>.
            </p>
          </div>

          <form onSubmit={handleOtpVerify}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Verification Code</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '48px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}
            >
              {loading ? <RefreshCw className="sync-spinner" size={18} /> : null}
              Verify Code & Login
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
            <button
              style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
              onClick={handleResendOtp}
              disabled={loading}
            >
              Resend Code
            </button>
            <button
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
              onClick={() => {
                setVerifyingEmail(null);
                setOtp('');
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel auth-card animate-slide-up">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {authView === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {authView === 'login'
                ? 'Enter your credentials to access your smart wallet.'
                : 'Sign up to automatically sync and track your expenses.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {authView === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '48px' }}
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Income (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1rem' }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: '48px' }}
                      placeholder="50000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '48px' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '48px', paddingRight: '48px' }}
                  placeholder="Password (min 8 chars, letters & numbers)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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

              {authView === 'register' && password && (
                <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Password Strength</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pwdStrength.color }}>
                      {pwdStrength.label}
                    </span>
                  </div>

                  <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: pwdStrength.isStrong ? '100%' : '35%',
                        background: pwdStrength.color,
                        borderRadius: '2px',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}
            >
              {loading ? <RefreshCw className="sync-spinner" size={18} /> : null}
              {authView === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {authView === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                onClick={() => {
                  setAuthView(authView === 'login' ? 'register' : 'login');
                  setShowPassword(false);
                }}
              >
                {authView === 'login' ? 'Create one now' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast animate-slide-up" style={{
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          fontWeight: 500,
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
