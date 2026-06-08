import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView }   from 'react-native-gesture-handler';
import { SafeAreaProvider }          from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/hooks/useAuth';

// Telas
import LoginScreen      from './src/screens/LoginScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import ChatScreen       from './src/screens/ChatScreen';
import CasesScreen      from './src/screens/CasesScreen';
import CaseDetailScreen from './src/screens/CaseDetailScreen';
import DocumentsScreen  from './src/screens/DocumentsScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import ProfileScreen    from './src/screens/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const COLORS = {
  primary : '#1B4FE8',
  bg      : '#F0F4FF',
  tab     : '#FFFFFF',
  inactive: '#94A3B8',
};

// ── Navegação autenticada ──────────────────────────────────
function CasesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CasesList"   component={CasesScreen} />
      <Stack.Screen name="CaseDetail"  component={CaseDetailScreen} />
    </Stack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tab,
          borderTopColor : '#E2E8F0',
          paddingBottom  : 8,
          height         : 64,
        },
        tabBarActiveTintColor  : COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Chat       : focused ? 'chatbubble'     : 'chatbubble-outline',
            Cases      : focused ? 'folder'         : 'folder-outline',
            Documents  : focused ? 'document-text'  : 'document-text-outline',
            Marketplace: focused ? 'people'         : 'people-outline',
            Profile    : focused ? 'person-circle'  : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chat"        component={ChatScreen}        options={{ tabBarLabel: 'Meu Problema' }} />
      <Tab.Screen name="Cases"       component={CasesStack}        options={{ tabBarLabel: 'Meus Casos' }} />
      <Tab.Screen name="Documents"   component={DocumentsScreen}   options={{ tabBarLabel: 'Documentos' }} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ tabBarLabel: 'Advogados' }} />
      <Tab.Screen name="Profile"     component={ProfileScreen}     options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// ── Navegação de autenticação ──────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Root navigator ─────────────────────────────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return user ? <AppTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
});
