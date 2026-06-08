// Marketplace.jsx
import { useState, useEffect } from 'react';
import { marketplaceAPI } from '../services/api.js';

export function Marketplace() {
  const [lawyers,  setLawyers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    marketplaceAPI.lawyers()
      .then(({ data }) => setLawyers(data.lawyers))
      .finally(() => setLoading(false));
  }, []);

  const filtered = lawyers.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.specialties?.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F0F4FF' }}>
      <div className="page-header">
        <div className="page-title">Advogados</div>
        <div className="page-sub">Especialistas em direito do consumidor</div>
      </div>

      <div style={{ padding:'12px 16px 0' }}>
        <input placeholder="🔍 Buscar por nome ou especialidade..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #E2E8F0', borderRadius:12, fontSize:14, background:'#fff', outline:'none' }}
        />
      </div>

      <div style={{ background:'#EFF6FF', margin:'12px 16px 0', padding:12, borderRadius:10, display:'flex', gap:8 }}>
        <span>ℹ️</span>
        <span style={{ fontSize:12, color:'#1B4FE8', lineHeight:1.6 }}>
          Advogados parceiros revisam e assinam suas petições. Honorários combinados diretamente.
        </span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⚖️</div>
            <div className="empty-title">Nenhum advogado cadastrado</div>
            <div className="empty-sub">Em breve nosso marketplace estará disponível.</div>
          </div>
        ) : filtered.map(l => (
          <div key={l.id} className="card">
            <div style={{ display:'flex', gap:12, marginBottom:10 }}>
              <div style={{ width:48, height:48, borderRadius:24, background:'#1B4FE8', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:20, fontWeight:700, flexShrink:0 }}>
                {l.name?.[0] || '?'}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{l.name}</div>
                <div style={{ fontSize:12, color:'#64748B' }}>OAB/{l.state} {l.oab_number}</div>
                <div>{'⭐'.repeat(Math.round(l.rating || 0))}</div>
              </div>
            </div>
            {l.bio && <div style={{ fontSize:13, color:'#64748B', marginBottom:10, lineHeight:1.6 }}>{l.bio}</div>}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
              {(l.specialties || []).slice(0,3).map((s,i) => (
                <span key={i} style={{ background:'#EFF6FF', color:'#1B4FE8', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{s}</span>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => alert('Em breve! Entre em contato pelo e-mail do advogado.')}>
              Solicitar Contato
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile.jsx
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    if (confirm('Deseja encerrar sua sessão?')) { logout(); navigate('/login'); }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F0F4FF' }}>
      <div className="page-header">
        <div className="page-title">Perfil</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {/* Avatar */}
        <div className="card" style={{ textAlign:'center', padding:24 }}>
          <div style={{ width:72, height:72, borderRadius:36, background:'#1B4FE8', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:30, fontWeight:700, margin:'0 auto 12px' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize:20, fontWeight:700 }}>{user?.name}</div>
          <div style={{ fontSize:14, color:'#64748B', marginTop:2 }}>{user?.email}</div>
          <div style={{ marginTop:10, display:'inline-block', background:'#EFF6FF', color:'#1B4FE8', padding:'4px 14px', borderRadius:20, fontSize:13, fontWeight:600 }}>
            {user?.role === 'lawyer' ? '⚖️ Advogado' : '👤 Consumidor'}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          <div style={{ fontWeight:700, marginBottom:6 }}>ℹ️ Sobre o Veritas</div>
          O Veritas é uma ferramenta de automação documental para defesa do consumidor.
          Os documentos gerados são minutas baseadas no CDC e legislação aplicável.
          Esta plataforma não substitui consultoria jurídica. Consulte um advogado inscrito na OAB para análise individualizada.
        </div>

        {/* Menu */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {[
            { emoji:'🔔', label:'Notificações' },
            { emoji:'🔒', label:'Alterar senha' },
            { emoji:'❓', label:'Ajuda e suporte' },
            { emoji:'📋', label:'Termos de uso' },
            { emoji:'🛡️', label:'Privacidade e LGPD' },
          ].map((item, i) => (
            <button key={i} onClick={() => alert('Em breve!')}
              style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'16px 16px', border:'none', borderBottom:'1px solid #E2E8F0', background:'none', cursor:'pointer', fontSize:15, color:'#1E293B' }}>
              <span>{item.emoji}</span> {item.label} <span style={{ marginLeft:'auto', color:'#94A3B8' }}>›</span>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden', marginTop:0 }}>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'16px 16px', border:'none', background:'none', cursor:'pointer', fontSize:15, color:'#EF4444' }}>
            🚪 Sair
          </button>
        </div>

        <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8', marginTop:16 }}>
          Veritas v1.0.0 — Defesa do Consumidor com IA
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
