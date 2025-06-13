import { View, Text, Image, StyleSheet, TouchableOpacity,ImageBackground ,StatusBar} from 'react-native';
import React from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import {  useRouter } from 'expo-router'
;
// import { StatusBar } from 'expo-status-bar';

const Welcome = () => {
  const router = useRouter();


  return (
    
    <View style={styles.container}>
      <StatusBar barStyle="light-content"  />
      <Image source={require('@/assets/images/Srivari.png')} style={styles.logo} resizeMode='contain' />
      <TouchableOpacity style={styles.button} onPress={()=>router.replace("Login" as never)}>
        <Text style={styles.buttonText}>Get Started</Text>
        <AntDesign name="arrowright" size={20} color="black" />
      </TouchableOpacity>
    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#07387A',
    marginBottom:0,
  },
  background: {
    // flex: 1, // Ensure it fills the entire container
    resizeMode: 'cover', // or 'contain' based on your needs
  },
  logo: {
    width: 260,
    height: 160,
    marginBottom: 30,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#E8B801',
    padding: 15,
    borderRadius: 20,
    width: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight:600,
  },
});


