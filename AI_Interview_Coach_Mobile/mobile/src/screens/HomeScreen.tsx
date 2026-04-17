import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

interface HomeScreenProps {
  onLogin: (userId: string) => void;
}

export function HomeScreen({ onLogin }: HomeScreenProps) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
      return;
    }

    setLoading(true);
    try {
      // Simular validación
      await new Promise((resolve) => setTimeout(resolve, 500));
      onLogin(userId);
    } catch (err) {
      Alert.alert('Error', 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 AI Interview Coach</Text>
      <Text style={styles.subtitle}>Entrena entrevistas técnicas con IA</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre de usuario"
          placeholderTextColor="#94a3b8"
          value={userId}
          onChangeText={setUserId}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Comenzar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Completa entrevistas técnicas y mejora tu desempeño con feedback de IA.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a5f3fc',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#03210f',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 14,
    marginHorizontal: 10,
  },
});
