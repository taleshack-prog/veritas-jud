import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api.js';

const STATUS = {
  open        : { label: 'Aberto',       cls: 'badge-open' },
  in_progress : { label: 'Andamento',    cls: 'badge-in_progress' },
  resolved    : { label: 'Resolvido',    cls: 'badge-resolved' },
  closed      : { label: 'Encerrado',    cls: 'badge-closed' },
};
const CAT_ICON = { telecom:'📡', bank:'🏦', utility:'💡', ecommerce:'📦', other:'⚠️' };

export default function Cases() {
  const navigate = useNavigate();
  const [cases,   setCases]   = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesAPI.list()
      .then(({ data }) => { setCases(data.cases); setStats(data.stats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F0F4FF' }}>
      <div className="page-header">
        <div className="page-title">Meus Casos</div>
        <div className="page-sub">{stats.total || 0} reclamações registradas</div>
      </div>

      {stats.total > 0 && (
        <div style={{ display:'flex', gap:8, padding:'12px 16px' }}>
          {[
            { label:'Abertos',   val: stats.open,        color:'#F59E0B' },
            { label:'Andamento', val: stats.in_progress, color:'#3B82F6' },
            { label:'Resolvidos',val: stats.resolved,    color:'#10B981' },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:'#fff', borderRadius:12, padding:12, textAlign:'center', borderTop:`3px solid ${s.color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.val || 0}</div>
              <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/></div>
        ) : cases.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📁</div>
            <div className="empty-title">Nenhuma reclamação ainda</div>
            <div className="empty-sub">Use a aba "Problema" para registrar seu primeiro caso.</div>
          </div>
        ) : cases.map(c => {
          const st = STATUS[c.status] || STATUS.open;
          return (
            <div key={c.id} className="card" onClick={() => navigate(`/cases/${c.id}`)} style={{ cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:24 }}>{CAT_ICON[c.category] || '⚠️'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1E293B' }}>{c.title}</div>
                  <div style={{ fontSize:13, color:'#64748B' }}>{c.company}</div>
                </div>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              <div style={{ display:'flex', gap:16, borderTop:'1px solid #E2E8F0', paddingTop:10, fontSize:12, color:'#64748B' }}>
                <span>📄 {c.documents_count || 0} docs</span>
                <span>📬 {c.submissions_count || 0} envios</span>
                <span style={{ marginLeft:'auto' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
