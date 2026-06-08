import { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api.js';

const TYPE_META = {
  notification   : { label:'Notificação',  emoji:'📧', color:'#2563EB' },
  jec_petition   : { label:'Petição JEC',  emoji:'⚖️', color:'#DC2626' },
  procon_complaint: { label:'Procon',       emoji:'🏛️', color:'#7C3AED' },
};

export default function Documents() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentsAPI.list()
      .then(({ data }) => setDocs(data.documents))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F0F4FF' }}>
      <div className="page-header">
        <div className="page-title">Documentos</div>
        <div className="page-sub">{docs.length} documentos gerados</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"/></div>
        ) : docs.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <div className="empty-title">Nenhum documento ainda</div>
            <div className="empty-sub">Abra um caso e gere uma notificação ou petição.</div>
          </div>
        ) : docs.map(doc => {
          const meta = TYPE_META[doc.type] || { label: doc.type, emoji:'📄', color:'#64748B' };
          return (
            <div key={doc.id} className="card">
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:10, background: meta.color + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {meta.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1E293B', lineHeight:1.4 }}>{doc.name}</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>
                    {meta.label} • {doc.company} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <a href={documentsAPI.pdfUrl(doc.id)} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px', border:'1.5px solid #1B4FE8', borderRadius:10, color:'#1B4FE8', fontWeight:600, fontSize:14, textDecoration:'none' }}>
                ⬇ Baixar PDF
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
