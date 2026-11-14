import { useEffect, useState } from 'react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const curriculum = [
  { day: 'Day 1', title: 'SQL foundations', topics: 'Databases, tables, SELECT, DISTINCT, WHERE, ORDER BY and LIMIT.' },
  { day: 'Day 2', title: 'Filtering and grouping', topics: 'Comparison operators, logical conditions, aggregate functions, GROUP BY and HAVING.' },
  { day: 'Day 3', title: 'Joins and relationships', topics: 'INNER, LEFT, RIGHT joins, self joins and combining data across tables.' },
  { day: 'Day 4', title: 'Subqueries and CTEs', topics: 'Scalar and correlated subqueries, IN, EXISTS, ANY, ALL and common table expressions.' },
  { day: 'Day 5', title: 'CASE WHEN and business logic', topics: 'Conditional expressions, conditional aggregation and practical business questions.' },
  { day: 'Day 6', title: 'Window functions', topics: 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD and PARTITION BY.' },
  { day: 'Day 7', title: 'Interview practice and project', topics: 'Solve practical analyst problems, revise key concepts and complete a mini SQL project.' }
];

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('register');

  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [apiStatus, setApiStatus] = useState('Checking');
  const [message, setMessage] = useState('');

  // SQL Editor state
  const [query, setQuery] = useState('SELECT * FROM employees;');
  const [queryResults, setQueryResults] = useState(null);
  const [queryError, setQueryError] = useState('');

  // Admin Dashboard State
  const [adminSecret, setAdminSecret] = useState('');
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminError, setAdminError] = useState('');

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');

  // Payment Verification State
  const [isPaymentVerified, setIsPaymentVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function call(path, options = {}, authToken = token) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Request failed');
    return data;
  }

  useEffect(() => {
    fetch(`${API}/`)
      .then(response => {
        if (!response.ok) throw new Error('API unavailable');
        return response.json();
      })
      .then(() => setApiStatus('Connected'))
      .catch(() => setApiStatus('Temporarily unavailable'));
  }, []);

  async function loadItems(currentToken = token) {
    try {
      const data = await call('/api/items', {}, currentToken);
      setItems(Array.isArray(data.items) ? data.items : data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) loadItems(token);
  }, [token]);

  function openModal(mode) {
    setModalMode(mode);
    setMessage('');
    setIsModalOpen(true);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setMessage('');
    try {
      const endpoint = modalMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = { email, password, fullName, whatsappNumber };
      const data = await call(endpoint, { method: 'POST', body: JSON.stringify(body) }, '');
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setIsModalOpen(false);
      setPassword('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addItem(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      await call('/api/items', { method: 'POST', body: JSON.stringify({ title }) });
      setTitle('');
      await loadItems();
      setMessage('Saved successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function runQuery() {
    setQueryError('');
    setQueryResults(null);
    try {
      const data = await call('/api/practice/execute', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      setQueryResults(data);
    } catch (error) {
      setQueryError(error.message);
    }
  }

  async function fetchStudents() {
    setAdminError('');
    try {
      const res = await fetch(`${API}/api/admin/students?secret=${adminSecret}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch');
      }
      const data = await res.json();
      setAdminStudents(data);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setItems([]);
    setMessage('You have been logged out.');
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 200,
          customerName: checkoutName,
          customerEmail: checkoutEmail,
          customerPhone: checkoutPhone,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const cashfree = window.Cashfree({ mode: "production" });
      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (error) {
      alert("Payment Error: " + error.message);
    }
  };

  // Verify payment when the page loads with an order_id
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const orderId = queryParams.get('order_id');

    if (orderId && !token) {
      setIsVerifying(true);
      fetch(`${API}/api/payment/verify-payment?orderId=${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.isPaid) {
            setIsPaymentVerified(true);
          }
        })
        .catch(err => console.error("Verification error:", err))
        .finally(() => setIsVerifying(false));
    }
  }, [token]);

  // --- SUCCESS PAGE AFTER PAYMENT ---
  const queryParams = new URLSearchParams(window.location.search);
  const orderId = queryParams.get('order_id');
  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/GA9LNIFJeSz2sSQymKA6Km"; // <-- YOUR GROUP LINK

  if (orderId && !token) {
    if (isVerifying) {
      return (
        <div className="app-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
          <h2>Verifying your payment... Please wait.</h2>
        </div>
      );
    }

    if (isPaymentVerified) {
      return (
        <div className="app-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
          <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ background: '#dcfce7', color: '#166534', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto', fontSize: '2rem' }}>✓</div>
            <h2 style={{ marginBottom: '1rem' }}>Payment Successful!</h2>
            <p style={{ color: '#475569', marginBottom: '2rem' }}>Thank you for joining MasterSQL. Click the button below to join the private WhatsApp group where all course links and updates will be shared.</p>
            <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
              Join WhatsApp Group
            </a>
          </div>
        </div>
      );
    }

    // If payment failed or was cancelled
    return (
      <div className="app-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ background: '#fee2e2', color: '#991b1b', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto', fontSize: '2rem' }}>✕</div>
          <h2 style={{ marginBottom: '1rem' }}>Payment Failed or Cancelled</h2>
          <p style={{ color: '#475569', marginBottom: '2rem' }}>We could not verify your payment. If you believe this is a mistake, please contact us.</p>
          <a href="/" className="btn-primary" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  // --- LOGGED IN DASHBOARD ---
  if (token) {
    return (
      <div className="app-shell">
        <nav className="navbar">
          <a className="logo" href="/">Master<span>SQL</span></a>
          <button className="btn-nav" onClick={logout}>Log out</button>
        </nav>
        
        <main className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <p className="eyebrow">STUDENT AREA</p>
              <h1>Welcome to your learning space</h1>
              <p className="muted">Your next step is to practise a little SQL every day.</p>
            </div>
          </div>
          
          <section className="dashboard-panel" style={{ marginTop: '2rem', border: '2px solid var(--primary)' }}>
            <h2>Practice SQL Query Editor</h2>
            <p className="muted" style={{ marginBottom: '1rem' }}>
              Try running queries against our sample <code>employees</code> table. Example: <code>SELECT * FROM employees;</code>
            </p>
            
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '1rem', fontFamily: 'monospace', fontSize: '1rem', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '1rem' }}
            />
            
            <button className="btn-primary" onClick={runQuery} style={{ marginBottom: '1.5rem' }}>
              Run Query
            </button>

            {queryError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {queryError}</p>}

            {queryResults && (
              <div style={{ overflowX: 'auto' }}>
                {queryResults.columns.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        {queryResults.columns.map((col, i) => (
                          <th key={i} style={{ borderBottom: '2px solid var(--border)', padding: '0.5rem', background: '#f8fafc' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.values.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="muted">Query executed successfully. No data returned.</p>
                )}
              </div>
            )}
          </section>

          <section className="dashboard-panel" style={{ marginTop: '2rem' }}>
            <h2>Your 7-Day Learning Path</h2>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>Follow this schedule to master SQL in one week.</p>
            <div className="curriculum-list">
              {curriculum.map(item => (
                <article className="curriculum-row" key={item.day}>
                  <span className="day-pill">{item.day}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.topics}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- PUBLIC LANDING PAGE ---
  return (
    <div className="app-shell">
      <nav className="navbar">
        <a className="logo" href="#" aria-label="Master SQL home">Master<span>SQL</span></a>
        <div className="nav-links">
          <a href="#curriculum">Curriculum</a>
          <a href="#who">Who it's for</a>
          <a href="#faq">FAQs</a>
        </div>
        <div className="nav-actions">
          <button className="btn-nav" onClick={() => openModal('login')}>Log in</button>
          <button className="btn-primary" onClick={() => openModal('register')}>Register</button>
        </div>
      </nav>

      <main>
        <section className="hero course-hero">
          <div className="hero-copy">
            <p className="hero-tag">LIVE ONLINE TRAINING · 7 DAYS</p>
            <h1>Go from SQL basics to <span>confident query writing.</span></h1>
            <p className="hero-description">Practise SQL step by step with live teaching, practical examples and interview-style questions. Build the skills to work with real datasets.</p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={() => setIsCheckoutModalOpen(true)}>Join the course · ₹200</button>
              <a className="text-link" href="#curriculum">Explore the syllabus ↓</a>
            </div>
            <div className="course-highlights"><span>✓ 7 focused learning days</span><span>✓ Live instructor-led sessions</span><span>✓ Practice and revision</span></div>
          </div>
          <div className="hero-code-card" aria-label="Example SQL query">
            <div className="code-card-top"><span className="code-dots">● ● ●</span><span>example.sql</span></div>
            <pre><code><span className="sql-purple">SELECT</span> employee_name, salary{ '\n' }<span className="sql-purple">FROM</span> employees{ '\n' }<span className="sql-purple">WHERE</span> salary &gt; 50000{ '\n' }<span className="sql-purple">ORDER BY</span> salary <span className="sql-blue">DESC</span>;</code></pre>
            <div className="code-card-footer"><span className="status-dot"></span> Small steps. Real SQL. Daily practice.</div>
          </div>
        </section>

        <section className="trust-strip"><div><strong>7 days</strong><span>Structured learning plan</span></div><div><strong>13.5 hours</strong><span>Live instructor-led sessions</span></div><div><strong>₹200</strong><span>One-time course fee</span></div></section>

        <section className="section" id="curriculum">
          <div className="section-header"><p className="eyebrow">YOUR LEARNING ROADMAP</p><h2>What you'll learn in 7 days</h2><p>Each day builds on the previous one, taking you from writing basic queries to solving analyst-style SQL problems.</p></div>
          <div className="curriculum-grid">{curriculum.map(item => <article className="curriculum-card" key={item.day}><span className="day-pill">{item.day}</span><h3>{item.title}</h3><p>{item.topics}</p></article>)}</div>
        </section>

        <section className="section audience-section" id="who">
          <div className="section-header"><p className="eyebrow">MADE FOR PRACTICAL LEARNERS</p><h2>Who should join?</h2></div>
          <div className="audience-grid"><article><h3>Beginners</h3><p>Start with SQL fundamentals and learn how to retrieve and understand data.</p></article><article><h3>Students and graduates</h3><p>Build a useful technical skill with guided examples and regular practice.</p></article><article><h3>Job seekers and analysts</h3><p>Revise joins, subqueries and window functions through interview-style problems.</p></article></div>
        </section>

        <section className="section" id="admin" style={{ borderTop: '2px dashed #cbd5e1', marginTop: '4rem' }}>
          <div className="section-header">
            <p className="eyebrow">FOR THE INSTRUCTOR</p>
            <h2>Admin Dashboard</h2>
            <p>Enter your secret password to view registered students.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
            <input 
              type="password" 
              placeholder="Enter Admin Password..." 
              value={adminSecret} 
              onChange={e => setAdminSecret(e.target.value)}
              style={{ flex: 1, padding: '0.8rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
            <button className="btn-primary" onClick={fetchStudents}>View Students</button>
          </div>

          {adminError && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{adminError}</p>}

          {adminStudents.length > 0 && (
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>Name</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>Email</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>WhatsApp</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid var(--border)' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {adminStudents.map(student => (
                    <tr key={student.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.full_name}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.email}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{student.whatsapp_number}</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ 
                          background: student.payment_status === 'paid' ? '#dcfce7' : '#fef08a', 
                          color: student.payment_status === 'paid' ? '#166534' : '#854d0e',
                          padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                        }}>
                          {student.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="enroll-banner" id="enroll">
          <div><p className="eyebrow">START LEARNING</p><h2>Make the next 7 days count.</h2><p>Join the live SQL course for a one-time fee of ₹200.</p></div>
          <button className="btn-light btn-large" onClick={() => setIsCheckoutModalOpen(true)}>Enquire on WhatsApp</button>
        </section>

        <section className="section faq-section" id="faq"><div className="section-header"><p className="eyebrow">NEED TO KNOW MORE?</p><h2>Frequently asked questions</h2></div><details><summary>Is this course suitable for beginners?</summary><p>Yes. The course starts with SQL fundamentals and gradually moves to more advanced query-writing concepts.</p></details><details><summary>How are classes delivered?</summary><p>Classes are delivered live online. Course timing and joining details are shared after registration.</p></details><details><summary>What is the course fee?</summary><p>The one-time course fee is ₹200.</p></details></section>
      </main>

      <footer className="site-footer">
        <a className="logo" href="#">Master<span>SQL</span></a>
        <p>Learn SQL by understanding it, practising it and applying it.</p>
        <span>© {new Date().getFullYear()} Master SQL in 7 Days</span>
        <small>Backend status: {apiStatus}</small>
      </footer>

      {/* --- AUTH MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setIsModalOpen(false)}>×</button>
            <p className="eyebrow">STUDENT ACCOUNT</p>
            <h2 id="auth-title">{modalMode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="modal-subtitle">Access your SQL learning space.</p>
            <form onSubmit={handleAuth}>
              {modalMode === 'register' && (
                <>
                  <label>Full Name
                    <input type="text" placeholder="John Doe" value={fullName} onChange={event => setFullName(event.target.value)} required />
                  </label>
                  <label>WhatsApp Number
                    <input type="tel" placeholder="919876543210" value={whatsappNumber} onChange={event => setWhatsappNumber(event.target.value)} required />
                  </label>
                </>
              )}

              <label>Email address
                <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
              </label>
              <label>Password
                <input type="password" autoComplete={modalMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} />
              </label>
              
              {message && <p className="form-message" role="alert">{message}</p>}
              <button className="btn-primary btn-full" type="submit">{modalMode === 'register' ? 'Create account' : 'Log in'}</button>
            </form>
            <button className="switch-auth" onClick={() => { setModalMode(modalMode === 'register' ? 'login' : 'register'); setMessage(''); }}>
              {modalMode === 'register' ? 'Already registered? Log in' : 'New here? Create an account'}
            </button>
          </section>
        </div>
      )}

      {/* --- CHECKOUT MODAL --- */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutModalOpen(false)}>
          <section className="modal-content" role="dialog" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsCheckoutModalOpen(false)}>×</button>
            <p className="eyebrow">SECURE CHECKOUT</p>
            <h2>Enter your details</h2>
            <p className="modal-subtitle">Please provide your details to proceed to the ₹200 payment.</p>
            
            <form onSubmit={handlePayment}>
              <label>Full Name
                <input type="text" placeholder="John Doe" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} required />
              </label>
              <label>Email address
                <input type="email" placeholder="john@example.com" value={checkoutEmail} onChange={e => setCheckoutEmail(e.target.value)} required />
              </label>
              <label>WhatsApp Number
                <input type="tel" placeholder="919876543210" value={checkoutPhone} onChange={e => setCheckoutPhone(e.target.value)} required />
              </label>
              
              <button className="btn-primary btn-full" type="submit" style={{ marginTop: '1rem' }}>
                Pay ₹200 & Join
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}