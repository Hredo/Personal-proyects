import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { startSession, submitSessionAnswer, getProgress } from '../lib/api';
import { SessionResponse, ProgressResponse } from '../lib/types';

interface InterviewScreenProps {
  userId: string;
}

export function InterviewScreen({ userId }: InterviewScreenProps) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    total_score: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateQuestion = async () => {
    setLoading(true);
    setResult(null);
    setProgress(null);
    try {
      const newSession = await startSession({
        user_id: userId,
        role: 'backend',
        level: 'junior',
      });
      setSession(newSession);
      setAnswer('');
    } catch (err) {
      Alert.alert('Error', 'No se pudo generar la pregunta');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!session || !answer.trim()) {
      Alert.alert('Error', 'Por favor escribe una respuesta');
      return;
    }

    setLoading(true);
    try {
      const updated = await submitSessionAnswer(session.session_id, answer);
      setSession(updated);
      setResult({
        total_score: updated.total_score || 0,
        strengths: updated.strengths,
        improvements: updated.improvements,
      });

      const snap = await getProgress(userId);
      setProgress(snap);
    } catch (err) {
      Alert.alert('Error', 'No se pudo evaluar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🎤 Simulación Técnica</Text>

      <TouchableOpacity
        style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
        onPress={handleGenerateQuestion}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generar pregunta</Text>
        )}
      </TouchableOpacity>

      {session && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pregunta</Text>
            <Text style={styles.cardContent}>{session.question}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu respuesta</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Explica tu razonamiento técnico..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              value={answer}
              onChangeText={setAnswer}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonPrimary,
              (loading || answer.trim().length < 10) && styles.buttonDisabled,
            ]}
            onPress={handleEvaluate}
            disabled={loading || answer.trim().length < 10}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Evaluar respuesta</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {result && (
        <View style={[styles.card, styles.resultCard]}>
          <Text style={styles.cardTitle}>Resultado</Text>
          <Text style={styles.score}>Score total: {result.total_score}/100</Text>

          <Text style={[styles.cardTitle, styles.subTitle]}>Fortalezas</Text>
          {result.strengths.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>
              • {item}
            </Text>
          ))}

          <Text style={[styles.cardTitle, styles.subTitle]}>Mejoras</Text>
          {result.improvements.map((item, idx) => (
            <Text key={idx} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      )}

      {progress && (
        <View style={[styles.card, styles.progressCard]}>
          <Text style={styles.cardTitle}>Progreso</Text>
          <Text style={styles.progressItem}>
            Sesiones completadas: <Text style={styles.bold}>{progress.sessions_completed}</Text>
          </Text>
          <Text style={styles.progressItem}>
            Score medio: <Text style={styles.bold}>{progress.average_score.toFixed(1)}</Text>
          </Text>

          {progress.focus_areas.length > 0 && (
            <>
              <Text style={[styles.cardTitle, styles.subTitle]}>Focos de mejora</Text>
              {progress.focus_areas.map((item, idx) => (
                <Text key={idx} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: '#22c55e',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#03210f',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0a2f45',
    borderColor: '#1e3a5f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#0a3d1e',
    borderColor: '#1e5631',
  },
  progressCard: {
    backgroundColor: '#1a2f4a',
    borderColor: '#2a4a7a',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#67e8f9',
    marginBottom: 8,
  },
  subTitle: {
    marginTop: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  textarea: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 12,
  },
  listItem: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 8,
  },
  progressItem: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: '#67e8f9',
  },
});
