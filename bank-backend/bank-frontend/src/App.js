import React, { useState, useEffect } from "react";
import { createAccount, deposit, withdraw, checkBalance, getDashboardOverview } from "./services/api";
import { 
  Landmark, UserCircle, Home, CreditCard, Briefcase, Settings, 
  ArrowDownCircle, ArrowUpCircle, PlusCircle, Loader2, CheckCircle2, AlertCircle, Sparkles, LogIn
} from "lucide-react";
import "./App.css";

// Reusable Toast Component
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? <CheckCircle2 size={20} className="text-accent-green" /> : <AlertCircle size={20} className="text-accent-red" />}
      <span>{message}</span>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [createData, setCreateData] = useState({ name: "", initialBalance: "" });
  const [txData, setTxData] = useState({ accountId: "", amount: "" });
  const [manualBalanceCheck, setManualBalanceCheck] = useState(null);
  
  // --- NEW: Authentication & Login States ---
  const [hasAccount, setHasAccount] = useState(false); 
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginAccountId, setLoginAccountId] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Dashboard Overview State
  const [accountBalances, setAccountBalances] = useState({ checking: 0, savings: 0, total: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const [loading, setLoading] = useState({ create: false, deposit: false, withdraw: false, check: false, login: false });
  const [toast, setToast] = useState({ message: "", type: "" });

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: "", type: "" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.message]);

  const showToast = (message, type = "success") => setToast({ message, type });

  // --- NEW: Handle Existing User Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginAccountId) return showToast("Enter Account ID to login", "error");

    setLoading(p => ({ ...p, login: true }));
    try {
      // We check the balance to verify the account exists
      const res = await checkBalance(loginAccountId);
      
      const balance = res.data;
      const simulatedSavings = balance * 0.25; // Simulating savings split for display
      const simulatedChecking = balance * 0.75;
      
      setAccountBalances({
        checking: simulatedChecking,
        savings: simulatedSavings,
        total: balance
      });

      setLoggedInUser(loginAccountId);
      setTxData({ accountId: loginAccountId, amount: "" }); // Pre-fill ID for transactions
      setHasAccount(true); // Unlock dashboard
      showToast("Logged in successfully", "success");

    } catch (error) {
      showToast("Account not found. Please check the ID.", "error");
    } finally {
      setLoading(p => ({ ...p, login: false }));
    }
  };

  // Handle New Account Creation
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.name || !createData.initialBalance) return showToast("Fill all fields", "error");
    
    setLoading(p => ({ ...p, create: true }));
    try {
      await createAccount({ name: createData.name, balance: createData.initialBalance });
      showToast(`Account Created Successfully`, "success");
      
      const newBal = Number(createData.initialBalance);
      const toSavings = newBal * 0.25;
      const toChecking = newBal * 0.75;

      setAccountBalances({
        checking: toChecking,
        savings: toSavings,
        total: newBal
      });

      const newActivity = {
        date: new Date().toLocaleDateString(),
        description: `Account Created: ${createData.name}`,
        amount: newBal,
        type: 'DEPOSIT'
      };
      setRecentTransactions(prev => [newActivity, ...prev]);

      setLoggedInUser("New"); // We don't have the exact ID from backend creation in this mock, so we label it "New"
      setCreateData({ name: "", initialBalance: "" });
      
      // UNLOCK THE DASHBOARD 
      setHasAccount(true);

    } catch (error) {
      showToast("Error creating account", "error");
    } finally {
      setLoading(p => ({ ...p, create: false }));
    }
  };

  // Handle Transactions
  const handleTransaction = async (type, apiCall) => {
    if (!txData.accountId || !txData.amount) return showToast("Enter ID and Amount", "error");

    setLoading(p => ({ ...p, [type]: true }));
    try {
      await apiCall(txData.accountId, txData.amount);
      showToast(type === 'deposit' ? "Deposit Successful" : "Withdrawal Successful", "success");
      
      const amountNum = Number(txData.amount);

      setAccountBalances(prev => {
        if (type === 'deposit') {
          // Deposits split 75% to checking, 25% to savings
          const toSavings = amountNum * 0.25;
          const toChecking = amountNum * 0.75;
          return {
            checking: prev.checking + toChecking,
            savings: prev.savings + toSavings,
            total: prev.total + amountNum
          };
        } else {
          // Withdrawals ONLY deduct from checking
          return {
            checking: prev.checking - amountNum,
            savings: prev.savings,
            total: prev.total - amountNum
          };
        }
      });

      const newActivity = {
        date: new Date().toLocaleDateString(),
        description: type === 'deposit' ? `Deposit to ID: ${txData.accountId}` : `Withdrawal from ID: ${txData.accountId}`,
        amount: amountNum,
        type: type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL'
      };
      setRecentTransactions(prev => [newActivity, ...prev]);

      setTxData(p => ({ ...p, amount: "" }));
      handleCheck(txData.accountId);
    } catch (error) {
      showToast(`${type} Failed. Check balance or ID.`, "error");
    } finally {
      setLoading(p => ({ ...p, [type]: false }));
    }
  };

  // Handle Balance Check
  const handleCheck = async (idToUse = txData.accountId) => {
    if (!idToUse) return showToast("Enter Account ID", "error");

    setLoading(p => ({ ...p, check: true }));
    try {
      const res = await checkBalance(idToUse);
      setManualBalanceCheck(res.data);
      
      setAccountBalances(prev => ({
        ...prev,
        checking: res.data,
        total: res.data + prev.savings // Approximating total if savings is static
      }));

    } catch (error) {
      showToast("Error fetching balance", "error");
      setManualBalanceCheck(null);
    } finally {
      setLoading(p => ({ ...p, check: false }));
    }
  };

  // Sidebar Configuration
  const sidebarItems = [
    { id: 'home', icon: Home, title: 'Dashboard' },
    { id: 'loans', icon: CreditCard, title: 'Loans' },
    { id: 'services', icon: Briefcase, title: 'Bank Services' }
  ];

  return (
    <div className="dashboard-layout">
      <Toast message={toast.message} type={toast.type} />

      <aside className="sidebar">
        {sidebarItems.map((item) => (
          <div 
            key={item.id}
            className={`sidebar-icon ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
            title={item.title}
          >
            <item.icon size={24} />
          </div>
        ))}
        <div 
          className={`sidebar-icon ${currentView === 'settings' ? 'active' : ''}`} 
          style={{marginTop: 'auto'}}
          onClick={() => setCurrentView('settings')}
          title="Settings"
        >
          <Settings size={24} />
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="brand">
            <Landmark size={28} color="#3b82f6" /> Next Gen Banking Hub
          </div>
          <div className="user-profile">
            <UserCircle size={20} /> 
            {loggedInUser ? `User ID: ${loggedInUser}` : 'Guest'}
          </div>
        </header>

        {/* --- LOANS VIEW --- */}
        {currentView === 'loans' && (
           <div className="glass-panel" style={{ height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
             <CreditCard size={64} style={{ color: '#3b82f6', marginBottom: '20px' }} />
             <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>Loan Management</h2>
             <p style={{ color: '#94a3b8', maxWidth: '400px' }}>Apply for personal or business loans, check interest rates, and manage your active loan repayments here. (Feature coming soon)</p>
           </div>
        )}

        {/* --- SERVICES VIEW --- */}
        {currentView === 'services' && (
           <div className="glass-panel" style={{ height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
             <Briefcase size={64} style={{ color: '#3b82f6', marginBottom: '20px' }} />
             <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>Bank Services</h2>
             <p style={{ color: '#94a3b8', maxWidth: '400px' }}>Access premium wealth management, order new checkbooks, manage debit/credit cards, and speak to an advisor. (Feature coming soon)</p>
           </div>
        )}

        {/* --- HOME DASHBOARD VIEW --- */}
        {currentView === 'home' && (
          <>
            {!hasAccount ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70%' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', textAlign: 'center' }}>
                  <Sparkles size={40} className="text-accent-blue mx-auto mb-4" style={{ color: '#3b82f6', marginBottom: '15px' }} />
                  <h2 className="panel-title" style={{ fontSize: '24px' }}>Welcome</h2>
                  <p style={{ color: '#94a3b8', marginBottom: '25px', fontSize: '14px' }}>
                    Please authenticate to access your financial dashboard.
                  </p>
                  
                  {/* --- NEW: LOGIN / CREATE TABS --- */}
                  <div className="tabs" style={{ marginBottom: '20px' }}>
                    <button 
                      className={`tab-btn ${!isLoginMode ? 'active' : ''}`}
                      onClick={() => setIsLoginMode(false)}
                      type="button"
                    >
                      New Account
                    </button>
                    <button 
                      className={`tab-btn ${isLoginMode ? 'active' : ''}`}
                      onClick={() => setIsLoginMode(true)}
                      type="button"
                    >
                      Login
                    </button>
                  </div>

                  {isLoginMode ? (
                    /* --- LOGIN FORM --- */
                    <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                      <div className="form-group">
                        <label>Existing Account ID</label>
                        <input 
                          className="input-dark" 
                          placeholder="Enter your Account ID (e.g. 1)"
                          value={loginAccountId}
                          onChange={(e) => setLoginAccountId(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn-action bg-blue" disabled={loading.login}>
                        {loading.login ? <Loader2 className="loader" size={20} /> : <><LogIn size={20} /> Login Securely</>}
                      </button>
                    </form>
                  ) : (
                    /* --- CREATE FORM --- */
                    <form onSubmit={handleCreate} style={{ textAlign: 'left' }}>
                      <div className="form-group">
                        <label>Account Holder Name</label>
                        <input 
                          className="input-dark" 
                          placeholder="e.g. Alex Thompson"
                          value={createData.name}
                          onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Initial Opening Balance (₹)</label>
                        <input 
                          type="number"
                          className="input-dark" 
                          placeholder="0"
                          value={createData.initialBalance}
                          onChange={(e) => setCreateData({ ...createData, initialBalance: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn-action bg-blue" disabled={loading.create}>
                        {loading.create ? <Loader2 className="loader" size={20} /> : <><PlusCircle size={20} /> Open Account</>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="dashboard-grid">
                <div className="col-left">
                  <div className="glass-panel">
                    <h2 className="panel-title">Overview Section</h2>
                    <div className="overview-cards">
                      <div className="stat-card">
                        <div className="stat-title">Checking Account</div>
                        <div className="stat-value">
                          {loadingOverview ? <Loader2 className="loader" size={20} /> : `₹${accountBalances.checking.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-title">Savings Account</div>
                        <div className="stat-value">
                          {loadingOverview ? <Loader2 className="loader" size={20} /> : `₹${accountBalances.savings.toLocaleString()}`}
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-title">Total Balance</div>
                        <div className="stat-value" style={{color: '#3b82f6'}}>
                          {loadingOverview ? <Loader2 className="loader" size={20} /> : `₹${accountBalances.total.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel">
                    <h2 className="panel-title">Recent Activity</h2>
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td>{tx.date}</td>
                            <td>{tx.description}</td>
                            <td style={{ color: tx.type === 'DEPOSIT' ? '#10b981' : '#ef4444' }}>
                              {tx.type === 'DEPOSIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </td>
                            <td style={{ color: '#10b981' }}>Success</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-right">
                  <div className="glass-panel">
                    <h2 className="panel-title">Transaction Hub</h2>
                    
                    <div>
                      <div className="form-group">
                        <label>Target Account ID</label>
                        <input 
                          className="input-dark" 
                          placeholder="e.g. 1"
                          value={txData.accountId}
                          onChange={(e) => setTxData({ ...txData, accountId: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Transfer Amount (₹)</label>
                        <input 
                          type="number"
                          className="input-dark" 
                          placeholder="0"
                          value={txData.amount}
                          onChange={(e) => setTxData({ ...txData, amount: e.target.value })}
                        />
                      </div>
                      <div className="btn-row">
                        <button className="btn-action bg-green" onClick={() => handleTransaction('deposit', deposit)} disabled={loading.deposit}>
                          {loading.deposit ? <Loader2 className="loader" size={20} /> : <><ArrowDownCircle size={20} /> Deposit</>}
                        </button>
                        <button className="btn-action bg-red" onClick={() => handleTransaction('withdraw', withdraw)} disabled={loading.withdraw}>
                          {loading.withdraw ? <Loader2 className="loader" size={20} /> : <><ArrowUpCircle size={20} /> Withdraw</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel">
                    <h2 className="panel-title">Balance Check Panel</h2>
                    <button className="btn-action bg-gray" onClick={() => handleCheck()} disabled={loading.check}>
                      {loading.check ? <Loader2 className="loader" size={20} /> : "Check Target Balance"}
                    </button>
                    
                    {manualBalanceCheck !== null && (
                      <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '5px' }}>
                          Balance for ID {txData.accountId}:
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                          ₹{manualBalanceCheck.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}