import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, TrendingDown, ArrowUpRight, Compass, RefreshCw, X, Edit, Check } from 'lucide-react';
import BankSync from './BankSync';
import ExpenseTable from './ExpenseTable';

const CATEGORY_COLORS = {
  Food: '#10b981',        // Emerald
  Utilities: '#0ea5e9',   // Sky
  Entertainment: '#8b5cf6',// Purple
  Transport: '#f59e0b',   // Amber
  Shopping: '#ec4899',    // Pink
  Healthcare: '#06b6d4',  // Cyan
  Housing: '#f43f5e',     // Rose
  Other: '#64748b',       // Slate
};

function Dashboard({ user, setUser, apiBase, showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState({ totalSpent: 0, categories: [] });
  const [loading, setLoading] = useState(false);
  const [syncingBank, setSyncingBank] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState((user.monthlyIncome || 5500).toString());

  useEffect(() => {
    setIncomeInput((user.monthlyIncome || 5500).toString());
  }, [user.monthlyIncome]);
  
  // Filters
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Add Expense Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived metrics
  const currentIncome = user.monthlyIncome || 5500;
  const netSavings = currentIncome - reports.totalSpent;
  const savingsRate = currentIncome > 0 ? ((netSavings / currentIncome) * 100).toFixed(0) : 0;

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    const parsedIncome = parseFloat(incomeInput);
    if (isNaN(parsedIncome) || parsedIncome <= 0) {
      showToast('Please enter a valid positive income amount', 'warning');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/income`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ income: parsedIncome }),
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, monthlyIncome: data.data.monthlyIncome };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setIsEditingIncome(false);
        showToast('Monthly income updated successfully!', 'success');
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showToast(err.message || 'Could not update income', 'danger');
    }
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch expenses list
      const expRes = await fetch(
        `${apiBase}/expenses?category=${category}&search=${search}&page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const expData = await expRes.json();
      if (expRes.ok) {
        setExpenses(expData.data);
      }

      // 2. Fetch monthly aggregate report
      const repRes = await fetch(
        `${apiBase}/expenses/reports/monthly?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const repData = await repRes.json();
      if (repRes.ok) {
        setReports(repData.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch transaction data', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, search, month, year, user.token]);

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle || !newAmount) {
      showToast('Please fill out all fields', 'warning');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          amount: parseFloat(newAmount),
          category: newCategory,
          date: newDate,
          source: 'Manual',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Expense added successfully!', 'success');
        setIsAddModalOpen(false);
        // Reset form
        setNewTitle('');
        setNewAmount('');
        setNewCategory('Food');
        setNewDate(new Date().toISOString().split('T')[0]);
        // Refresh data
        fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showToast(err.message || 'Could not add expense', 'danger');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const response = await fetch(`${apiBase}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        showToast('Expense removed', 'success');
        fetchData();
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (err) {
      showToast(err.message || 'Could not delete expense', 'danger');
    }
  };

  // Render Category Doughnut Chart (Dynamic SVG)
  const renderDoughnutChart = () => {
    const categories = reports.categories || [];
    const isReportEmpty = categories.length === 0;

    // Standard list of all categories to guarantee visibility
    const allCategoriesList = ['Food', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Healthcare', 'Housing', 'Other'];
    
    // Build category display items
    const displayItems = allCategoriesList.map(catName => {
      const match = categories.find(c => c.category === catName);
      return {
        category: catName,
        amount: match ? match.amount : 0,
        percent: reports.totalSpent > 0 && match ? ((match.amount / reports.totalSpent) * 100).toFixed(0) : '0'
      };
    }).sort((a, b) => b.amount - a.amount); // Sort by amount descending

    let accumulatedPercentage = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '150px', height: '150px' }}>
          <svg width="100%" height="100%" viewBox="0 0 140 140">
            {/* Background base circle */}
            <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="16" />
            
            {isReportEmpty ? (
              // Empty placeholder slice
              <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
            ) : (
              categories.map((cat, idx) => {
                const percent = (cat.amount / reports.totalSpent) * 100;
                const strokeLength = (percent / 100) * circumference;
                const strokeOffset = circumference - (accumulatedPercentage / 100) * circumference;
                accumulatedPercentage += percent;
                const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other;

                return (
                  <circle
                    key={idx}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth="14"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    transform="rotate(-90 70 70)"
                    style={{
                      transition: 'stroke-dashoffset 0.8s ease',
                      cursor: 'pointer',
                    }}
                    title={`${cat.category}: ₹${cat.amount}`}
                  />
                );
              })
            )}
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em' }}>Spent</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{reports.totalSpent.toFixed(0)}</p>
          </div>
        </div>

        {/* Legend listing all categories */}
        <div className="category-legend" style={{ flex: 1, minWidth: '170px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
          {displayItems.map((cat, idx) => {
            const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other;
            return (
              <div key={idx} className="legend-item" style={{ marginBottom: '4px' }}>
                <div className="legend-label">
                  <span className="legend-dot" style={{ backgroundColor: color, width: '8px', height: '8px' }}></span>
                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{cat.category}</span>
                </div>
                <span className="legend-percentage" style={{ fontSize: '0.8rem' }}>
                  ₹{cat.amount.toFixed(0)} ({cat.percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Spending Trend Bar Chart (Last 7 synced items/days or manual entries)
  const renderTrendChart = () => {
    // Generate trend coordinates from expenses
    const recent = expenses.slice(0, 7).reverse();
    if (recent.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#64748b' }}>
          <Compass size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9rem' }}>No recent transactions found.</p>
        </div>
      );
    }

    const maxAmt = Math.max(...recent.map(e => e.amount), 50);
    const chartHeight = 150;

    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: `${chartHeight}px`, paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {recent.map((exp, idx) => {
            const heightPct = (exp.amount / maxAmt) * chartHeight;
            const color = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  className="chart-bar-hover"
                  style={{
                    width: '60%',
                    maxWidth: '32px',
                    height: `${Math.max(heightPct, 6)}px`,
                    background: `linear-gradient(to top, ${color} 70%, rgba(255,255,255,0.4) 100%)`,
                    borderRadius: '4px 4px 0 0',
                    boxShadow: `0 0 10px ${color}33`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                  title={`${exp.title}: ₹${exp.amount}`}
                />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                  {new Date(exp.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Top Filter and Controls Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))} 
              className="form-input" 
              style={{ width: '140px', paddingLeft: '38px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </div>

          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))} 
            className="form-input" 
            style={{ width: '100px', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {loading && <RefreshCw className="sync-spinner" size={16} />}
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Metrics Stat Cards */}
      <div className="stats-grid">
        {isEditingIncome ? (
          <div className="glass-panel stat-card animate-fade-in" style={{ border: '1px solid var(--accent-primary)', minHeight: '100px' }}>
            <form onSubmit={handleSaveIncome} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Edit Income</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={incomeInput} 
                  onChange={(e) => setIncomeInput(e.target.value)} 
                  style={{ padding: '4px 10px', height: '34px', fontSize: '0.9rem', marginTop: '2px', background: 'rgba(0,0,0,0.2)' }}
                  autoFocus
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', alignSelf: 'flex-end', height: '34px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 8px', height: '100%' }}>
                  <Check size={14} />
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditingIncome(false); setIncomeInput(currentIncome.toString()); }} style={{ padding: '6px 8px', height: '100%' }}>
                  <X size={14} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div 
            className="glass-panel stat-card animate-fade-in" 
            style={{ cursor: 'pointer', position: 'relative' }} 
            onClick={() => setIsEditingIncome(true)}
            title="Click to edit monthly income"
          >
            <div className="stat-info">
              <h4>Total Income</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p>₹{currentIncome.toLocaleString()}</p>
                <Edit size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              </div>
            </div>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <ArrowUpRight size={24} />
            </div>
          </div>
        )}

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Total Spent</h4>
            <p>₹{reports.totalSpent.toLocaleString()}</p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Net Savings</h4>
            <p style={{ color: netSavings >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{netSavings.toLocaleString()}
            </p>
          </div>
          <div className="stat-icon-wrapper" style={{ 
            background: netSavings >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: netSavings >= 0 ? '#10b981' : '#ef4444'
          }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-info">
            <h4>Savings Rate</h4>
            <p>{savingsRate}%</p>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>%</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Bank Sync + Charts */}
      <div className="charts-grid">
        {/* Left Column: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <h3>Category Share</h3>
              </div>
              {renderDoughnutChart()}
            </div>

            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <h3>Recent Spending</h3>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {renderTrendChart()}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bank API Widget */}
        <BankSync 
          user={user} 
          setUser={setUser}
          apiBase={apiBase} 
          showToast={showToast} 
          refreshData={fetchData} 
          syncing={syncingBank}
          setSyncing={setSyncingBank}
        />
      </div>

      {/* Expenses Table Panel */}
      <ExpenseTable 
        expenses={expenses}
        onDelete={handleDeleteExpense}
        categoryFilter={category}
        setCategoryFilter={setCategory}
        searchVal={search}
        setSearchVal={setSearch}
        apiBase={apiBase}
        user={user}
        showToast={showToast}
      />

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={22} style={{ color: '#6366f1' }} />
              Log Expense
            </h3>

            <form onSubmit={handleAddExpenseSubmit}>
              <div className="form-group">
                <label className="form-label">Title / Merchant</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Starbucks Coffee"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="form-input" 
                    placeholder="25.50"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Food">Food</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Housing">Housing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Transaction Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
