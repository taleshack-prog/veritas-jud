import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../services/api.js';

const INITIAL = {
  id: '0', role: 'assistant',
  content: '👋 Olá! Sou o Veritas, seu assistente de defesa do consumidor.\n\nDescreva seu problema — empresa, o que aconteceu e o valor envolvido se houver. Vou analisar e indicar as melhores ações.',
};

const ACTION_META = {
  consumidor_gov: { emoji: '🏛️', label: 'Consumidor.gov.br' },
  procon        : { emoji: '⚖️', label: 'Procon' },
  anatel        : { emoji: '📡', label: 'ANATEL' },
  bacen         : { emoji: '🏦', label: 'BACEN' },
  jec           : { emoji: '🔨', label: 'Petição JEC' },
  notification  : { emoji: '📄', label: 'Notificação' },
};

function Bubble({ msg, onAction }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14, alignItems: 'flex-end', gap: 8 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1B4FE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🛡️</div>
      )}
      <div style={{
        maxWidth: '82%', padding: '12px 14px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#1B4FE8' : '#fff',
        color: isUser ? '#fff' : '#1E293B',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        fontSize: 14, lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}

        {msg.analysis && (
          <div style={{ marginTop: 12, padding: 12, background: '#F0F4FF', borderRadius: 10, borderLeft: '3px solid #1B4FE8' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4FE8', marginBottom: 6 }}>📋 ANÁLISE DO CASO</div>
            <div style={{ fontSize: 13, color: '#1E293B', marginBottom: 3 }}>
              <strong>Problema:</strong> {msg.analysis.problem_type}
            </div>
            <div style={{ fontSize: 13, color: '#1E293B', marginBottom: 3 }}>
              <strong>Gravidade:</strong>{' '}
              <span style={{ color: msg.analysis.severity === 'high' ? '#DC2626' : msg.analysis.severity === 'medium' ? '#D97706' : '#10B981' }}>
                {msg.analysis.severity === 'high' ? '🔴 Alta' : msg.analysis.severity === 'medium' ? '🟡 Média' : '🟢 Baixa'}
              </span>
            </div>
            {msg.analysis.legal_basis?.slice(0, 2).map((lb, i) => (
              <div key={i} style={{ fontSize: 12, color: '#64748B' }}>⚖️ {lb.law}, Art. {lb.article}</div>
            ))}
          </div>
        )}

        {msg.actions?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: 600 }}>O que deseja fazer?</div>
            {msg.actions.map((action, i) => {
              const meta = ACTION_META[action.channel] || { emoji: '▶️', label: action.label };
              return (
                <button key={i} onClick={() => onAction(action, msg.complaintId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '10px 12px', marginBottom: 6, border: '1.5px solid #1B4FE8',
                    borderRadius: 10, background: '#fff', cursor: 'pointer', textAlign: 'left',
                  }}>
                  <span>{meta.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B4FE8' }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{action.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate  = useNavigate();
  const [messages, setMessages] = useState([INITIAL]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [chatHist, setChatHist] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const isFirst = messages.length === 1;
      if (isFirst) {
        const companies = ['Claro','Vivo','TIM','Oi','Bradesco','Itaú','Caixa','Banco do Brasil','Santander','Nubank','Inter','Net','Sky','Algar'];
        const found = companies.find(c => text.toLowerCase().includes(c.toLowerCase()));
        const { data } = await complaintsAPI.create({
          title: text.length > 60 ? text.slice(0, 57) + '...' : text,
          description: text,
          company: found || 'Não identificada',
        });
        const { complaint } = data;
        const analysis = complaint.analysis;
        setMessages(prev => [...prev, {
          id: (Date.now()+1).toString(), role: 'assistant',
          complaintId: complaint.id,
          content: analysis?.summary ? `Entendi! ${analysis.summary}\n\n⚠️ ${analysis.disclaimer}` : 'Reclamação registrada. Veja as ações abaixo:',
          analysis,
          actions: analysis?.recommended_actions?.slice(0, 3) || [],
        }]);
      } else {
        const history = [...chatHist, { role: 'user', content: text }];
        setChatHist(history);
        const { data } = await complaintsAPI.chat(history);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply }]);
        setChatHist(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: '❌ Erro ao processar. Verifique sua conexão e tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action, complaintId) {
    if (action.channel === 'notification') navigate(`/documents?generate=notification&id=${complaintId}`);
    else if (action.channel === 'jec')      navigate(`/documents?generate=jec_petition&id=${complaintId}`);
    else alert(`${ACTION_META[action.channel]?.label || action.label}\n\n${action.description}\n\nEstimativa: ${action.estimated_time}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F4FF' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1B4FE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Veritas</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Defesa do Consumidor</div>
          </div>
        </div>
        <button onClick={() => { setMessages([INITIAL]); setChatHist([]); }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#64748B' }}>✏️</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map(msg => <Bubble key={msg.id} msg={msg} onAction={handleAction} />)}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1B4FE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🛡️</div>
            <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: '#fff', padding: '12px 12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Descreva seu problema..."
          rows={1}
          style={{
            flex: 1, border: '1.5px solid #E2E8F0', borderRadius: 12,
            padding: '10px 14px', fontSize: 15, resize: 'none', fontFamily: 'inherit',
            outline: 'none', maxHeight: 100, overflowY: 'auto', lineHeight: 1.5,
          }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{
            width: 44, height: 44, borderRadius: 12, border: 'none', flexShrink: 0,
            background: input.trim() && !loading ? '#1B4FE8' : '#E2E8F0',
            color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>➤</button>
      </div>
    </div>
  );
}
