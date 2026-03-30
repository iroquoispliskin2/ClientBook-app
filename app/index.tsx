import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Modal, TextInput, Button, RefreshControl } from "react-native";
import { useEffect, useState } from 'react';
import { getClients, addClient, addLift, Client, resetDB } from '../database';
import { useNavigation } from "expo-router";

export default function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [liftModalVisible, setLiftModalVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [liftName, setLiftName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setLiftModalVisible(true)} style={{ marginRight: 16 }}>
          <Text style={styles.headerPlus}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadClients();
    setRefreshing(false);
  }

  function loadClients() {
    try {
      const results = getClients();
      setClients(results);
    } catch (e) {
      console.log(e);
    }
  }

  function handleAddClient() {
    try {
      addClient(name, phone, Number(age), height);
      setModalVisible(false);
      setName('');
      setPhone('');
      setAge('');
      setHeight('');
      loadClients();
    } catch (e) {
      console.log(e);
    }
  }

  function handleAddLift() {
    if (!liftName.trim()) return;
    try {
      addLift(liftName.trim());
      setLiftName('');
      setLiftModalVisible(false);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        contentContainerStyle={{ gap: 16, padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#B6E3BE" />}
      >
        {clients.map((client) => (
          <Link
            key={client.name}
            href={{ pathname: "/details", params: { name: client.name } }}
            style={{ backgroundColor: 'grey', padding: 30, borderRadius: 20 }}
          >
            <View>
              <Text style={styles.name}>{client.name}</Text>
            </View>
          </Link>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Client Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Client</Text>
            <TextInput style={styles.input} placeholder='Name' value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder='Phone' value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder='Age' value={age} onChangeText={setAge} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder='Height' value={height} onChangeText={setHeight} />
            <Button title='Add Client' onPress={handleAddClient} />
            <Button title='Cancel' color='red' onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      {/* Add Lift Modal */}
      <Modal visible={liftModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Lift</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g. Bench Press'
              value={liftName}
              onChangeText={setLiftName}
            />
            <Button title='Add Lift' onPress={handleAddLift} />
            <Button title='Cancel' color='red' onPress={() => setLiftModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
    color: "black"
  },
  headerPlus: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
});