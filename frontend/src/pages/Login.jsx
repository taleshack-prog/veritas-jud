import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handle(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app" style={{ justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18, background: '#1B4FE8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(27,79,232,0.35)'
        }}>🛡️</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1E293B' }}>Veritas</h1>
        <p style={{ color: '#64748B', marginTop: 4 }}>Defesa do Consumidor com IA</p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Entrar</h2>
        <form onSubmit={handle}>
          <div className="field">
            <label>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" placeholder="Mínimo 8 caracteres" value={password}
              onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, color: '#64748B', fontSize: 14 }}>
          Não tem conta?{' '}
          <Link to="/register" style={{ color: '#1B4FE8', fontWeight: 700, textDecoration: 'none' }}>
            Cadastre-se grátis
          </Link>
        </p>
      </div>

      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 24, lineHeight: 1.6 }}>
        O Veritas é uma ferramenta de automação documental.<br />
        Não substitui consultoria jurídica.
      </p>
    </div>
  );
}
