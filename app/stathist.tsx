import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Button, Alert, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getClients, getBaselineStats, addBaselineStat, deleteBaselineStat, Client, BaselineStat } from '../database';

const screenWidth = Dimensions.get("window").width;

export default function StatHist() {
  const { name } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<BaselineStat[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'weight' | 'muscle' | 'body_fat'>('weight');

  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [muscle, setMuscle] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  useEffect(() => {
    const clients = getClients();
    const found = clients.find((c) => c.name === String(name));
    setClient(found || null);
    if (found) setStats(getBaselineStats(found.id));
  }, []);

  function toggleExpand(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd() {
    if (!client) return;
    try {
      addBaselineStat(
        client.id,
        weight ? Number(weight) : null,
        muscle ? Number(muscle) : null,
        bodyFat ? Number(bodyFat) : null,
        date || undefined
      );
      setStats(getBaselineStats(client.id));
    } catch (e) {
      console.log('insert failed:', e);
    }
    setModalVisible(false);
    setDate(''); setWeight(''); setMuscle(''); setBodyFat('');
  }

  function handleDelete(id: number) {
    Alert.alert("Delete Entry", "Remove this stat entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: () => {
          deleteBaselineStat(id);
          if (client) setStats(getBaselineStats(client.id));
        }
      }
    ]);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function formatShortDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // Build chart data from stats that have the selected metric
  const chartStats = stats.filter(s => s[activeMetric] != null);

  const chartData = chartStats.length >= 2 ? {
    labels: chartStats.map(s => formatShortDate(s.recorded_at)),
    datasets: [{
      data: chartStats.map(s => Number(s[activeMetric])),
      color: () => '#007AFF',
      strokeWidth: 2,
    }],
  } : null;

  const metricLabel = { weight: 'Weight (lbs)', muscle: 'Muscle (lbs)', body_fat: 'Body Fat (%)' }[activeMetric];

  if (!client) return <Text>Client not found.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: 12, padding: 16 }}>

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trend Over Time</Text>

          {/* Metric Toggle */}
          <View style={styles.toggleRow}>
            {(['weight', 'muscle', 'body_fat'] as const).map(metric => (
              <TouchableOpacity
                key={metric}
                style={[styles.toggleBtn, activeMetric === metric && styles.toggleBtnActive]}
                onPress={() => setActiveMetric(metric)}
              >
                <Text style={[styles.toggleText, activeMetric === metric && styles.toggleTextActive]}>
                  {metric === 'weight' ? 'Weight' : metric === 'muscle' ? 'Muscle' : 'Body Fat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {chartData ? (
            <LineChart
              data={chartData}
              width={screenWidth - 48}
              height={200}
              chartConfig={{
                backgroundColor: '#1a1a1a',
                backgroundGradientFrom: '#1a1a1a',
                backgroundGradientTo: '#2a2a2a',
                decimalPlaces: 1,
                color: () => '#007AFF',
                labelColor: () => '#aaa',
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#007AFF' },
              }}
              bezier
              style={{ borderRadius: 12, marginTop: 8 }}
            />
          ) : (
            <Text style={styles.chartEmpty}>
              {chartStats.length === 0
                ? `No ${metricLabel} data yet.`
                : 'Need at least 2 entries to show a trend.'}
            </Text>
          )}
        </View>

        {/* Stat Entries */}
        {stats.length === 0 && (
          <Text style={styles.empty}>No stats logged yet.</Text>
        )}
        {stats.map((stat) => {
          const isExpanded = expanded[stat.id];
          return (
            <View key={stat.id} style={styles.statBlock}>
              <TouchableOpacity onPress={() => toggleExpand(stat.id)} style={styles.statHeader}>
                <Text style={styles.dateText}>{formatDate(stat.recorded_at)}</Text>
                <Text style={styles.dateText}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {isExpanded && (
                <TouchableOpacity onLongPress={() => handleDelete(stat.id)}>
                  <View style={styles.statBody}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Weight</Text>
                      <Text style={styles.statValue}>{stat.weight ?? '—'} lbs</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Skeletal Muscle</Text>
                      <Text style={styles.statValue}>{stat.muscle ?? '—'} lbs</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Body Fat</Text>
                      <Text style={styles.statValue}>{stat.body_fat ?? '—'}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Stats</Text>
            <TextInput style={styles.input} placeholder="Date (e.g. 2026-03-27)" value={date} onChangeText={setDate} />
            <TextInput style={styles.input} placeholder="Weight (lbs)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            <TextInput style={styles.input} placeholder="Skeletal Muscle Mass (lbs)" keyboardType="numeric" value={muscle} onChangeText={setMuscle} />
            <TextInput style={styles.input} placeholder="Body Fat %" keyboardType="numeric" value={bodyFat} onChangeText={setBodyFat} />
            <Button title="Add" onPress={handleAdd} />
            <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
  },
  chartEmpty: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
    fontSize: 14,
  },
  statBlock: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 40,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    color: 'white',
    fontSize: 32,
    lineHeight: 34,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
});