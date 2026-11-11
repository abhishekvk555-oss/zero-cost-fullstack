import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('register');

  // Dashboard state
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');

  const call = async (path, opts = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  };

  const handleAuth = async () => {
    try {
      const endpoint = modalMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const data = await call(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setIsModalOpen(false);
    } catch (e) { 
      alert(e.message); 
    }
  };

  const loadItems = async () => {
    try { setItems(await call('/api/items')); } catch (e) { console.error(e); }
  };

  const addItem = async () => {
    if (!title) return;
    try {
      await call('/api/items', { method: 'POST', body: JSON.stringify({ title }) });
      setTitle('');
      loadItems();
    } catch (e) { alert(e.message); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  useEffect(() => { if (token) loadItems(); }, [token]);

  const openModal = (mode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // --- LOGGED IN DASHBOARD ---
  if (token) {
    return (
      <div>
        <nav className="dashboard-nav">
          <div className="logo">Data<span>BigQuery</span></div>
          <button className="btn-nav" onClick={logout}>Logout</button>
        </nav>
        <div className="dashboard-content">
          <h2 style={{ marginBottom: '1rem' }}>Welcome to your Student Dashboard</h2>
          <p style={{ color: '#475569', marginBottom: '2rem' }}>Phase 4 will build out your 7-day course schedule and lesson access here.</p>
          
          <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '1rem' }}>Phase 5 Preview: SQL Practice Notes</h3>
            <div className="input-row">
              <input 
                placeholder="Add a SQL query or note here..." 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
              <button className="btn-primary" onClick={addItem}>Save</button>
            </div>
            <ul className="item-list">
              {items.map(i => <li key={i.id}>{i.title}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --- PUBLIC LANDING PAGE ---
  return (
    <div>
      <nav className="navbar">
        <div className="logo">Data<span>BigQuery</span></div>
        <div className="nav-links">
          <span>Syllabus</span>
          <span>Pricing</span>
          <span>Contact</span>
        </div>
        <div>
          <button className="btn-nav" onClick={() => openModal('login')} style={{ marginRight: '1rem' }}>Log In</button>
          <button className="btn-primary" onClick={() => openModal('register')}>Register Now</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag">Live 7-Day Bootcamp</div>
        <h1>Master SQL in 7 Days.<br/>Get Hired.</h1>
        <p>Stop wasting months on boring videos. Join our live, intensive 7-day training program and master SQL from scratch. Only ₹200.</p>
        <button className="btn-primary" onClick={() => openModal('register')} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Enroll for ₹200</button>
        
        <div className="hero-stats">
          <div className="stat">
            <h3>7 Days</h3>
            <p>Live Training</p>
          </div>
          <div className="stat">
            <h3>₹200</h3>
            <p>One-time Fee</p>
          </div>
          <div className="stat">
            <h3>100%</h3>
            <p>Hands-on Practice</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff' }}>
        <div className="section-header" style={{ textAlign: 'center' }}>
          <h2>Why Learn SQL?</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>SQL is the #1 requested skill for Data Analysts, Backend Developers, and Data Scientists. This bootcamp skips the theory and focuses purely on writing queries that get you hired.</p>
        </div>
      </section>

      <section className="section" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="section-header">
          <h2>7-Day Course Syllabus</h2>
          <p>1.5 Hours Monday–Friday, 3 Hours Saturday–Sunday.</p>
        </div>
        <div className="grid-cards">
          <div className="program-card">
            <div className="badge">Day 1 - 2</div>
            <h3>The Basics & Filtering</h3>
            <p>SELECT, WHERE, ORDER BY, LIMIT, and understanding basic database structure.</p>
          </div>
          <div className="program-card">
            <div className="badge">Day 3 - 4</div>
            <h3>Joins & Aggregations</h3>
            <p>INNER, LEFT, RIGHT JOINs, GROUP BY, HAVING, and summarizing real data.</p>
          </div>
          <div className="program-card">
            <div className="badge">Day 5 - 6</div>
            <h3>Advanced Queries</h3>
            <p>Subqueries, CTEs (Common Table Expressions), and Window Functions.</p>
          </div>
          <div className="program-card">
            <div className="badge">Day 7</div>
            <h3>Interview Practice</h3>
            <p>Solving real SQL interview questions asked at top tech companies.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header" style={{ textAlign: 'center' }}>
          <h2>Simple, Transparent Pricing</h2>
          <p>Everything you need to master SQL for less than the price of a pizza.</p>
        </div>
        
        <div className="pricing-card" style={{ margin: '0 auto', border: '2px solid #2563eb', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.1)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Master SQL Bootcamp</h3>
          <div className="price" style={{ fontSize: '3.5rem', fontWeight: '800', color: '#0f172a' }}>₹200 <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: '400' }}>/ one-time</span></div>
          <ul className="features-list" style={{ textAlign: 'left', margin: '2rem 0' }}>
            <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}><span style={{ color: '#10b981', position: 'absolute', left: 0 }}>✓</span> 7 Days Live Instruction</li>
            <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}><span style={{ color: '#10b981', position: 'absolute', left: 0 }}>✓</span> WhatsApp Support Group</li>
            <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}><span style={{ color: '#10b981', position: 'absolute', left: 0 }}>✓</span> Daily Practice Questions</li>
            <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', position: 'relative' }}><span style={{ color: '#10b981', position: 'absolute', left: 0 }}>✓</span> Certificate of Completion</li>
          </ul>
          <button className="btn-primary" onClick={() => openModal('register')} style={{ width: '100%', padding: '1rem' }}>Secure Your Spot</button>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalMode === 'register' ? 'Register for the Bootcamp' : 'Welcome Back'}</h2>
            <p className="modal-subtitle">Enter your details. After registering, you will be redirected to WhatsApp to complete the ₹200 payment.</p>
            <div className="input-group">
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAuth} style={{ width: '100%' }}>
                {modalMode === 'register' ? 'Register & Proceed to Payment' : 'Log In'}
              </button>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}