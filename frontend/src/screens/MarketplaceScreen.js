import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { marketplaceAPI } from '../services/api';

const C = { primary:'#1B4FE8', bg:'#F0F4FF', card:'#FFF', text:'#1E293B', muted:'#64748B', border:'#E2E8F0' };

function Stars({ rating }) {
  return (
    <View style={{ flexDirection:'row', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={12} color="#F59E0B" />
      ))}
    </View>
  );
}

function LawyerCard({ lawyer }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{lawyer.name?.[0] || '?'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={styles.name}>{lawyer.name}</Text>
          <Text style={styles.oab}>OAB/{lawyer.state} {lawyer.oab_number}</Text>
          <Stars rating={lawyer.rating || 0} />
        </View>
      </View>
      {lawyer.bio && <Text style={styles.bio} numberOfLines={2}>{lawyer.bio}</Text>}
      <View style={styles.tags}>
        {(lawyer.specialties || []).slice(0, 3).map((s, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{s}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.contactBtn}>
        <Text style={styles.contactBtnText}>Solicitar Contato</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MarketplaceScreen() {
  const [lawyers,  setLawyers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await marketplaceAPI.lawyers();
        setLawyers(data.lawyers);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = lawyers.filter(l =>
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.specialties?.join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advogados</Text>
        <Text style={styles.headerSub}>Especialistas em direito do consumidor</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={C.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou especialidade..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Banner informativo */}
      <View style={styles.banner}>
        <Ionicons name="information-circle" size={16} color='#1B4FE8' />
        <Text style={styles.bannerText}>
          Advogados parceiros revisam e assinam suas petições. Honorários combinados diretamente.
        </Text>
      </View>

      {loading
        ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop:40 }} />
        : (
          <FlatList
            data={filtered}
            keyExtractor={l => l.id}
            renderItem={({ item }) => <LawyerCard lawyer={item} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={56} color={C.border} />
                <Text style={styles.emptyTitle}>Nenhum advogado cadastrado</Text>
                <Text style={styles.emptySub}>Em breve nosso marketplace estará disponível.</Text>
              </View>
            }
          />
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root       : { flex:1, backgroundColor:C.bg },
  header     : { backgroundColor:'#FFF', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  headerTitle: { fontSize:22, fontWeight:'800', color:C.text },
  headerSub  : { fontSize:13, color:C.muted, marginTop:2 },
  searchBox  : {
    flexDirection:'row', alignItems:'center', gap:10,
    backgroundColor:'#FFF', margin:16, padding:12,
    borderRadius:12, borderWidth:1.5, borderColor:C.border,
  },
  searchInput: { flex:1, fontSize:15, color:C.text },
  banner     : {
    flexDirection:'row', alignItems:'flex-start', gap:8,
    backgroundColor:'#EFF6FF', marginHorizontal:16, marginBottom:8,
    padding:12, borderRadius:10,
  },
  bannerText : { flex:1, fontSize:12, color:C.primary, lineHeight:18 },
  list       : { padding:16, paddingTop:4 },
  card       : {
    backgroundColor:C.card, borderRadius:14, padding:16, marginBottom:12,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  cardHeader : { flexDirection:'row', gap:12, marginBottom:10 },
  avatar     : {
    width:48, height:48, borderRadius:24, backgroundColor:C.primary,
    justifyContent:'center', alignItems:'center',
  },
  avatarText : { color:'#FFF', fontSize:20, fontWeight:'700' },
  name       : { fontSize:16, fontWeight:'700', color:C.text },
  oab        : { fontSize:12, color:C.muted, marginBottom:4 },
  bio        : { fontSize:13, color:C.muted, marginBottom:10, lineHeight:18 },
  tags       : { flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:12 },
  tag        : { backgroundColor:'#EFF6FF', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  tagText    : { fontSize:12, color:C.primary, fontWeight:'600' },
  contactBtn : {
    backgroundColor:C.primary, borderRadius:10, paddingVertical:12, alignItems:'center',
  },
  contactBtnText: { color:'#FFF', fontWeight:'700', fontSize:14 },
  empty      : { alignItems:'center', paddingTop:60, paddingHorizontal:32 },
  emptyTitle : { fontSize:18, fontWeight:'700', color:C.muted, marginTop:16 },
  emptySub   : { textAlign:'center', color:C.muted, marginTop:8, lineHeight:20 },
});
