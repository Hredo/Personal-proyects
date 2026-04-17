import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from './src/screens/HomeScreen';
import { InterviewScreen } from './src/screens/InterviewScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TabNavigation } from './src/components/TabNavigation';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'interview' | 'dashboard'>('interview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const stored = await AsyncStorage.getItem('userId');
        if (stored) {
          setUserId(stored);
        }
      } catch (err) {
        console.error('Error loading userId:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();
  }, []);

  const handleLogin = async (newUserId: string) => {
    try {
      await AsyncStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    } catch (err) {
      console.error('Error saving userId:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      setUserId(null);
      setCurrentTab('interview');
    } catch (err) {
      console.error('Error clearing userId:', err);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TabNavigation
        userId={userId}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={handleLogout}
      />
      <View style={styles.content}>
        {currentTab === 'interview' ? (
          <InterviewScreen userId={userId} />
        ) : (
          <DashboardScreen userId={userId} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});
