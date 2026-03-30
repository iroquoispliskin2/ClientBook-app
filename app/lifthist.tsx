import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Button } from "react-native";
import { getClients, getClientLifts, getLiftHistory, Client, LiftHistoryEntry } from '../database';

export default function LiftHist() {
  const { name } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [clientLifts, setClientLifts] = useState<{ lift_id: number; lift_name: string }[]>([]);
  const [selectedLift, setSelectedLift] = useState<{ lift_id: number; lift_name: string } | null>(null);
  const [history, setHistory] = useState<LiftHistoryEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const clients = getClients();
    const found = clients.find((c) => c.name === String(name));
    setClient(found || null);
    if (found) {
      setClientLifts(getClientLifts(found.id));
    }
  }, []);

  function handleLiftPress(lift: { lift_id: number; lift_name: string }) {
    if (!client) return;
    setSelectedLift(lift);
    setHistory(getLiftHistory(client.id, lift.lift_id));
    setModalVisible(true);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  if (!client) return <Text>Client not found.</Text>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ gap: 12, padding: 16 }}>
        {clientLifts.length === 0 && (
          <Text style={styles.empty}>No lifts recorded yet.</Text>
        )}
        {clientLifts.map((lift) => (
          <TouchableOpacity
            key={lift.lift_id}
            style={styles.liftButton}
            onPress={() => handleLiftPress(lift)}
          >
            <Text style={styles.liftName}>{lift.lift_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedLift?.lift_name}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {history.length === 0 && (
                <Text style={styles.empty}>No entries found.</Text>
              )}
              {history.map((entry) => (
                <View key={entry.id} style={styles.historyRow}>
                  <Text style={styles.dateText}>{formatDate(entry.recorded_at)}</Text>
                  <Text style={styles.statText}>{entry.weight ?? '—'} lbs</Text>
                  <Text style={styles.statText}>{entry.reps ?? '—'} reps</Text>
                  <Text style={styles.statText}>RPE {entry.rpe ?? '—'}</Text>
                </View>
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  liftButton: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
  },
  liftName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  empty: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 40,
    fontSize: 16,
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
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});