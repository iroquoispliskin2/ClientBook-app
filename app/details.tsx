import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { getClients, removeClient, Client } from '../database';
import { useNavigation } from "expo-router";


export default function Details() {
    const {name} = useLocalSearchParams()
    const [client, setClients] = useState<Client | null>(null);
    const navigation = useNavigation();
    const router = useRouter();
    useEffect(()=> {
        const results = getClients();
        const found = results.find((c) => c.name === String(name));
        setClients(found || null);
    }, [])

    //delete button
    useEffect(() => {
      if (!client) return;
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete}>
            <Text style ={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        ),
      });
    }, [client]);

    function handleDelete() {
      Alert.alert(
        "Delete Client",
        'Are you sure you want to delete this client?',
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: ()=> {
              if (client?.id) removeClient(client.id);
              router.back();
            },
          },
        ]
      );
    }

    if (!client) return <Text>Client not found.</Text>

      //client info view
      return (
        <ScrollView contentContainerStyle={{ gap: 5, padding: 12 }}>
            <Text>--------------------------------------------------------------------------------------------</Text>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{client.name}</Text>
            <Text style={styles.label}>Phone No.</Text>
            <Text style={styles.value}>{client.phone}</Text>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{client.age}</Text>
            <Text style={styles.label}>Height</Text>
            <Text style={styles.value}>{client.height}</Text>
            <Text>--------------------------------------------------------------------------------------------</Text>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push({ pathname: "/workouts", params: { name: client.name } })}>
              <Text style={styles.navButtonText}>Workouts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push({ pathname: "/lifthist", params: { name: client.name } })}>
              <Text style={styles.navButtonText}>Lift History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push({ pathname: "/stathist", params: { name: client.name } })}>
              <Text style={styles.navButtonText}>Stat History</Text>
            </TouchableOpacity>

        </ScrollView>
)};

const styles = StyleSheet.create({
    label: {
      fontSize: 14,
      color: 'gray',
      textTransform: 'uppercase',
    },
    value: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    deleteButton: {
      color: 'red',
      backgroundColor: "#EB7146" +50,
      borderWidth: 1,
      borderColor: "red",
      textAlign: "center",
      borderRadius: 20,
      width: 80,
      height: 25,
      fontSize: 16,
      marginRight: 6,
      marginTop: 3,
    },
    navButton: {
      backgroundColor: "#B6E3BE",
      padding: 33,
      borderRadius: 16,
      marginTop: 8,
    },
    navButtonText: {
      fontSize: 38,
      fontWeight: "bold",
      color: "black",
      textAlign: "center"
    },
  });