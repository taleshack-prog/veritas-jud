import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const C = {
  primary: '#1B4FE8', bg: '#F0F4FF', card: '#FFFFFF',
  text: '#1E293B', muted: '#64748B', border: '#CBD5E1',
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao criar conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>É grátis e leva 30 segundos</Text>
        </View>

        <View style={styles.card}>
          {[
            { label: 'Nome completo', value: name, set: setName, placeholder: 'Seu nome', type: 'default' },
            { label: 'E-mail',        value: email, set: setEmail, placeholder: 'seu@email.com', type: 'email-address' },
            { label: 'Senha',         value: password, set: setPassword, placeholder: 'Mínimo 8 caracteres', secure: true },
          ].map(({ label, value, set, placeholder, type, secure }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={C.border}
                value={value}
                onChangeText={set}
                keyboardType={type}
                autoCapitalize={type === 'email-address' ? 'none' : 'words'}
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnText}>Criar conta grátis</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Já tem conta? <Text style={{ color: C.primary, fontWeight: '700' }}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll  : { flexGrow: 1, padding: 24 },
  header  : { marginBottom: 32, marginTop: 20 },
  backBtn : { marginBottom: 16 },
  title   : { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  subtitle: { color: '#64748B', marginTop: 4 },
  card    : {
    backgroundColor: '#FFF', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  field   : { marginBottom: 16 },
  label   : { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input   : {
    borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  btn     : {
    backgroundColor: '#1B4FE8', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnText : { color: '#FFF', fontWeight: '700', fontSize: 16 },
  link    : { textAlign: 'center', color: '#64748B', fontSize: 14 },
});
