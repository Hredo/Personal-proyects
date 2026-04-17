import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getProgress, startSession, submitSessionAnswer } from '../src/lib/api';

export default function InterviewScreen() {
  const demoUserId = 'demo_user';
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total_score: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [progress, setProgress] = useState<{
    sessions_completed: number;
    average_score: number;
    focus_areas: string[];
  } | null>(null);

  const canEvaluate = useMemo(() => question.length > 0 && answer.trim().length > 10, [question, answer]);

  const handleGenerateQuestion = async () => {
    setLoading(true);
    setResult(null);
    try {
      const session = await startSession({
        user_id: demoUserId,
        role: 'backend',
        level: 'junior',
      });
      setSessionId(session.session_id);
      setQuestion(session.question);
      setAnswer('');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!canEvaluate) {
      return;
    }

    setLoading(true);
    try {
      if (!sessionId) {
        return;
      }

      const session = await submitSessionAnswer(sessionId, answer);
      setResult({
        total_score: session.total_score || 0,
        strengths: session.strengths,
        improvements: session.improvements,
      });

      const snapshot = await getProgress(demoUserId);
      setProgress({
        sessions_completed: snapshot.sessions_completed,
        average_score: snapshot.average_score,
        focus_areas: snapshot.focus_areas,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Simulacion tecnica</Text>

        <Pressable disabled={loading} style={styles.action} onPress={handleGenerateQuestion}>
          <Text style={styles.actionText}>{loading ? 'Cargando...' : 'Generar pregunta'}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Pregunta</Text>
          <Text style={styles.questionText}>{question || 'Pulsa "Generar pregunta" para empezar.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tu respuesta</Text>
          <TextInput
            multiline
            numberOfLines={6}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Explica tu razonamiento tecnico..."
            placeholderTextColor="#64748b"
            style={styles.input}
          />
        </View>

        <Pressable disabled={!canEvaluate || loading} style={[styles.action, !canEvaluate && styles.disabled]} onPress={handleEvaluate}>
          <Text style={styles.actionText}>Evaluar respuesta</Text>
        </Pressable>

        {result && (
          <View style={styles.card}>
            <Text style={styles.label}>Resultado</Text>
            <Text style={styles.score}>Score total: {result.total_score}/100</Text>
            <Text style={styles.section}>Fortalezas</Text>
            {result.strengths.map((item) => (
              <Text key={item} style={styles.item}>• {item}</Text>
            ))}
            <Text style={styles.section}>Mejoras</Text>
            {result.improvements.map((item) => (
              <Text key={item} style={styles.item}>• {item}</Text>
            ))}
          </View>
        )}

        {progress && (
          <View style={styles.card}>
            <Text style={styles.label}>Progreso</Text>
            <Text style={styles.item}>Sesiones completadas: {progress.sessions_completed}</Text>
            <Text style={styles.item}>Score medio: {progress.average_score}</Text>
            <Text style={styles.section}>Focos de mejora</Text>
            {progress.focus_areas.length === 0 && <Text style={styles.item}>• Sin datos aun</Text>}
            {progress.focus_areas.map((item) => (
              <Text key={item} style={styles.item}>• {item}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#0f2037',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  label: {
    color: '#67e8f9',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 10,
  },
  action: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#03210f',
    fontWeight: '700',
  },
  score: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    color: '#a5f3fc',
    fontWeight: '700',
    marginTop: 4,
  },
  item: {
    color: '#cbd5e1',
    lineHeight: 20,
  },
});
