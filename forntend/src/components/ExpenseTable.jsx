import React from 'react';
import { Search, Download, Trash, Tag, Compass, CreditCard, Mail } from 'lucide-react';

const CATEGORY_BADGES = {
  Food: 'badge-success',       // Emerald
  Utilities: 'badge-info',     // Sky
  Entertainment: 'badge-warning', // Amber/Orange
  Transport: 'badge-info',     // Blue
  Shopping: 'badge-danger',    // Pink/Rose
  Healthcare: 'badge-info',    // Cyan
  Housing: 'badge-danger',     // Rose
  Other: 'badge-secondary',    // Slate
};

const getModeOfPayment = (source) => {
  if (!source) return 'Manual';
  if (source.startsWith('Bank Sync (')) {
    const match = source.match(/Bank Sync \(([^)]+)\)/);
    if (match) {
      const bankId = match[1];
      const bankMap = {
        'Chase': 'Kotak Mahindra Bank',
        'BofA': 'State Bank of India',
        'CapitalOne': 'Card',
        'WellsFargo': 'Bank of Maharashtra',
        'Kotak Mahindra Bank': 'Kotak Mahindra Bank',
        'State Bank of India': 'State Bank of India',
        'Card': 'Card',
        'Bank of Maharashtra': 'Bank of Maharashtra'
      };
      return bankMap[bankId] || bankId;
    }
  }
  return source;
};

function ExpenseTable({
  expenses,
  onDelete,
  categoryFilter,
  setCategoryFilter,
  searchVal,
  setSearchVal,
  apiBase,
  user,
  showToast
}) {
  const [emailLoading, setEmailLoading] = React.useState(false);

  const handleEmailList = async () => {
    if (expenses.length === 0) {
      showToast('You do not have any expenses to email yet.', 'danger');
      return;
    }

    try {
      setEmailLoading(true);
      showToast('Connecting and preparing your expense report email...', 'success');

      const response = await fetch(`${apiBase}/expenses/email-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Could not email expense list');
      }

      showToast(resData.message || 'Expense report sent successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to email expense report', 'danger');
    } finally {
      setEmailLoading(false);
    }
  };

  // Server-side CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      showToast('Preparing CSV export...', 'success');
      const response = await fetch(`${apiBase}/expenses/export`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Could not download CSV file');
      }

      const csvContent = await response.text();

      // Create a blob and triggers a browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `FinSync_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export data to CSV', 'danger');
    }
  };

  return (
    <div className="glass-panel table-panel animate-slide-up">
      {/* Search & Filter Header */}
      <div className="table-header">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          Transactions Log
        </h3>

        <div className="table-filters">
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search merchants..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{ width: '220px', paddingLeft: '36px', height: '40px', background: 'rgba(255,255,255,0.02)' }}
            />
          </div>

          {/* Category Select Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
            style={{ width: '150px', height: '40px', background: 'rgba(255,255,255,0.02)', color: 'blue ', cursor: 'pointer' }}
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Housing">Housing</option>
            <option value="Other">Other</option>
          </select>

          {/* CSV Export Button */}
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ height: '40px' }} title="Export Ledger to CSV">
            <Download size={16} />
            Export CSV
          </button>

          {/* Email Expense List Button */}
          <button
            className="btn btn-secondary"
            onClick={handleEmailList}
            disabled={emailLoading}
            style={{
              height: '40px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: emailLoading ? 'not-allowed' : 'pointer'
            }}
            title="Email Full Expense Report and CSV backup"
          >
            <Mail size={16} />
            {emailLoading ? 'Sending...' : 'Email List'}
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      {expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <Compass size={48} style={{ margin: '0 auto 15px auto', opacity: 0.4, display: 'block' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc', marginBottom: '4px' }}>No transactions recorded</p>
          <p style={{ fontSize: '0.85rem' }}>Link your bank feed or add manually to see transaction logs.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Merchant / Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Mode of Payment</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => {
                const badgeClass = CATEGORY_BADGES[exp.category] || 'badge-secondary';
                const isBankSource = exp.source && exp.source.startsWith('Bank Sync');

                return (
                  <tr key={exp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isBankSource ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isBankSource ? '#6366f1' : '#94a3b8',
                        }}>
                          {isBankSource ? <CreditCard size={15} /> : <Tag size={15} />}
                        </div>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{exp.title}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#f43f5e' }}>
                      -₹{exp.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      {new Date(exp.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: isBankSource ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: isBankSource ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid rgba(255,255,255,0.05)',
                        color: isBankSource ? '#c084fc' : '#94a3b8',
                        fontSize: '0.75rem',
                      }}>
                        {getModeOfPayment(exp.source)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-danger btn-icon"
                        onClick={() => onDelete(exp._id)}
                        style={{ padding: '6px' }}
                        title="Delete record"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ExpenseTable;
