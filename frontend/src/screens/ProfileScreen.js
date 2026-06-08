import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const C = { primary:'#1B4FE8', bg:'#F0F4FF', card:'#FFF', text:'#1E293B', muted:'#64748B', border:'#E2E8F0', danger:'#EF4444' };

function MenuItem({ icon, label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? C.danger : C.primary} />
      <Text style={[styles.menuLabel, danger && { color:C.danger }]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={C.muted} style={{ marginLeft:'auto' }} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function confirmLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Sair', style:'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'lawyer' ? '⚖️ Advogado' : '👤 Consumidor'}
            </Text>
          </View>
        </View>

        {/* Legal disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>ℹ️ Sobre o Veritas</Text>
          <Text style={styles.disclaimerText}>
            O Veritas é uma ferramenta de automação documental para defesa do consumidor.
            Os documentos gerados são minutas baseadas no CDC e legislação aplicável.{'\n\n'}
            Esta plataforma não substitui consultoria jurídica. Consulte um advogado
            inscrito na OAB para análise individualizada do seu caso.
          </Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuItem icon="notifications-outline" label="Notificações" onPress={() => {}} />
          <MenuItem icon="lock-closed-outline"   label="Alterar senha" onPress={() => {}} />
          <MenuItem icon="help-circle-outline"   label="Ajuda e suporte" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Termos de uso" onPress={() => {}} />
          <MenuItem icon="shield-outline"        label="Privacidade e LGPD" onPress={() => {}} />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="log-out-outline" label="Sair" onPress={confirmLogout} danger />
        </View>

        <Text style={styles.version}>Veritas v1.0.0 — Defesa do Consumidor com IA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root       : { flex:1, backgroundColor:C.bg },
  header     : { backgroundColor:'#FFF', paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  headerTitle: { fontSize:22, fontWeight:'800', color:C.text },
  scroll     : { padding:16, gap:12 },
  profileCard: {
    backgroundColor:C.card, borderRadius:16, padding:24,
    alignItems:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
  },
  avatar     : {
    width:72, height:72, borderRadius:36, backgroundColor:C.primary,
    justifyContent:'center', alignItems:'center', marginBottom:12,
  },
  avatarText : { color:'#FFF', fontSize:30, fontWeight:'700' },
  userName   : { fontSize:20, fontWeight:'700', color:C.text },
  userEmail  : { fontSize:14, color:C.muted, marginTop:2 },
  roleBadge  : { marginTop:10, backgroundColor:'#EFF6FF', paddingHorizontal:14, paddingVertical:6, borderRadius:20 },
  roleText   : { fontSize:13, color:C.primary, fontWeight:'600' },
  disclaimerCard: {
    backgroundColor:'#FEF9EC', borderRadius:14, padding:16,
    borderLeftWidth:3, borderLeftColor:'#F59E0B',
  },
  disclaimerTitle: { fontSize:14, fontWeight:'700', color:'#92400E', marginBottom:8 },
  disclaimerText : { fontSize:12, color:'#78350F', lineHeight:18 },
  menuCard   : {
    backgroundColor:C.card, borderRadius:14,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:6, elevation:2,
    overflow:'hidden',
  },
  menuItem   : {
    flexDirection:'row', alignItems:'center', gap:12, padding:16,
    borderBottomWidth:1, borderBottomColor:C.border,
  },
  menuLabel  : { fontSize:15, color:C.text },
  menuValue  : { fontSize:14, color:C.muted, marginLeft:'auto', marginRight:8 },
  version    : { textAlign:'center', fontSize:12, color:C.muted, marginTop:8, marginBottom:16 },
});
