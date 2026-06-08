import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const C = {
  primary: '#1B4FE8',
  bg     : '#F0F4FF',
  card   : '#FFFFFF',
  text   : '#1E293B',
  muted  : '#64748B',
  border : '#CBD5E1',
  danger : '#EF4444',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Veritas</Text>
          <Text style={styles.subtitle}>Defesa do Consumidor com IA</Text>
        </View>

        {/* Card de Login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor={C.border}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={C.border}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Não tem conta? <Text style={styles.linkBold}>Cadastre-se grátis</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Ao entrar, você concorda com os Termos de Uso. O Veritas é uma ferramenta de
          automação documental — não substitui consultoria jurídica.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root   : { flex: 1, backgroundColor: C.bg },
  scroll : { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header : { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  title     : { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -1 },
  subtitle  : { fontSize: 14, color: C.muted, marginTop: 4 },
  card      : {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  cardTitle : { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 20 },
  field     : { marginBottom: 16 },
  label     : { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 6 },
  input     : {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: C.text, backgroundColor: '#F8FAFC',
  },
  inputRow  : { flexDirection: 'row', alignItems: 'center' },
  eyeBtn    : { position: 'absolute', right: 14, padding: 4 },
  btn       : {
    backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText   : { color: '#FFF', fontWeight: '700', fontSize: 16 },
  link      : { textAlign: 'center', color: C.muted, fontSize: 14 },
  linkBold  : { color: C.primary, fontWeight: '700' },
  disclaimer: { textAlign: 'center', color: C.muted, fontSize: 11, marginTop: 24, lineHeight: 16 },
});
