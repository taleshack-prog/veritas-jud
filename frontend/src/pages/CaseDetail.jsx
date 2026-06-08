// CaseDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI, documentsAPI } from '../services/api.js';

const DOC_TYPES = {
  notification   : { label:'Notificação Extrajudicial', emoji:'📧' },
  jec_petition   : { label:'Petição JEC',               emoji:'⚖️' },
  procon_complaint: { label:'Reclamação Procon',         emoji:'🏛️' },
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData,  setCaseData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [genLoading,setGenLoading]= useState(null);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    casesAPI.get(id)
      .then(({ data }) => setCaseData(data.case))
      .catch(() => navigate('/cases'))
      .finally(() => setLoading(false));
  }, [id]);

  async function generateDoc(type) {
    setGenLoading(type); setMsg('');
    try {
      await documentsAPI.generate({ complaint_id: id, type });
      setMsg('✅ Documento gerado! Acesse na aba Documentos.');
      const { data } = await casesAPI.get(id);
      setCaseData(data.case);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Erro ao gerar documento.'));
    } finally { setGenLoading(null); }
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  const a = caseData?.analysis;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F0F4FF' }}>
      <div className="page-header" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate('/cases')} style={{ border:'none', background:'none', fontSize:22, cursor:'pointer' }}>←</button>
        <div style={{ flex:1, overflow:'hidden' }}>
          <div className="page-title" style={{ fontSize:17, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{caseData.title}</div>
          <div className="page-sub">{caseData.company}</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {/* Info */}
        <div className="card">
          <div style={{ fontSize:12, fontWeight:600, color:'#64748B', marginBottom:4 }}>Descrição</div>
          <div style={{ fontSize:14, lineHeight:1.6 }}>{caseData.description}</div>
          {caseData.amount && <div style={{ marginTop:8, fontSize:14 }}><strong>Valor:</strong> {Number(caseData.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>}
          <div style={{ marginTop:8, fontSize:12, color:'#94A3B8' }}>{new Date(caseData.created_at).toLocaleDateString('pt-BR',{dateStyle:'full'})}</div>
        </div>

        {/* Análise */}
        {a && (
          <div className="card">
            <div style={{ fontWeight:700, marginBottom:10 }}>🤖 Análise de IA</div>
            <div style={{ fontSize:14, marginBottom:6 }}><strong>Tipo:</strong> {a.problem_type}</div>
            <div style={{ fontSize:14, marginBottom:8 }}>{a.summary}</div>
            {a.legal_basis?.map((lb,i) => (
              <div key={i} style={{ fontSize:13, color:'#64748B', marginBottom:2 }}>⚖️ {lb.law}, Art. {lb.article}</div>
            ))}
            <div className="disclaimer" style={{ marginTop:10 }}>{a.disclaimer}</div>
          </div>
        )}

        {/* Gerar documentos */}
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:4 }}>📄 Gerar Documentos</div>
          <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>Gerados pela IA com base no seu caso.</div>
          {msg && <div style={{ padding:'10px 12px', borderRadius:8, background: msg.startsWith('✅') ? '#D1FAE5' : '#FEE2E2', fontSize:13, marginBottom:12, color: msg.startsWith('✅') ? '#065F46' : '#991B1B' }}>{msg}</div>}
          {Object.entries(DOC_TYPES).map(([type, meta]) => {
            const done = caseData.documents?.some(d => d.type === type);
            return (
              <button key={type} onClick={() => generateDoc(type)} disabled={!!genLoading}
                style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:14, marginBottom:8, border:`1.5px solid ${done ? '#10B981' : '#E2E8F0'}`, borderRadius:12, background: done ? '#F0FDF4' : '#F8FAFC', cursor:'pointer', textAlign:'left' }}>
                {genLoading === type ? <span className="spinner" style={{width:18,height:18,borderWidth:2}}/> : <span style={{fontSize:20}}>{meta.emoji}</span>}
                <div style={{flex:1}}>
                  <div style={{fontSize:14, fontWeight:600, color: done ? '#10B981' : '#1E293B'}}>{done ? '✅ ' : ''}{meta.label}</div>
                  {done && <div style={{fontSize:11,color:'#64748B'}}>Já gerado — gere novamente se precisar</div>}
                </div>
                <span style={{color:'#94A3B8'}}>›</span>
              </button>
            );
          })}
        </div>

        {/* Docs existentes */}
        {caseData.documents?.length > 0 && (
          <div className="card">
            <div style={{fontWeight:700, marginBottom:10}}>📁 Documentos ({caseData.documents.length})</div>
            {caseData.documents.map(d => (
              <div key={d.id} style={{display:'flex', alignItems:'center', gap:10, paddingVertical:10, borderBottom:'1px solid #E2E8F0', paddingBottom:8, marginBottom:8}}>
                <span>📄</span>
                <div style={{flex:1, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                <a href={documentsAPI.pdfUrl(d.id)} target="_blank" rel="noreferrer"
                  style={{fontSize:12, color:'#1B4FE8', fontWeight:600, textDecoration:'none', whiteSpace:'nowrap'}}>⬇ PDF</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
