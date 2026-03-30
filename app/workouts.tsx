import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, TextInput, View, Modal, Button } from "react-native";
import { getClients, getWorkoutSessions, deleteWorkoutSession, addWorkoutSession, Client, WorkoutSession } from '../database';

export default function Workouts() {
    const { name } = useLocalSearchParams();
    const [client, setClient] = useState<Client | null>(null);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const router = useRouter();

    function handleAddSession() {
        if (!client) return;
        addWorkoutSession(client.id, notes, date || undefined);
        setSessions(getWorkoutSessions(client.id));
        setModalVisible(false);
        setDate('');
        setNotes('');
    }

    useEffect(() => {
        const results = getClients();
        const found = results.find((c) => c.name === String(name));
        setClient(found || null);
        if (found) {
            setSessions(getWorkoutSessions(found.id))
        }
    }, []);

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

if (!client) return <Text>Client not found.</Text>

return (
    <View style={{ flex: 1}}>
        <ScrollView contentContainerStyle = {{gap:12, padding:16}}>
            {sessions.length === 0 && (
                <Text style={styles.empty}>No Workouts Logged Yet.</Text>
            )}
            {sessions.map((session) => (
                <TouchableOpacity 
                    key={session.id}
                    style={styles.sessionButton}
                    onPress={()=>router.push({ pathname: "/sessiondetail", params: {sessionID:session.id, name: name } })}
                >
                    <Text style={styles.dateText}>{formatDate(session.performed_at)}</Text>
                    {session.notes ? <Text style={styles.notesText}>{session.notes}</Text>:null}
                </TouchableOpacity>
            ))}
        </ScrollView>
        
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Workout</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Date (e.g. 2026-03-27"
                            value={date}
                            onChangeText={setDate}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Notes (optiona)"
                            value={notes}
                            onChangeText={setNotes}
                        />
                        <Button title="Add" onPress={handleAddSession} />
                        <Button title="Cancel" color = "red" onPress={()=> setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
    </View>
    );
}

const styles = StyleSheet.create({
    sessionButton: {
        backgroundColor: "grey",
        padding: 20,
        borderRadius: 16,
    },
    dateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    notesText: {
        fontSize: 14,
        color: 'gray',
        marginTop: 4,
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
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
      },
})