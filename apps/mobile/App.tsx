import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function DashboardScreen() {
  const [apiMessage, setApiMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://127.0.0.1:3000/api/health');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setApiMessage(`API OK • ${data?.timestamp || ''}`);
      } catch (err: any) {
        setApiMessage(`API unreachable (${err?.message || 'error'})`);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>BuMood</Text>
        <Text style={styles.subtitle}>Dashboard (preview)</Text>

        {/* Simple cards */}
        <View style={styles.cardRow}>
          <View style={[styles.card, { borderColor: '#6366f1', marginRight: 12 }]}> 
            <Text style={styles.cardTitle}>Mood Composite</Text>
            <Text style={styles.cardValue}>--</Text>
          </View>
          <View style={[styles.card, { borderColor: '#10b981' }]}> 
            <Text style={styles.cardTitle}>DSS</Text>
            <Text style={styles.cardValue}>--</Text>
          </View>
        </View>

        <View style={[styles.card, { borderColor: '#f59e0b' }]}> 
          <Text style={styles.cardTitle}>API Status</Text>
          <Text style={styles.cardText}>{loading ? 'Checking...' : apiMessage}</Text>
        </View>

        <View style={{ height: 8 }} />
        <Button title="Tap me" onPress={() => console.log('Button tapped')} />
      </View>
      <StatusBar style="light" />
    </View>
  );
}

function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Placeholder</Text>
        <Text style={styles.subtitle}>Second screen</Text>
      </View>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [apiMessage, setApiMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://127.0.0.1:3000/api/health');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setApiMessage(`API OK • ${data?.timestamp || ''}`);
      } catch (err: any) {
        setApiMessage(`API unreachable (${err?.message || 'error'})`);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', contentStyle: { backgroundColor: '#0f172a' } }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Second" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  cardRow: {
    flexDirection: 'row',
    marginTop: 12,
    width: '100%',
    paddingHorizontal: 16
  },
  card: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  },
  cardTitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700'
  },
  cardText: {
    color: '#e5e7eb'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
