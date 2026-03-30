import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Button, Alert } from "react-native";
import { getSessionEntries, addSessionEntry, deleteSessionEntry, getLifts, getClients, SessionLiftEntry, Lift } from "@/database";

export default function SessionDetail() {
    const {sessionID, name} = useLocalSearchParams();
    const [entries, setEntries] = useState<SessionLiftEntry[]>([]);
    const [lifts, setLifts] = useState<Lift[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [clientId, setClientId] = useState<number | null>(null);

    const [selectedLift, setSelectedLift] = useState<Lift | null>(null);
    const [liftPickerVisible, setLiftPickerVisible] = useState(false);
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [rpe, setRpe] = useState('');

    const sid = Number(sessionID);

    useEffect(() => {
        const clients = getClients();
        const found = clients.find((c)=> c.name === String(name));
        if (found) setClientId(found.id);
        setEntries(getSessionEntries(sid));
        const allLifts = getLifts();
        setLifts(allLifts.sort((a,b)=>a.name.localeCompare(b.name)));
    }, []);

    function toggleExpand(lift_id: number) {
        setExpanded((prev) => ({...prev, [lift_id]: !prev[lift_id]}));
    }

    function handleAdd() {
        if (!selectedLift || clientId === null) return;
        addSessionEntry(
            sid, 
            clientId,
            selectedLift.id,
            weight ? Number(weight) : null,
            reps ? Number(reps) : null,
            rpe ? Number(rpe) : null, 
        );
        setEntries(getSessionEntries(sid));
        setModalVisible(false);
        setSelectedLift(null);
        setWeight('');
        setReps('');
        setRpe('');
    }

    function handleDelete(id: number) {
        Alert.alert("Delete Set", "Remove this set?", [
            { text: "Cancel", style: "cancel"},
            {
                text: "Delete", style: "destructive", onPress: () => {
                    deleteSessionEntry(id);
                    setEntries(getSessionEntries(sid));
                }
            }
        ]);
    }

    const grouped = entries.reduce<Record<number, SessionLiftEntry[]>>((acc, entry) => {
        if (!acc[entry.lift_id]) acc[entry.lift_id] = [];
        acc[entry.lift_id].push(entry);
        return acc;
    }, {});

    return (
        <View style={{flex: 1}}>
            <ScrollView contentContainerStyle= {{ gap: 12, padding: 16}}>
                {Object.keys(grouped).length === 0 && (
                    <Text style={styles.empty}>No exercises logged yet.</Text>
                )}
                {Object.values(grouped).map((sets) => {
                    const lift_id = sets[0].lift_id;
                    const lift_name = sets[0].lift_name;
                    const isExpanded = expanded[lift_id];
                    return (
                        <View key={lift_id} style={styles.liftBlock}>
                            <TouchableOpacity onPress={() => toggleExpand(lift_id)} style={styles.liftHeader}>
                                <Text style={styles.liftName}>{lift_name}</Text>
                                <Text style={styles.liftName}>{isExpanded ? '▲' : '▼'}</Text>
                            </TouchableOpacity>
                            {isExpanded && sets.map((set, index) => (
                                <TouchableOpacity key={set.id} onLongPress={() => handleDelete(set.id)}>
                                    <View style={styles.setRow}>
                                        <Text style={styles.setLabel}>Set {index + 1}</Text>
                                        <Text style={styles.setText}>{set.weight ?? '-'} lbs</Text>
                                        <Text style={styles.setText}>{set.reps ?? '-'} reps</Text>
                                        <Text style={styles.setText}> RPE {set.rpe ?? '-'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}

                        </View>
                    );
                })}
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={()=>setModalVisible(true)}>
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style = {styles.modalTitle}>Log a set</Text>
                        <TouchableOpacity style={styles.input} onPress = {()=> setLiftPickerVisible(true)}>
                            <Text style={{ fontSize: 16, color: selectedLift ? 'black' : '#aaa'}}>
                                {selectedLift ? selectedLift.name : 'Select Movement'}
                            </Text>
                        </TouchableOpacity>

                        <TextInput style={styles.input} placeholder="Weight (lbs)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
                        <TextInput style={styles.input} placeholder="Reps" keyboardType="numeric" value={reps} onChangeText={setReps} />
                        <TextInput style={styles.input} placeholder="RPE (1-10)" keyboardType="numeric" value={rpe} onChangeText={setRpe} />

                        <Button title="Add Set" onPress={handleAdd} />
                        <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            <Modal visible={liftPickerVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Movement</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {lifts.map((lift) => (
                                <TouchableOpacity key={lift.id} style ={styles.liftOption} onPress={() => {
                                setSelectedLift(lift);
                                setLiftPickerVisible(false);
                                }}>
                                    <Text style={styles.liftOptionText}>{lift.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button title="Cancel" color="red" onPress={() => setLiftPickerVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    liftBlock: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        overflow: 'hidden',
    },
    liftHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    liftName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    setRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#444',
      },
      setLabel: {
        color: '#aaa',
        fontSize: 14,
        width: 50,
      },
      setText: {
        color: 'white',
        fontSize: 14,
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
      liftOption: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      liftOptionText: {
        fontSize: 16,
      },
});