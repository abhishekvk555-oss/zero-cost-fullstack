import { useEffect, useState } from 'react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '';

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
  const [name, setName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('register');
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [apiStatus, setApiStatus] = useState('Checking');
  const [message, setMessage] = useState('');

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
    fetch(`${API}/health`)
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
      const body = modalMode === 'register' ? { name, email, password } : { email, password };
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

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setItems([]);
    setMessage('You have been logged out.');
  }

  function enroll() {
    const text = encodeURIComponent('Hi! I am interested in enrolling in Master SQL in 7 Days. Please share the registration and payment details.');
    const url = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (token) {
    return (
      <div className="app-shell">
        <nav className="navbar">
          <a className="logo" href="/">Master<span>SQL</span></a>
          <button className="btn-nav" onClick={logout}>Log out</button>
        </nav>
        <main className="dashboard-content">
          <p className="eyebrow">STUDENT AREA</p>
          <h1>Welcome to your learning space</h1>
          <p className="muted">Your next step is to practise a little SQL every day.</p>
          <section className="dashboard-panel">
            <h2>My learning notes</h2>
            <form className="input-row" onSubmit={addItem}>
              <input aria-label="Learning note" placeholder="Write a learning note..." value={title} onChange={event => setTitle(event.target.value)} />
              <button className="btn-primary" type="submit">Save note</button>
            </form>
            {items.length ? <ul className="item-list">{items.map(item => <li key={item.id}>{item.title}</li>)}</ul> : <p className="muted">No notes yet. Add your first learning note above.</p>}
            {message && <p className="form-message" role="status">{message}</p>}
          </section>
          <section className="dashboard-panel">
            <h2>Your 7-day learning path</h2>
            <div className="curriculum-list">{curriculum.map(item => <article className="curriculum-row" key={item.day}><span className="day-pill">{item.day}</span><div><h3>{item.title}</h3><p>{item.topics}</p></div></article>)}</div>
          </section>
        </main>
      </div>
    );
  }

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
              <button className="btn-primary btn-large" onClick={enroll}>Join the course · ₹200</button>
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

        <section className="trust-strip"><div><strong>7 days</strong><span>Structured learning plan</span></div><div><strong>Live</strong><span>Instructor-led sessions</span></div><div><strong>₹200</strong><span>One-time course fee</span></div></section>

        <section className="section" id="curriculum">
          <div className="section-header"><p className="eyebrow">YOUR LEARNING ROADMAP</p><h2>What you'll learn in 7 days</h2><p>Each day builds on the previous one, taking you from writing basic queries to solving analyst-style SQL problems.</p></div>
          <div className="curriculum-grid">{curriculum.map(item => <article className="curriculum-card" key={item.day}><span className="day-pill">{item.day}</span><h3>{item.title}</h3><p>{item.topics}</p></article>)}</div>
        </section>

        <section className="section audience-section" id="who">
          <div className="section-header"><p className="eyebrow">MADE FOR PRACTICAL LEARNERS</p><h2>Who should join?</h2></div>
          <div className="audience-grid"><article><h3>Beginners</h3><p>Start with SQL fundamentals and learn how to retrieve and understand data.</p></article><article><h3>Students and graduates</h3><p>Build a useful technical skill with guided examples and regular practice.</p></article><article><h3>Job seekers and analysts</h3><p>Revise joins, subqueries and window functions through interview-style problems.</p></article></div>
        </section>

        <section className="enroll-banner" id="enroll"><div><p className="eyebrow">START LEARNING</p><h2>Make the next 7 days count.</h2><p>Join the live SQL course for a one-time fee of ₹200.</p></div><button className="btn-light btn-large" onClick={enroll}>Enquire on WhatsApp</button></section>

        <section className="section faq-section" id="faq"><div className="section-header"><p className="eyebrow">NEED TO KNOW MORE?</p><h2>Frequently asked questions</h2></div><details><summary>Is this course suitable for beginners?</summary><p>Yes. The course starts with SQL fundamentals and gradually moves to more advanced query-writing concepts.</p></details><details><summary>How are classes delivered?</summary><p>Classes are delivered live online. Course timing and joining details are shared after registration.</p></details><details><summary>What is the course fee?</summary><p>The one-time course fee is ₹200.</p></details></section>
      </main>

      <footer className="site-footer"><a className="logo" href="#">Master<span>SQL</span></a><p>Learn SQL by understanding it, practising it and applying it.</p><span>© {new Date().getFullYear()} Master SQL in 7 Days</span><small>Backend status: {apiStatus}</small></footer>

      {isModalOpen && <div className="modal-overlay" onClick={() => setIsModalOpen(false)}><section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setIsModalOpen(false)}>×</button><p className="eyebrow">STUDENT ACCOUNT</p><h2 id="auth-title">{modalMode === 'register' ? 'Create your account' : 'Welcome back'}</h2><p className="modal-subtitle">Access your SQL learning space.</p><form onSubmit={handleAuth}>{modalMode === 'register' && <label>Full name<input autoComplete="name" value={name} onChange={event => setName(event.target.value)} required minLength={2} /></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete={modalMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={8} /></label>{message && <p className="form-message" role="alert">{message}</p>}<button className="btn-primary btn-full" type="submit">{modalMode === 'register' ? 'Create account' : 'Log in'}</button></form><button className="switch-auth" onClick={() => { setModalMode(modalMode === 'register' ? 'login' : 'register'); setMessage(''); }}>{modalMode === 'register' ? 'Already registered? Log in' : 'New here? Create an account'}</button></section></div>}
    </div>
  );
}
