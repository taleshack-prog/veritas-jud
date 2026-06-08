import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const C = {
  primary : '#1B4FE8',
  bg      : '#F0F4FF',
  userBg  : '#1B4FE8',
  aiBg    : '#FFFFFF',
  text    : '#1E293B',
  muted   : '#64748B',
  border  : '#E2E8F0',
  success : '#10B981',
  warning : '#F59E0B',
};

const INITIAL_MESSAGE = {
  id     : '0',
  role   : 'assistant',
  content: '👋 Olá! Sou o Veritas, seu assistente de defesa do consumidor.\n\nMe conta o que aconteceu. Pode digitar ou usar o microfone — quanto mais detalhar (empresa, valor, data), melhor eu consigo te ajudar.',
};

const ACTION_LABELS = {
  consumidor_gov: { label: '🏛️ Consumidor.gov.br', color: '#1B4FE8' },
  procon        : { label: '⚖️ Procon',             color: '#7C3AED' },
  anatel        : { label: '📡 ANATEL',              color: '#059669' },
  bacen         : { label: '🏦 BACEN',               color: '#D97706' },
  jec           : { label: '🔨 Petição JEC',         color: '#DC2626' },
  notification  : { label: '📄 Notificação',         color: '#2563EB' },
};

function Message({ msg, onAction }) {
  const isUser = msg.role === 'user';

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="shield-checkmark" size={16} color="#FFF" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.content}
        </Text>

        {/* Análise estruturada */}
        {msg.analysis && (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>📋 Análise do seu caso</Text>
            <Text style={styles.analysisItem}>
              <Text style={styles.analysisBold}>Problema: </Text>
              {msg.analysis.problem_type}
            </Text>
            {msg.analysis.legal_basis?.slice(0, 2).map((lb, i) => (
              <Text key={i} style={styles.analysisItem}>
                ⚖️ {lb.law}, Art. {lb.article}
              </Text>
            ))}
            <Text style={[styles.analysisItem, {
              color: msg.analysis.severity === 'high' ? '#DC2626'
                   : msg.analysis.severity === 'medium' ? '#D97706' : C.success,
            }]}>
              Gravidade: {msg.analysis.severity === 'high' ? '🔴 Alta'
                        : msg.analysis.severity === 'medium' ? '🟡 Média' : '🟢 Baixa'}
            </Text>
          </View>
        )}

        {/* Ações recomendadas */}
        {msg.actions && msg.actions.length > 0 && (
          <View style={styles.actionsBox}>
            <Text style={styles.actionsTitle}>O que deseja fazer?</Text>
            {msg.actions.map((action, i) => {
              const meta = ACTION_LABELS[action.channel] || { label: action.label, color: C.primary };
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.actionBtn, { borderColor: meta.color }]}
                  onPress={() => onAction(action, msg.complaintId)}
                >
                  <Text style={[styles.actionBtnText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                  <Text style={styles.actionDesc}>{action.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState([INITIAL_MESSAGE]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [chatHist,  setChatHist]  = useState([]); // histórico para modo chat
  const flatRef = useRef(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── Envia mensagem ───────────────────────────────────────
  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    scrollToEnd();

    try {
      // Se é a primeira mensagem real do usuário, cria reclamação
      const isFirst = messages.length === 1;

      if (isFirst) {
        // Detecta empresa da mensagem (heurística simples)
        const companies = ['Claro', 'Vivo', 'TIM', 'Oi', 'Bradesco', 'Itaú', 'Caixa',
                           'Banco do Brasil', 'Santander', 'Nubank', 'Inter', 'Net', 'Sky'];
        const found = companies.find(c => text.toLowerCase().includes(c.toLowerCase()));

        const { data } = await complaintsAPI.create({
          title      : text.length > 60 ? text.slice(0, 57) + '...' : text,
          description: text,
          company    : found || 'Não identificada',
        });

        const { complaint } = data;
        const analysis      = complaint.analysis;

        const aiMsg = {
          id         : (Date.now() + 1).toString(),
          role       : 'assistant',
          complaintId: complaint.id,
          content    : analysis?.summary
            ? `Entendi! ${analysis.summary}\n\n${analysis.disclaimer}`
            : 'Reclamação registrada. Veja as opções abaixo:',
          analysis   : analysis,
          actions    : analysis?.recommended_actions?.slice(0, 3).map(a => ({
            ...a,
            description: a.description,
          })) || [],
        };

        setMessages([...newMessages, aiMsg]);

      } else {
        // Modo chat contínuo
        const history = [
          ...chatHist,
          { role: 'user', content: text },
        ];
        setChatHist(history);

        const { data } = await complaintsAPI.chat(history);

        const aiMsg = {
          id     : (Date.now() + 1).toString(),
          role   : 'assistant',
          content: data.reply,
        };

        setMessages(prev => [...prev, aiMsg]);
        setChatHist(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }

    } catch (err) {
      const errMsg = {
        id     : (Date.now() + 1).toString(),
        role   : 'assistant',
        content: '❌ Ocorreu um erro. Verifique sua conexão e tente novamente.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  // ── Ação do usuário (gerar documento, etc.) ──────────────
  async function handleAction(action, complaintId) {
    if (!complaintId) {
      Alert.alert('Atenção', 'Registre a reclamação primeiro.');
      return;
    }

    if (action.channel === 'notification' || action.channel === 'jec') {
      const typeMap = { notification: 'notification', jec: 'jec_petition' };
      navigation.navigate('Documents', {
        screen     : 'GenerateDoc',
        params     : { complaintId, type: typeMap[action.channel] },
      });
    } else {
      Alert.alert(
        ACTION_LABELS[action.channel]?.label || action.label,
        `${action.description}\n\nEstimativa: ${action.estimated_time}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text   : 'Ir para o portal',
            onPress: () => Alert.alert('Em breve', 'Integração com portal em desenvolvimento.'),
          },
        ]
      );
    }
  }

  // ── Nova conversa ────────────────────────────────────────
  function newChat() {
    setMessages([INITIAL_MESSAGE]);
    setChatHist([]);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Veritas</Text>
            <Text style={styles.headerSub}>Defesa do Consumidor</Text>
          </View>
        </View>
        <TouchableOpacity onPress={newChat} style={styles.newChatBtn}>
          <Ionicons name="add-circle-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Mensagens */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <Message msg={item} onAction={handleAction} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
        />

        {loading && (
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={styles.typingText}>Analisando...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Descreva seu problema..."
            placeholderTextColor={C.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft  : { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon  : {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle : { fontSize: 17, fontWeight: '700', color: C.text },
  headerSub   : { fontSize: 11, color: C.muted },
  newChatBtn  : { padding: 4 },

  list: { padding: 16, paddingBottom: 8 },

  msgRow    : { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar    : {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  bubble    : { maxWidth: '82%', borderRadius: 16, padding: 14 },
  bubbleAI  : {
    backgroundColor: C.aiBg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  bubbleUser: { backgroundColor: C.userBg },

  bubbleText    : { fontSize: 15, color: C.text, lineHeight: 22 },
  bubbleTextUser: { color: '#FFF' },

  analysisBox : {
    marginTop: 12, padding: 12, backgroundColor: '#F0F4FF',
    borderRadius: 10, borderLeftWidth: 3, borderLeftColor: C.primary,
  },
  analysisTitle: { fontSize: 12, fontWeight: '700', color: C.primary, marginBottom: 6 },
  analysisItem : { fontSize: 13, color: C.text, marginBottom: 3 },
  analysisBold : { fontWeight: '700' },

  actionsBox  : { marginTop: 12 },
  actionsTitle: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 8 },
  actionBtn   : {
    borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 8,
    backgroundColor: '#FFF',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  actionDesc  : { fontSize: 12, color: C.muted, marginTop: 2 },

  typing    : {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  typingText: { fontSize: 13, color: C.muted },

  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: '#FFF', padding: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
    color: C.text, maxHeight: 120, backgroundColor: '#F8FAFC',
  },
  sendBtn   : {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: C.border },
});
