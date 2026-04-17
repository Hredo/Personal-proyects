import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ProgressResponse } from '../lib/types';
import { getProgress } from '../lib/api';

interface DashboardScreenProps {
  userId: string;
}

export function DashboardScreen({ userId }: DashboardScreenProps) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await getProgress(userId);
        setProgress(data);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!progress || progress.sessions_completed === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📊 Panel de Progreso</Text>
        <View style={styles.card}>
          <Text style={styles.cardContent}>
            No hay sesiones completadas aún. ¡Completa tu primera entrevista!
          </Text>
        </View>
      </View>
    );
  }

  const maxScore = Math.max(...progress.latest_scores, 0);
  const minScore = Math.min(...progress.latest_scores, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Panel de Progreso</Text>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Sesiones</Text>
          <Text style={styles.kpiValue}>{progress.sessions_completed}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Promedio</Text>
          <Text style={styles.kpiValue}>{progress.average_score.toFixed(1)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Máximo</Text>
          <Text style={styles.kpiValue}>{maxScore}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Mínimo</Text>
          <Text style={styles.kpiValue}>{minScore}</Text>
        </View>
      </View>

      {/* Histórico de Scores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Histórico de Scores</Text>
        {progress.latest_scores.map((score, idx) => (
          <View key={idx} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Sesión {idx + 1}</Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${(score / 100) * 100}%`,
                    backgroundColor:
                      score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
        ))}
      </View>

      {/* Focos de Mejora */}
      {progress.focus_areas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Áreas de Mejora</Text>
          {progress.focus_areas.map((area, idx) => (
            <View key={idx} style={styles.focusItem}>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={styles.focusText}>{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Competencias (representación simplificada) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Competencias Evaluadas</Text>
        {['Architecture & Design', 'Technical Complexity', 'Communication', 'Problem-Solving'].map(
          (comp, idx) => (
            <View key={idx} style={styles.competencyRow}>
              <Text style={styles.competencyLabel}>{comp}</Text>
              <Text style={styles.competencyScore}>25%</Text>
            </View>
          )
        )}
      </View>
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
  kpiGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#0f172a',
    borderColor: '#1e3a8a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#a5f3fc',
    marginBottom: 4,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#67e8f9',
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  scoreLabel: {
    width: 60,
    color: '#cbd5e1',
    fontSize: 12,
  },
  scoreBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
  },
  scoreValue: {
    width: 30,
    textAlign: 'right',
    color: '#cbd5e1',
    fontSize: 12,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  focusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  focusText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
  },
  competencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  competencyLabel: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  competencyScore: {
    color: '#22c55e',
    fontWeight: '600',
  },
});
