import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, User as UserIcon, LogOut, CheckCircle, AlertCircle, RefreshCw,
  Sun, Moon, Eye, EyeOff, Shield, Activity, Sparkles, DollarSign,
  TrendingDown, ArrowRight, ChevronRight, Star, HelpCircle, Check, X,
  Play, Users, BarChart3, CreditCard, Menu
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import logoImg from './assets/raw_logo.jpg';

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

  // Landing Page States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [calcIncome, setCalcIncome] = useState('50000');
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Forgot Password Fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Change Password Fields
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [showChangePasswords, setShowChangePasswords] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (verifyingEmail) {
      setIsAuthModalOpen(true);
    }
  }, [verifyingEmail]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyBudget = () => {
    setMonthlyIncome(calcIncome);
    setAuthView('register');
    setIsAuthModalOpen(true);
    showToast(`Monthly income of ₹${Number(calcIncome).toLocaleString()} applied! Sign up to continue.`, 'success');
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

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

  const handleForgotPasswordRequestSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code');
      }

      setResetEmail(email);
      showToast(data.message || 'Reset code sent to your email!', 'success');
      setAuthView('forgot-verify');
    } catch (err) {
      showToast(err.message || 'Could not send reset code', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtp || !newPassword) {
      showToast('Please fill out all fields', 'warning');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (!strength.isStrong) {
      showToast('New password is too weak. Make sure it contains both letters and numbers, and is at least 8 characters long.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      localStorage.setItem('user', JSON.stringify(data.data));
      setUser(data.data);
      setIsAuthModalOpen(false);
      setAuthView('login');
      setResetEmail('');
      setResetOtp('');
      setNewPassword('');
      showToast('Password reset successfully and logged in!', 'success');
    } catch (err) {
      showToast(err.message || 'Could not reset password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !changeNewPassword) {
      showToast('Please fill out all fields', 'warning');
      return;
    }

    const strength = checkPasswordStrength(changeNewPassword);
    if (!strength.isStrong) {
      showToast('New password is too weak. Make sure it contains both letters and numbers, and is at least 8 characters long.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword: changeNewPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      showToast('Password changed successfully!', 'success');
      setIsChangePwdOpen(false);
      setCurrentPassword('');
      setChangeNewPassword('');
    } catch (err) {
      showToast(err.message || 'Could not change password', 'danger');
    } finally {
      setLoading(false);
    }
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
        <header className="dashboard-header">
          <div className="dashboard-header-brand">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={logoImg} alt="FinSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--text-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FinSync
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Smart Expense Tracker</span>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <div className="dashboard-header-user" style={{ textAlign: 'right' }}>
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

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setIsChangePwdOpen(true)}
              title="Change Password"
              style={{ padding: '10px' }}
            >
              <Lock size={18} style={{ color: 'var(--accent-primary)' }} />
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

        {/* Change Password Modal */}
        {isChangePwdOpen && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="glass-panel modal-content animate-slide-up" style={{ maxWidth: '440px', padding: '36px', position: 'relative' }}>
              <button
                className="modal-close"
                onClick={() => {
                  setIsChangePwdOpen(false);
                  setCurrentPassword('');
                  setChangeNewPassword('');
                  setShowChangePasswords(false);
                }}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Lock size={22} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Change Password</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Update your security credentials. Your new password must be at least 8 characters long and contain both letters and numbers.</p>
              </div>

              <form onSubmit={handleChangePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={showChangePasswords ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={showChangePasswords ? 'text' : 'password'}
                      className="form-input"
                      style={{ paddingLeft: '44px', paddingRight: '44px' }}
                      placeholder="Enter new password (min 8 chars)"
                      value={changeNewPassword}
                      onChange={(e) => setChangeNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowChangePasswords(!showChangePasswords)}
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
                      {showChangePasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {changeNewPassword && (
                    <div className="animate-fade-in" style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Password Strength</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: checkPasswordStrength(changeNewPassword).color }}>
                          {checkPasswordStrength(changeNewPassword).label}
                        </span>
                      </div>
                      <div style={{ height: '3px', width: '100%', borderRadius: '1.5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: checkPasswordStrength(changeNewPassword).isStrong ? '100%' : '35%',
                            background: checkPasswordStrength(changeNewPassword).color,
                            borderRadius: '1.5px',
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
                  style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', gap: '8px', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading && <RefreshCw className="sync-spinner" size={16} />}
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

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

  // Otherwise render the SaaS website landing page
  const parsedCalcIncome = parseFloat(calcIncome) || 0;
  const needsAmount = parsedCalcIncome * 0.5;
  const wantsAmount = parsedCalcIncome * 0.3;
  const savingsAmount = parsedCalcIncome * 0.2;

  const faqs = [
    {
      q: "Is my bank login credentials safe?",
      a: "Yes! We simulate secure OAuth/Plaid sandbox integration. In a production environment, your banking credentials never touch our servers and connection is entirely read-only."
    },
    {
      q: "What is the 50/30/20 budget framework?",
      a: "It's a popular personal finance guide: 50% of your income goes towards Needs (utilities, groceries, rent), 30% towards Wants (entertainment, dining, shopping), and 20% towards Savings, investments, or debt reduction."
    },
    {
      q: "Can I download my expense history?",
      a: "Absolutely! FinSync allows you to export your complete transaction ledger as a standard CSV spreadsheet or trigger an automated email report directly to your inbox."
    }
  ];

  return (
    <div className="landing-container animate-fade-in">
      {/* SaaS Navigation Bar */}
      <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logoImg} alt="FinSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(90deg, var(--text-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FinSync
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Smart Expense Tracker</span>
          </div>
        </div>

        <div className="nav-links">
          <span className="nav-link" onClick={() => scrollToSection('features')}>Features</span>
          <span className="nav-link" onClick={() => scrollToSection('calculator')}>Budget Calculator</span>
          <span className="nav-link" onClick={() => scrollToSection('testimonials')}>Reviews</span>
          <span className="nav-link" onClick={() => scrollToSection('faq')}>FAQ</span>
        </div>

        <div className="nav-actions">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-secondary btn-icon"
            style={{ padding: '10px' }}
          >
            {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
          </button>
          <button className="btn btn-secondary" onClick={() => { setAuthView('login'); setIsAuthModalOpen(true); }}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => { setAuthView('register'); setIsAuthModalOpen(true); }}>
            Get Started
          </button>
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button
          className="hamburger-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Panel Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-panel">
          <div className="mobile-menu-links">
            <span className="nav-link" onClick={() => { scrollToSection('features'); setIsMobileMenuOpen(false); }}>Features</span>
            <span className="nav-link" onClick={() => { scrollToSection('calculator'); setIsMobileMenuOpen(false); }}>Budget Calculator</span>
            <span className="nav-link" onClick={() => { scrollToSection('testimonials'); setIsMobileMenuOpen(false); }}>Reviews</span>
            <span className="nav-link" onClick={() => { scrollToSection('faq'); setIsMobileMenuOpen(false); }}>FAQ</span>
          </div>
          <div className="mobile-menu-actions">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Theme</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn btn-secondary btn-icon"
                style={{ padding: '10px' }}
              >
                {theme === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
              </button>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => { setAuthView('login'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}>
              Sign In
            </button>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => { setAuthView('register'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}>
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-text">
          <div className="hero-badge">⚡ Automated Money Syncing</div>
          <h1 className="hero-title">
            Take Control of Your Money. <br />
            <span>Sync. Track. Grow.</span>
          </h1>
          <p className="hero-desc">
            Connect bank feeds securely, visualize spending category reports in real-time, and automate your budgeting using standard financial principles. Make your savings count automatically.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={() => { setAuthView('register'); setIsAuthModalOpen(true); }}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }} onClick={() => scrollToSection('calculator')}>
              Try Calculator
            </button>
          </div>
        </div>

        <div className="hero-preview">
          <div className="preview-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FinSync Live Demo</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', height: '80%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Spent</span>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px' }}>₹18,450.00</h4>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Savings Rate</span>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>63%</h4>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px' }}>
                {/* SVG Mini Doughnut Preview */}
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray="220" strokeDashoffset="120" transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#8b5cf6" strokeWidth="8" strokeDasharray="220" strokeDashoffset="180" transform="rotate(30 50 50)" />
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray="220" strokeDashoffset="200" transform="rotate(110 50 50)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Core Features</span>
          <h2 className="section-title">Smart Budgeting Made Simpler</h2>
          <p className="section-subtitle">Tired of manually managing ledgers? FinSync automates the tracking so you can focus on building wealth.</p>
        </div>

        <div className="features-grid">
          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <Shield size={24} />
            </div>
            <h4>Bank-Grade Security</h4>
            <p>Your connections are read-only and secured with bank-grade standards. We never store credentials or execute transactions.</p>
          </div>

          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <RefreshCw size={24} />
            </div>
            <h4>Automated Bank Feeds</h4>
            <p>Integrate with Kotak, SBI, Wells Fargo, and card issuers to securely import and automatically log transactions in real-time.</p>
          </div>

          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <Activity size={24} />
            </div>
            <h4>Doughnut Aggregates</h4>
            <p>Visualize exactly where your funds go with live SVG category breakdown reports and weekly spend charts.</p>
          </div>

          <div className="glass-panel feature-card">
            <div className="feature-icon-wrapper">
              <Sparkles size={24} />
            </div>
            <h4>50/30/20 Insights</h4>
            <p>Understand your metrics. Evaluate your Net Savings and Savings Rate percentages directly against targets.</p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="calculator-section" id="calculator">
        <div className="calculator-container glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Financial Planner</span>
            <h2 className="section-title" style={{ marginTop: '8px' }}>50/30/20 Budget Estimator</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>See the suggested allocation for your salary before signing up.</p>
          </div>

          <div className="calculator-grid">
            <div className="calculator-inputs">
              <div className="form-group">
                <label className="form-label">Your Monthly Salary (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    className="form-input"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(e.target.value)}
                    style={{ paddingLeft: '40px', fontSize: '1.1rem', fontWeight: 600 }}
                    min="1"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                <h5 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '0.9rem' }}>
                  <Sparkles size={16} /> Budget Advice
                </h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  Based on your ₹{parsedCalcIncome.toLocaleString()} salary, you should save at least ₹{savingsAmount.toLocaleString()} monthly. Track this breakdown dynamically in our app!
                </p>
              </div>

              <button className="btn btn-primary" onClick={handleApplyBudget} style={{ width: '100%', padding: '12px' }}>
                Apply This Budget to My Account
              </button>
            </div>

            <div className="calculator-results">
              <div className="budget-breakdown-row" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="budget-info">
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
                  <div>
                    <div className="budget-label">Needs (50%)</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rent, food, EMI, bills</span>
                  </div>
                </div>
                <div className="budget-amount">₹{needsAmount.toLocaleString()}</div>
              </div>

              <div className="budget-breakdown-row" style={{ borderLeft: '4px solid #0ea5e9' }}>
                <div className="budget-info">
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9' }}></span>
                  <div>
                    <div className="budget-label">Wants (30%)</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shopping, travel, dining</span>
                  </div>
                </div>
                <div className="budget-amount">₹{wantsAmount.toLocaleString()}</div>
              </div>

              <div className="budget-breakdown-row" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div className="budget-info">
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }}></span>
                  <div>
                    <div className="budget-label">Savings (20%)</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Investments, emergency reserves</span>
                  </div>
                </div>
                <div className="budget-amount">₹{savingsAmount.toLocaleString()}</div>
              </div>

              {/* Stacked Bar visual */}
              <div style={{ height: '14px', display: 'flex', borderRadius: '6px', overflow: 'hidden', marginTop: '10px', boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)' }}>
                <div style={{ width: '50%', background: '#10b981' }} title="Needs: 50%" />
                <div style={{ width: '30%', background: '#0ea5e9' }} title="Wants: 30%" />
                <div style={{ width: '20%', background: '#8b5cf6' }} title="Savings: 20%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Testimonials</span>
          <h2 className="section-title">What Our Members Say</h2>
          <p className="section-subtitle">Real feedback from users who took back control of their financial trajectory.</p>
        </div>

        <div className="testimonials-grid">
          <div className="glass-panel testimonial-card">
            <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
            </div>
            <p className="testimonial-text">
              "Connecting my bank accounts was extremely simple. Within a day, I realized I was spending 40% on wants instead of 30%! Highly recommended for tracking."
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">AS</div>
              <div className="testimonial-details">
                <h5>Aditya Sharma</h5>
                <span>Verified User</span>
              </div>
            </div>
          </div>

          <div className="glass-panel testimonial-card">
            <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
            </div>
            <p className="testimonial-text">
              "The automatic category grouping is accurate. The CSV export is awesome for taxes, and the visual reports are beautiful. Best expense tracking system."
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">PM</div>
              <div className="testimonial-details">
                <h5>Pooja Mehta</h5>
                <span>Product Manager</span>
              </div>
            </div>
          </div>

          <div className="glass-panel testimonial-card">
            <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', marginBottom: '10px' }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
            </div>
            <p className="testimonial-text">
              "FinSync helped me save for my downpayment. Watching my Savings Rate percentage tick upward on the stats dashboard kept me super motivated!"
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">VK</div>
              <div className="testimonial-details">
                <h5>Vikram Kapoor</h5>
                <span>Software Architect</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" id="faq">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`glass-panel faq-item ${activeFaq === index ? 'active' : ''}`}
              onClick={() => toggleFaq(index)}
              style={{ transition: 'all 0.3s ease' }}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <ChevronRight
                  size={18}
                  style={{
                    transform: activeFaq === index ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'var(--accent-primary)'
                  }}
                />
              </div>
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-content">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img src={logoImg} alt="FinSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>FinSync</h3>
            </div>
            <p>Smart, real-time automated expense tracking and visual aggregates.</p>
          </div>

          <div className="footer-links-col">
            <h5>Product</h5>
            <ul>
              <li><span className="nav-link" onClick={() => scrollToSection('features')}>Features</span></li>
              <li><span className="nav-link" onClick={() => scrollToSection('calculator')}>Budget Calculator</span></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h5>Resources</h5>
            <ul>
              <li><span className="nav-link" onClick={() => scrollToSection('faq')}>FAQ</span></li>
              <li><span className="nav-link" onClick={() => scrollToSection('testimonials')}>Reviews</span></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} FinSync Inc. All rights reserved. Built for secure financial management.</span>
          <span>Read-only sandbox simulation.</span>
        </div>
      </footer>

      {/* Glassmorphic Unified Auth Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="glass-panel auth-card animate-slide-up" style={{ maxWidth: '440px', padding: '40px', position: 'relative' }}>
            {/* Close modal button */}
            <button
              className="modal-close"
              onClick={() => { setIsAuthModalOpen(false); setVerifyingEmail(null); }}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {verifyingEmail ? (
              // Verification OTP Form
              <div>
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
            ) : authView === 'forgot-request' ? (
              // Forgot Password Request Form
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Forgot Password</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                    Enter your email address and we'll send you a 6-digit OTP code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotPasswordRequestSubmit}>
                  <div className="form-group" style={{ marginBottom: '24px' }}>
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

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}
                  >
                    {loading ? <RefreshCw className="sync-spinner" size={18} /> : null}
                    Send Reset Code
                  </button>
                </form>

                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px', textAlign: 'center' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                    onClick={() => {
                      setAuthView('login');
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : authView === 'forgot-verify' ? (
              // Reset Password Verification Form
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Reset Password</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                    We sent a 6-digit code to <strong>{resetEmail}</strong>. Enter it along with your new password.
                  </p>
                </div>

                <form onSubmit={handleResetPasswordSubmit}>
                  <div className="form-group">
                    <label className="form-label">Verification Code</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '48px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
                        placeholder="000000"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingLeft: '48px', paddingRight: '48px' }}
                        placeholder="New Password (min 8 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
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
                        {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Password Strength</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: checkPasswordStrength(newPassword).color }}>
                            {checkPasswordStrength(newPassword).label}
                          </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: checkPasswordStrength(newPassword).isStrong ? '100%' : '35%',
                              background: checkPasswordStrength(newPassword).color,
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
                    Reset Password
                  </button>
                </form>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                    onClick={handleForgotPasswordRequestSubmit}
                    disabled={loading}
                  >
                    Resend Code
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                    onClick={() => {
                      setAuthView('login');
                      setResetEmail('');
                      setResetOtp('');
                      setNewPassword('');
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              // Login / Register Form
              <div>
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

                    {authView === 'login' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setAuthView('forgot-request')}
                          style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

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
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="toast animate-slide-up" style={{
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          fontWeight: 500,
          zIndex: 9999
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
