import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handle(e) {
    e.preventDefault();
    if (form.password.length < 8) { setError('Senha mínima de 8 caracteres.'); return; }
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
    } finally { setLoading(false); }
  }

  return (
    <div className="app" style={{ justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/login" style={{ color: '#1B4FE8', textDecoration: 'none', fontSize: 14 }}>← Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 12 }}>Criar conta</h1>
        <p style={{ color: '#64748B', marginTop: 4 }}>É grátis e leva 30 segundos</p>
      </div>

      <div className="card">
        <form onSubmit={handle}>
          {[
            { label: 'Nome completo', key: 'name',     type: 'text',     ph: 'Seu nome' },
            { label: 'E-mail',        key: 'email',    type: 'email',    ph: 'seu@email.com' },
            { label: 'Senha',         key: 'password', type: 'password', ph: 'Mínimo 8 caracteres' },
          ].map(f => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
            </div>
          ))}
          {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Criar conta grátis'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, color: '#64748B', fontSize: 14 }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: '#1B4FE8', fontWeight: 700, textDecoration: 'none' }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
