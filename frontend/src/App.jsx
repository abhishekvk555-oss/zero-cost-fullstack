import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('register'); // 'register' or 'login'

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

  // --- RENDER LOGGED IN DASHBOARD (Kept simple for your backend logic) ---
  if (token) {
    return (
      <div>
        <nav className="dashboard-nav">
          <div className="logo">Data<span>BigQuery</span></div>
          <button className="btn-nav" onClick={logout}>Logout</button>
        </nav>
        <div className="dashboard-content">
          <h2 style={{ marginBottom: '2rem' }}>Welcome to your dashboard</h2>
          
          <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '1rem' }}>My Learning Notes</h3>
            <div className="input-row">
              <input 
                placeholder="Add a new note or project idea..." 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
              />
              <button className="btn-primary" onClick={addItem}>Add</button>
            </div>
            <ul className="item-list">
              {items.map(i => <li key={i.id}>{i.title}</li>)}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PUBLIC LANDING PAGE (Like codingwise.in) ---
  return (
    <div>
      <nav className="navbar">
        <div className="logo">Data<span>BigQuery</span></div>
        <div className="nav-links">
          <span>Programs</span>
          <span>Placements</span>
          <span>For Teams</span>
        </div>
        <div>
          <button className="btn-nav" onClick={() => openModal('login')} style={{ marginRight: '1rem' }}>Log In</button>
          <button className="btn-primary" onClick={() => openModal('register')}>Register</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-tag">AI Changed The Job. Not Hiring.</div>
        <h1>Learn AI-powered skills, build a portfolio that proves it, and get referred directly to jobs.</h1>
        <p>Trusted by 500k+ Subscribers and 3500+ Placements. Master SQL, Python, and Generative AI with hands-on projects.</p>
        <button className="btn-primary" onClick={() => openModal('register')} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Explore Programs</button>
        
        <div className="hero-stats">
          <div className="stat">
            <h3>500k+</h3>
            <p>Subscribers</p>
          </div>
          <div className="stat">
            <h3>3500+</h3>
            <p>Placements</p>
          </div>
          <div className="stat">
            <h3>100%</h3>
            <p>Hands-on Projects</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Industry relevant programs to set you apart</h2>
          <p>Choose from our flagship programs designed by industry experts.</p>
        </div>

        <div className="grid-cards">
          {/* Card 1 */}
          <div className="program-card">
            <div className="badge">Flagship Program</div>
            <h3>Complete Generative AI & LLM Engineering</h3>
            <p>A comprehensive, end-to-end training program covering everything from LLM fundamentals to building production-ready Generative AI applications.</p>
            <button className="btn-secondary" onClick={() => openModal('register')}>Enroll Now</button>
          </div>

          {/* Card 2 */}
          <div className="program-card">
            <div className="badge">Flagship Program</div>
            <h3>Masters in Data Analytics with Gen AI</h3>
            <p>Get skilled in Excel, SQL, Power BI, Python, and Tableau - with live training, real projects, and guaranteed interviews.</p>
            <button className="btn-secondary" onClick={() => openModal('register')}>Enroll Now</button>
          </div>

          {/* Card 3 (Your SQL Focus) */}
          <div className="program-card">
            <div className="badge">Best Seller</div>
            <h3>SQL for Data Analytics Masterclass</h3>
            <p>Write powerful SQL queries for real-world business analysis use cases. Master Joins, Window Functions, and Database Optimization.</p>
            <button className="btn-primary" onClick={() => openModal('register')}>Enroll Now</button>
          </div>

          {/* Card 4 */}
          <div className="program-card">
            <div className="badge">Flagship Program</div>
            <h3>Python for Data Science / Analysis</h3>
            <p>Master Python, NumPy, Pandas, Matplotlib, and Machine Learning with hands-on projects to become job-ready.</p>
            <button className="btn-secondary" onClick={() => openModal('register')}>Enroll Now</button>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalMode === 'register' ? 'Create an Account' : 'Welcome Back'}</h2>
            <p className="modal-subtitle">Enter your details to access your dashboard.</p>
            <div className="input-group">
              <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAuth} style={{ width: '100%' }}>
                {modalMode === 'register' ? 'Register Now' : 'Log In'}
              </button>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}