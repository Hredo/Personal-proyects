import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.badge}>AI Interview Coach</Text>
        <Text style={styles.title}>Entrena entrevistas tecnicas como si fueran reales</Text>
        <Text style={styles.subtitle}>
          Simulaciones guiadas, feedback por competencias y plan de mejora semanal.
        </Text>

        <Link href="/interview" style={styles.button}>
          Empezar simulacion
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  badge: {
    color: '#67e8f9',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#22c55e',
    color: '#03210f',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
});
