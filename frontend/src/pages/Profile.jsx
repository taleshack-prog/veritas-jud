import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
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

        <div className="disclaimer">
          <div style={{ fontWeight:700, marginBottom:6 }}>ℹ️ Sobre o Veritas</div>
          O Veritas é uma ferramenta de automação documental para defesa do consumidor.
          Os documentos são minutas baseadas no CDC e legislação aplicável.
          Não substitui consultoria jurídica — consulte um advogado inscrito na OAB.
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {['🔔 Notificações','🔒 Alterar senha','❓ Ajuda e suporte','📋 Termos de uso','🛡️ Privacidade e LGPD'].map((item, i) => (
            <button key={i} onClick={() => alert('Em breve!')}
              style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'16px', border:'none', borderBottom:'1px solid #E2E8F0', background:'none', cursor:'pointer', fontSize:15, color:'#1E293B' }}>
              {item} <span style={{ marginLeft:'auto', color:'#94A3B8' }}>›</span>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'16px', border:'none', background:'none', cursor:'pointer', fontSize:15, color:'#EF4444', fontWeight:600 }}>
            🚪 Sair da conta
          </button>
        </div>

        <div style={{ textAlign:'center', fontSize:12, color:'#94A3B8', margin:'16px 0' }}>
          Veritas v1.0.0 — Defesa do Consumidor com IA
        </div>
      </div>
    </div>
  );
}
