import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabNavigationProps {
  userId: string;
  currentTab: 'interview' | 'dashboard';
  onTabChange: (tab: 'interview' | 'dashboard') => void;
  onLogout: () => void;
}

export function TabNavigation({
  userId,
  currentTab,
  onTabChange,
  onLogout,
}: TabNavigationProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.username}>{userId}</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'interview' && styles.tabActive]}
          onPress={() => onTabChange('interview')}
        >
          <Text
            style={[styles.tabText, currentTab === 'interview' && styles.tabTextActive]}
          >
            🎤 Entrevista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, currentTab === 'dashboard' && styles.tabActive]}
          onPress={() => onTabChange('dashboard')}
        >
          <Text
            style={[styles.tabText, currentTab === 'dashboard' && styles.tabTextActive]}
          >
            📊 Progreso
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0b172a',
    borderBottomColor: '#1e3a5f',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    color: '#67e8f9',
    fontWeight: '600',
    minWidth: 100,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  tabText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
