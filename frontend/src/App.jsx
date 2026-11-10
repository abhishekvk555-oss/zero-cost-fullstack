import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:10000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const register = async () => {
    try {
      const data = await call('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
    } catch (e) { alert(e.message); }
  };

  const login = async () => {
    try {
      const data = await call('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
    } catch (e) { alert(e.message); }
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

  useEffect(() => { if (token) loadItems(); }, [token]);

  if (!token) {
    return (
      <div>
        <h1>Sign in</h1>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} /><br />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /><br />
        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>My Items</h1>
      <input placeholder="new item" value={title} onChange={e => setTitle(e.target.value)} />
      <button onClick={addItem}>Add</button>
      <button onClick={() => { localStorage.removeItem('token'); setToken(''); }}>Logout</button>
      <ul>
        {items.map(i => <li key={i.id}>{i.title}</li>)}
      </ul>
    </div>
  );
}