import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDB, resetDB } from "../database";


export default function RootLayout() {
  useEffect(() => {
    initDB();
  }, []);
  return (<Stack>
    <Stack.Screen
      name="index"
      options={{
        title: "Clients",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 25,
        },
        headerTintColor: "black",
        
        headerStyle: {
          backgroundColor: "grey",
          
        }
      }}
    />
      <Stack.Screen 
        name="details" 
        options={{ 
        title: "Client Info",
      headerBackButtonDisplayMode:"minimal",
    }}
    />
      <Stack.Screen
        name="workouts"
        options={{
          title:"Workouts"
        }}
    />
      <Stack.Screen
        name="lifthist"
        options={{
          title:"Lift History"
        }}  
    />
    <Stack.Screen
        name="stathist"
        options={{
          title:"Stat History"
        }}
    />

  </Stack>
  );
}
