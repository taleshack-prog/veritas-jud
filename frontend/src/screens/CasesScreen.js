import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { casesAPI } from '../services/api';

const C = { primary:'#1B4FE8', bg:'#F0F4FF', card:'#FFF', text:'#1E293B', muted:'#64748B', border:'#E2E8F0' };

const STATUS = {
  open       : { label:'Aberto',       color:'#F59E0B', bg:'#FEF3C7', icon:'time-outline' },
  in_progress: { label:'Em andamento', color:'#3B82F6', bg:'#EFF6FF', icon:'sync-outline' },
  resolved   : { label:'Resolvido',    color:'#10B981', bg:'#D1FAE5', icon:'checkmark-circle-outline' },
  closed     : { label:'Encerrado',    color:'#6B7280', bg:'#F3F4F6', icon:'close-circle-outline' },
};

const CATEGORY = {
  telecom  : '📡',
  bank     : '🏦',
  utility  : '💡',
  ecommerce: '📦',
  other    : '⚠️',
};

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CaseCard({ item, onPress }) {
  const st = STATUS[item.status] || STATUS.open;
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{CATEGORY[item.category] || '⚠️'}</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardCompany}>{item.company}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={12} color={st.color} />
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>
          📄 {item.documents_count} doc{item.documents_count !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cardMeta}>
          📬 {item.submissions_count} envio{item.submissions_count !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CasesScreen({ navigation }) {
  const [cases,     setCases]     = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCases() {
    try {
      const { data } = await casesAPI.list();
      setCases(data.cases);
      setStats(data.stats);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { fetchCases(); }, []));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Casos</Text>
        <Text style={styles.headerSub}>{stats.total || 0} reclamações registradas</Text>
      </View>

      {/* Stats */}
      {stats.total > 0 && (
        <View style={styles.statsRow}>
          <StatCard label="Abertos"      value={stats.open}        color="#F59E0B" />
          <StatCard label="Andamento"    value={stats.in_progress} color="#3B82F6" />
          <StatCard label="Resolvidos"   value={stats.resolved}    color="#10B981" />
        </View>
      )}

      <FlatList
        data={cases}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <CaseCard
            item={item}
            onPress={c => navigation.navigate('CaseDetail', { id: c.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCases(); }} colors={[C.primary]} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={56} color={C.border} />
              <Text style={styles.emptyTitle}>Nenhuma reclamação ainda</Text>
              <Text style={styles.emptySub}>Use a aba "Meu Problema" para registrar seu primeiro caso.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root       : { flex: 1, backgroundColor: C.bg },
  header     : { backgroundColor:'#FFF', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  headerTitle: { fontSize:22, fontWeight:'800', color:C.text },
  headerSub  : { fontSize:13, color:C.muted, marginTop:2 },

  statsRow   : { flexDirection:'row', paddingHorizontal:16, paddingVertical:12, gap:8 },
  statCard   : {
    flex:1, backgroundColor:C.card, borderRadius:12, padding:12,
    alignItems:'center', borderTopWidth:3,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:2,
  },
  statVal    : { fontSize:24, fontWeight:'800' },
  statLabel  : { fontSize:11, color:C.muted, marginTop:2 },

  list       : { padding:16, paddingTop:8 },
  card       : {
    backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:12,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  cardHeader : { flexDirection:'row', alignItems:'center', marginBottom:10 },
  emoji      : { fontSize:24 },
  cardTitle  : { fontSize:15, fontWeight:'700', color:C.text },
  cardCompany: { fontSize:13, color:C.muted, marginTop:1 },
  badge      : { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:4, borderRadius:20 },
  badgeText  : { fontSize:11, fontWeight:'600' },
  cardFooter : { flexDirection:'row', gap:16, borderTopWidth:1, borderTopColor:C.border, paddingTop:10 },
  cardMeta   : { fontSize:12, color:C.muted },
  cardDate   : { fontSize:12, color:C.muted, marginLeft:'auto' },

  empty      : { alignItems:'center', paddingTop:80, paddingHorizontal:32 },
  emptyTitle : { fontSize:18, fontWeight:'700', color:C.muted, marginTop:16 },
  emptySub   : { textAlign:'center', color:C.muted, marginTop:8, lineHeight:20 },
});
