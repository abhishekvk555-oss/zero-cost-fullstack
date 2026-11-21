import { questionBank } from './questions';
import { databaseSchema } from './schema';
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
  const [score, setScore] = useState(0);
  const [queryMessage, setQueryMessage] = useState('');
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

  // Password Reset State
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [modalView, setModalView] = useState('login');

  // LIVE COUNTDOWN TIMER STATE
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // COUNTDOWN TIMER LOGIC
  useEffect(() => {
    const targetDate = new Date('2026-11-26T18:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    if (resetToken) {
      setModalView('reset');
      setIsModalOpen(true);
    }
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
    setModalView('login');
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
    setQueryMessage('');
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

  async function checkAnswer() {
    setQueryMessage('');
    const clientId = 1; // In a real app, this would be dynamic based on the logged-in user
    
    try {
      const res = await fetch(`${API}/api/practice/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, day: 'Day 1', questionId: 1, clientId })
      });
      const data = await res.json();
      
      if (data.success) {
        setQueryMessage('✅ ' + data.message);
        setScore(prev => prev + 1);
      } else {
        setQueryMessage('❌ ' + data.message);
      }
    } catch (error) {
      setQueryMessage('Error checking answer');
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
          amount: 199,
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
  const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/FpA3sfOf8tF6TYIOw2px8D";

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
            <p style={{ color: '#475569', marginBottom: '2rem' }}>Thank you for joining DataCanva. Click the button below to join the private WhatsApp group where all course links and updates will be shared.</p>
            <a href={WHATSAPP_GROUP_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'block', width: '100%', textDecoration: 'none' }}>
              Join WhatsApp Group
            </a>
          </div>
        </div>
      );
    }

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

  // --- LOGGED IN DASHBOARD (NEW LOOK) ---
  if (token) {
    return (
      <div className="app-shell">
        <nav className="navbar">
          <a className="logo" href="/">Data<span>Canva</span></a>
          <button className="btn-nav" onClick={logout}>Log out</button>
        </nav>
        
        <div style={{ display: 'flex', maxWidth: '1400px', margin: '2rem auto', padding: '0 5%', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* LEFT SIDEBAR: SCHEMA */}
          <div style={{ flex: '1 1 250px', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>Database Schema</h2>
            {databaseSchema.map((table, i) => (
              <div key={i} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{table.table}</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {table.columns.map((col, j) => (
                    <li key={j} style={{ fontSize: '0.85rem', padding: '0.2rem 0', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{col.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{col.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* RIGHT AREA: QUESTIONS & EDITOR */}
          <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* QUERY EDITOR */}
            <div style={{ background: '#fff', border: '2px solid var(--primary)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem' }}>SQL Query Editor</h2>
                <span style={{ background: '#eff6ff', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold' }}>
                  Score: {score}
                </span>
              </div>
              
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: '100%', height: '120px', padding: '1rem', fontFamily: 'monospace', fontSize: '1rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#f8fafc', marginBottom: '1rem' }}
              />
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={runQuery}>Run Query</button>
                <button className="btn-primary" style={{ background: '#10b981' }} onClick={checkAnswer}>Submit Answer</button>
              </div>

              {queryMessage && <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: queryMessage.includes('✅') ? '#166534' : '#991b1b' }}>{queryMessage}</p>}
              {queryError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {queryError}</p>}

              {queryResults && (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  {queryResults.columns.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {queryResults.columns.map((col, i) => (
                            <th key={i} style={{ padding: '0.8rem', borderBottom: '2px solid var(--border)' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.values.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)' }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ padding: '1rem', color: '#475569' }}>Query executed successfully. No data returned.</p>
                  )}
                </div>
              )}
            </div>

            {/* QUESTION LIST */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Practice Questions</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Example Question 1 */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: '#eff6ff', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: '#bfdbfe', color: '#1e40af', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>EASY</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Incomplete</span>
                  </div>
                  <div style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    Show the first name and department of all employees.
                  </div>
                </div>

                {/* Example Question 2 */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: '#eff6ff', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ background: '#bfdbfe', color: '#1e40af', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>EASY</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Incomplete</span>
                  </div>
                  <div style={{ padding: '1rem', fontSize: '0.95rem' }}>
                    Show the names of employees whose salary is greater than 80000.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- PUBLIC LANDING PAGE ---
  return (
    <div className="app-shell">
      <nav className="navbar">
        <a className="logo" href="#" aria-label="DataCanva home">Data<span>Canva</span></a>
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
        {/* SCROLLING MARQUEE */}
        <div style={{ background: '#0f172a', color: 'white', padding: '0.5rem 0', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.9rem', fontWeight: '600', letterSpacing: '1px' }}>
          <div style={{ display: 'inline-block', animation: 'marquee 20s linear infinite' }}>
            🔴 LIVE BATCH STARTS SOON ✦ 100 DAYS RECORDING ACCESS ✦ ₹199 ONLY ✦ PYTHON ✦ SQL ✦ FASTAPI ✦ TYPESCRIPT ✦ GENERATIVE AI ✦ CUSTOMER DISCOVERY ✦ STAKEHOLDER MANAGEMENT ✦ 🔴 LIVE BATCH STARTS SOON ✦ 100 DAYS RECORDING ACCESS ✦ ₹199 ONLY ✦ PYTHON ✦ SQL ✦ FASTAPI ✦ TYPESCRIPT ✦ GENERATIVE AI
          </div>
        </div>

        <section className="hero course-hero" style={{ position: 'relative' }}>
          
          {/* DYNAMIC COUNTDOWN TIMER */}
          <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#991b1b', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            ⏳ Live batch starts in: 
            <span style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
          
          <div className="hero-copy">
            <p className="hero-tag">LIVE ONLINE TRAINING · 7 DAYS</p>
            <h1>Go from SQL basics to <span>confident query writing.</span></h1>
            <p className="hero-description">Practise SQL step by step with live teaching, practical examples and interview-style questions. Build the skills to work with real datasets.</p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={() => setIsCheckoutModalOpen(true)}>Join the course · ₹199</button>
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

        <section className="trust-strip"><div><strong>7 days</strong><span>Structured learning plan</span></div><div><strong>13.5 hours</strong><span>Live instructor-led sessions</span></div><div><strong>₹199</strong><span>One-time course fee</span></div></section>

        <section className="section" id="curriculum">
          <div className="section-header"><p className="eyebrow">YOUR LEARNING ROADMAP</p><h2>What you'll learn in 7 days</h2><p>Each day builds on the previous one, taking you from writing basic queries to solving analyst-style SQL problems.</p></div>
          <div className="curriculum-grid">{curriculum.map(item => <article className="curriculum-card" key={item.day}><span className="day-pill">{item.day}</span><h3>{item.title}</h3><p>{item.topics}</p></article>)}</div>
        </section>

        <section className="section audience-section" id="who">
          <div className="section-header"><p className="eyebrow">MADE FOR PRACTICAL LEARNERS</p><h2>Who should join?</h2></div>
          <div className="audience-grid"><article><h3>Beginners</h3><p>Start with SQL fundamentals and learn how to retrieve and understand data.</p></article><article><h3>Students and graduates</h3><p>Build a useful technical skill with guided examples and regular practice.</p></article><article><h3>Job seekers and analysts</h3><p>Revise joins, subqueries and window functions through interview-style problems.</p></article></div>
        </section>

        {/* --- TESTIMONIALS SECTION --- */}
        <section className="section" id="testimonials" style={{ background: '#f8fafc', maxWidth: '100%', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section-header">
            <p className="eyebrow">STUDENT SUCCESS</p>
            <h2>What our learners say</h2>
            <p>Real stories from people who built careers with DataCanva.</p>
          </div>
          
          <div className="audience-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Testimonial 1 */}
            <article style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', fontStyle: 'italic', flexGrow: 1 }}>
                "I was a complete beginner. The 7-day SQL bootcamp at DataCanva was incredibly well-structured. The live sessions and the built-in practice editor made complex queries so easy to understand. I landed a Data Analyst role within a month!"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#dbeafe', color: '#1e40af', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AS</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Aarav Sharma</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Data Analyst at TechCorp</p>
                </div>
              </div>
            </article>

            {/* Testimonial 2 */}
            <article style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', fontStyle: 'italic', flexGrow: 1 }}>
                "The best ₹199 I ever spent. I thought SQL was just for developers, but the way it was taught here made it so practical. The WhatsApp group support is amazing. I can now write complex joins and window functions with confidence."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#fce7f3', color: '#9d174d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>PK</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Priya Kapoor</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Business Analyst at FinServe</p>
                </div>
              </div>
            </article>

            {/* Testimonial 3 */}
            <article style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: '#334155', fontSize: '0.95rem', fontStyle: 'italic', flexGrow: 1 }}>
                "I was looking for a quick refresher to upskill for my job. The 100-day recording access is a lifesaver. I could re-watch the classes at my own pace. The live query editor on the platform helped me practice without installing any software."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#dcfce7', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>RK</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Rahul Kumar</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Software Engineer at InnoTech</p>
                </div>
              </div>
            </article>
          </div>
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
          <div><p className="eyebrow">START LEARNING</p><h2>Make the next 7 days count.</h2><p>Join the live SQL course for a one-time fee of ₹199.</p></div>
          <button className="btn-light btn-large" onClick={() => setIsCheckoutModalOpen(true)}>Enquire on WhatsApp</button>
        </section>

        <section className="section faq-section" id="faq"><div className="section-header"><p className="eyebrow">NEED TO KNOW MORE?</p><h2>Frequently asked questions</h2></div><details><summary>Is this course suitable for beginners?</summary><p>Yes. The course starts with SQL fundamentals and gradually moves to more advanced query-writing concepts.</p></details><details><summary>How are classes delivered?</summary><p>Classes are delivered live online. Course timing and joining details are shared after registration.</p></details><details><summary>What is the course fee?</summary><p>The one-time course fee is ₹199.</p></details></section>
      </main>

      {/* --- UPDATED FOOTER --- */}
      <footer className="site-footer" style={{ background: '#0f172a', color: 'white', padding: '4rem 5%', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1rem' }}>
          <span style={{ color: '#2563eb', fontSize: '2rem', fontWeight: '900' }}>&gt;&gt;</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: 'white' }}>DataCanva</h2>
        </div>
        
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '2rem' }}>Learn. Build. Grow.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '1.5rem' }}>
          <a href="https://www.instagram.com/data_canva/" target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1' }}><i className="fab fa-instagram"></i></a>
          <a href={`https://wa.me/919956042831`} target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1' }}><i className="fab fa-whatsapp"></i></a>
          <a href="mailto:contact@datacanva.com" style={{ color: '#cbd5e1' }}><i className="fas fa-envelope"></i></a>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', color: '#cbd5e1', fontWeight: '600', fontSize: '0.95rem' }}>
          <span>contact: </span>
          <a href="mailto:contact@datacanva.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>contact@datacanva.com</a>
          <span> | </span>
          <a href="tel:+919956042831" style={{ color: '#cbd5e1', textDecoration: 'none' }}>+91 9956042831</a>
        </div>

        <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: '#64748b' }}>
          © {new Date().getFullYear()} DataCanva. All rights reserved. <br/>
          <span style={{ fontSize: '0.75rem' }}>Backend status: {apiStatus}</span>
        </div>
      </footer>

      {/* --- AUTH MODAL (WITH FORGOT PASSWORD) --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close" onClick={() => setIsModalOpen(false)}>×</button>
            <p className="eyebrow">STUDENT ACCOUNT</p>
            
            {modalView === 'forgot' ? (
              <>
                <h2 id="auth-title">Reset Password</h2>
                <p className="modal-subtitle">Enter your email and we'll send you a reset link.</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(`${API}/api/auth/forgot-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: forgotEmail })
                    });
                    const data = await res.json();
                    setMessage(data.message || data.error);
                    if (res.ok) setTimeout(() => setModalView('login'), 3000);
                  } catch (err) { setMessage("Error sending email"); }
                }}>
                  <label>Email address
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  </label>
                  {message && <p className="form-message" role="alert" style={{ color: 'var(--primary)' }}>{message}</p>}
                  <button className="btn-primary btn-full" type="submit" style={{ marginTop: '1rem' }}>Send Reset Link</button>
                  <button type="button" className="switch-auth" style={{ marginTop: '1rem' }} onClick={() => { setModalView('login'); setMessage(''); }}>Back to Login</button>
                </form>
              </>
            ) : modalView === 'reset' ? (
              <>
                <h2 id="auth-title">Create New Password</h2>
                <p className="modal-subtitle">Please enter your new password below.</p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const token = new URLSearchParams(window.location.search).get('reset_token');
                  try {
                    const res = await fetch(`${API}/api/auth/reset-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token, newPassword: resetPassword })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setMessage("Password reset successfully! Please log in.");
                      setTimeout(() => { 
                        window.history.replaceState({}, document.title, "/"); 
                        setModalView('login'); 
                        setMessage('');
                      }, 2000);
                    } else {
                      setMessage(data.error);
                    }
                  } catch (err) { setMessage("Error resetting password"); }
                }}>
                  <label>New Password
                    <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required minLength={8} />
                  </label>
                  {message && <p className="form-message" role="alert" style={{ color: 'var(--primary)' }}>{message}</p>}
                  <button className="btn-primary btn-full" type="submit" style={{ marginTop: '1rem' }}>Reset Password</button>
                </form>
              </>
            ) : (
              <>
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
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
                  <button type="button" className="switch-auth" style={{ margin: 0, width: 'auto', fontSize: '0.85rem' }} onClick={() => { setModalMode(modalMode === 'register' ? 'login' : 'register'); setMessage(''); }}>
                    {modalMode === 'register' ? 'Already registered? Log in' : 'New here? Create an account'}
                  </button>
                  
                  {modalMode === 'login' && (
                    <button type="button" className="switch-auth" style={{ margin: 0, width: 'auto', fontSize: '0.85rem', color: '#64748b' }} onClick={() => { setModalView('forgot'); setMessage(''); }}>
                      Forgot Password?
                    </button>
                  )}
                </div>
              </>
            )}
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
            <p className="modal-subtitle">Please provide your details to proceed to the ₹199 payment.</p>
            
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
                Pay ₹199 & Join
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}