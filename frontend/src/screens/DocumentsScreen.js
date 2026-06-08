import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Linking, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { documentsAPI } from '../services/api';

const C = { primary:'#1B4FE8', bg:'#F0F4FF', card:'#FFF', text:'#1E293B', muted:'#64748B', border:'#E2E8F0' };

const TYPE_META = {
  notification   : { label:'Notificação',  color:'#2563EB', icon:'mail' },
  jec_petition   : { label:'Petição JEC',  color:'#DC2626', icon:'hammer' },
  procon_complaint:{ label:'Procon',        color:'#7C3AED', icon:'business' },
};

function DocCard({ doc, onDownload }) {
  const meta = TYPE_META[doc.type] || { label: doc.type, color:C.primary, icon:'document' };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{doc.name}</Text>
          <Text style={styles.cardMeta}>
            {meta.label} • {doc.company} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.downloadBtn} onPress={() => onDownload(doc)}>
        <Ionicons name="download-outline" size={16} color={C.primary} />
        <Text style={styles.downloadText}>Baixar PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DocumentsScreen() {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchDocs() {
    try {
      const { data } = await documentsAPI.list();
      setDocs(data.documents);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { fetchDocs(); }, []));

  function handleDownload(doc) {
    const url = documentsAPI.pdfUrl(doc.id);
    Alert.alert(
      '📄 Baixar PDF',
      `O documento "${doc.name}" será aberto no navegador para download.`,
      [
        { text:'Cancelar', style:'cancel' },
        { text:'Abrir PDF', onPress: () => Linking.openURL(url) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documentos</Text>
        <Text style={styles.headerSub}>{docs.length} documentos gerados</Text>
      </View>

      <FlatList
        data={docs}
        keyExtractor={d => d.id}
        renderItem={({ item }) => <DocCard doc={item} onDownload={handleDownload} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDocs(); }} colors={[C.primary]} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={56} color={C.border} />
              <Text style={styles.emptyTitle}>Nenhum documento ainda</Text>
              <Text style={styles.emptySub}>Abra um caso e gere uma notificação ou petição.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root       : { flex:1, backgroundColor:C.bg },
  header     : { backgroundColor:'#FFF', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  headerTitle: { fontSize:22, fontWeight:'800', color:C.text },
  headerSub  : { fontSize:13, color:C.muted, marginTop:2 },
  list       : { padding:16 },
  card       : {
    backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:12,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  cardHeader  : { flexDirection:'row', alignItems:'flex-start', gap:12, marginBottom:12 },
  iconBox     : { width:44, height:44, borderRadius:10, justifyContent:'center', alignItems:'center' },
  cardTitle   : { fontSize:14, fontWeight:'600', color:C.text, lineHeight:20 },
  cardMeta    : { fontSize:12, color:C.muted, marginTop:3 },
  downloadBtn : {
    flexDirection:'row', alignItems:'center', gap:6, justifyContent:'center',
    borderWidth:1.5, borderColor:C.primary, borderRadius:10,
    paddingVertical:10,
  },
  downloadText: { color:C.primary, fontWeight:'600', fontSize:14 },
  empty       : { alignItems:'center', paddingTop:80, paddingHorizontal:32 },
  emptyTitle  : { fontSize:18, fontWeight:'700', color:C.muted, marginTop:16 },
  emptySub    : { textAlign:'center', color:C.muted, marginTop:8, lineHeight:20 },
});
