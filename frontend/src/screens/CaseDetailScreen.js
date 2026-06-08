import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { casesAPI, documentsAPI } from '../services/api';

const C = { primary:'#1B4FE8', bg:'#F0F4FF', card:'#FFF', text:'#1E293B', muted:'#64748B', border:'#E2E8F0' };

const DOC_TYPES = {
  notification   : { label:'Notificação Extrajudicial', icon:'mail', color:'#2563EB' },
  jec_petition   : { label:'Petição JEC',               icon:'hammer', color:'#DC2626' },
  procon_complaint: { label:'Reclamação Procon',         icon:'business', color:'#7C3AED' },
};

export default function CaseDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [caseData,  setCaseData]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [genLoading,setGenLoading]= useState(null); // type being generated

  useEffect(() => {
    (async () => {
      try {
        const { data } = await casesAPI.get(id);
        setCaseData(data.case);
      } catch (_) {
        Alert.alert('Erro', 'Não foi possível carregar o caso.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function generateDoc(type) {
    setGenLoading(type);
    try {
      const { data } = await documentsAPI.generate({ complaint_id: id, type });
      Alert.alert(
        '✅ Documento gerado!',
        `"${data.document.name}" foi criado. Acesse na aba Documentos para baixar o PDF.`,
        [{ text: 'OK' }]
      );
      // Reload case
      const { data: fresh } = await casesAPI.get(id);
      setCaseData(fresh.case);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Falha ao gerar documento.');
    } finally {
      setGenLoading(null);
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  const analysis = caseData?.analysis;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{caseData.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Info do caso */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Empresa</Text>
          <Text style={styles.cardValue}>{caseData.company}</Text>

          {caseData.amount && (
            <>
              <Text style={styles.cardLabel}>Valor envolvido</Text>
              <Text style={styles.cardValue}>
                {Number(caseData.amount).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </Text>
            </>
          )}

          <Text style={styles.cardLabel}>Descrição</Text>
          <Text style={[styles.cardValue, { lineHeight:22 }]}>{caseData.description}</Text>

          <Text style={styles.cardLabel}>Registrado em</Text>
          <Text style={styles.cardValue}>
            {new Date(caseData.created_at).toLocaleDateString('pt-BR', { dateStyle:'full' })}
          </Text>
        </View>

        {/* Análise de IA */}
        {analysis && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🤖 Análise de IA</Text>
            <Text style={styles.analysisItem}><Text style={styles.bold}>Tipo: </Text>{analysis.problem_type}</Text>
            <Text style={styles.analysisItem}><Text style={styles.bold}>Resumo: </Text>{analysis.summary}</Text>

            {analysis.legal_basis?.length > 0 && (
              <>
                <Text style={[styles.bold, { marginTop:8, marginBottom:4 }]}>Fundamentação legal:</Text>
                {analysis.legal_basis.map((lb, i) => (
                  <Text key={i} style={styles.legalItem}>
                    ⚖️ {lb.law}, Art. {lb.article} — {lb.description}
                  </Text>
                ))}
              </>
            )}

            <Text style={styles.disclaimer}>{analysis.disclaimer}</Text>
          </View>
        )}

        {/* Gerar Documentos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📄 Gerar Documentos</Text>
          <Text style={styles.sectionSub}>Documentos gerados pela IA com base no seu caso.</Text>

          {Object.entries(DOC_TYPES).map(([type, meta]) => {
            const alreadyGenerated = caseData.documents?.some(d => d.type === type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.docBtn, alreadyGenerated && styles.docBtnDone]}
                onPress={() => generateDoc(type)}
                disabled={!!genLoading}
              >
                {genLoading === type
                  ? <ActivityIndicator size="small" color={meta.color} />
                  : <Ionicons name={meta.icon} size={20} color={alreadyGenerated ? '#10B981' : meta.color} />
                }
                <View style={{ flex:1 }}>
                  <Text style={[styles.docBtnText, alreadyGenerated && { color:'#10B981' }]}>
                    {alreadyGenerated ? '✅ ' : ''}{meta.label}
                  </Text>
                  {alreadyGenerated && <Text style={styles.docBtnSub}>Já gerado — gere novamente se precisar</Text>}
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Documentos existentes */}
        {caseData.documents?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📁 Documentos ({caseData.documents.length})</Text>
            {caseData.documents.map(doc => (
              <View key={doc.id} style={styles.docItem}>
                <Ionicons name="document-text" size={18} color={C.primary} />
                <Text style={styles.docItemText} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.docItemDate}>
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Envios */}
        {caseData.submissions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📬 Envios</Text>
            {caseData.submissions.map(s => (
              <View key={s.id} style={styles.submItem}>
                <Text style={styles.submChannel}>{s.channel}</Text>
                <Text style={styles.submStatus}>{s.status}</Text>
                {s.protocol && <Text style={styles.submProtocol}>Protocolo: {s.protocol}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root   : { flex:1, backgroundColor:C.bg },
  center : { flex:1, justifyContent:'center', alignItems:'center' },
  header : {
    flexDirection:'row', alignItems:'center', gap:12,
    backgroundColor:'#FFF', paddingHorizontal:16, paddingVertical:14,
    borderBottomWidth:1, borderBottomColor:C.border,
  },
  back        : { padding:4 },
  headerTitle : { fontSize:17, fontWeight:'700', color:C.text, flex:1 },
  scroll      : { padding:16, gap:12 },
  card        : {
    backgroundColor:C.card, borderRadius:14, padding:16,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  cardLabel   : { fontSize:12, fontWeight:'600', color:C.muted, marginTop:10, marginBottom:2 },
  cardValue   : { fontSize:15, color:C.text },
  sectionTitle: { fontSize:16, fontWeight:'700', color:C.text, marginBottom:4 },
  sectionSub  : { fontSize:13, color:C.muted, marginBottom:12 },
  bold        : { fontWeight:'700', color:C.text },
  analysisItem: { fontSize:14, color:C.text, marginBottom:4 },
  legalItem   : { fontSize:13, color:C.muted, marginBottom:3, paddingLeft:8 },
  disclaimer  : {
    fontSize:11, color:C.muted, marginTop:12, fontStyle:'italic',
    backgroundColor:'#F0F4FF', padding:10, borderRadius:8,
  },
  docBtn : {
    flexDirection:'row', alignItems:'center', gap:12,
    borderWidth:1.5, borderColor:C.border, borderRadius:12,
    padding:14, marginBottom:8, backgroundColor:'#F8FAFC',
  },
  docBtnDone : { borderColor:'#D1FAE5', backgroundColor:'#F0FDF4' },
  docBtnText : { fontSize:14, fontWeight:'600', color:C.text },
  docBtnSub  : { fontSize:11, color:C.muted, marginTop:1 },
  docItem    : {
    flexDirection:'row', alignItems:'center', gap:10,
    paddingVertical:10, borderBottomWidth:1, borderBottomColor:C.border,
  },
  docItemText: { flex:1, fontSize:14, color:C.text },
  docItemDate: { fontSize:12, color:C.muted },
  submItem   : {
    paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border,
  },
  submChannel : { fontSize:14, fontWeight:'600', color:C.text },
  submStatus  : { fontSize:13, color:C.muted },
  submProtocol: { fontSize:12, color:C.primary, marginTop:2 },
});
