import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
 
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setImageUri(profile.imageUri || null);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const saveProfile = async (): Promise<void> => {
    // Save profile data to AsyncStorage
    try {
      const profileData = { name, email, phone, imageUri };
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      // Simulate async save delay if needed
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Profile saved', name);
          resolve();
        }, 1000);
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = { name: '', email: '', phone: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!email.includes('@')) {
      newErrors.email = 'Enter a valid email';
      valid = false;
    }

    if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone must be 10 digits';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const pickImage = async (type: any) => {
    let permissionResult;
    let result;

    if (type === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Allow access to camera to take photo');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Allow access to media library to select photo');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }

    setModalVisible(false);
  };

  // Your handleUpdate function
  const handleUpdate = async () => {
    console.log('Update button pressed');
    if (!validate()) return;

    try {
      await saveProfile();

      // Removed alert, directly route back
      router.replace('/'); 
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Something went wrong while updating profile.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
         <Text style={styles.title}>Profile</Text>
      </View>

      {/* Title */}
      
      

      <View style={styles.profileContainer}>
        {/* Profile Image with overlay camera icon */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.imageWrapper}>
          <View style={styles.avatarContainer}>
            <Image
              source={imageUri ? { uri: imageUri } : require('../assets/images/logo.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
            {/* Camera icon overlay */}
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Labels and Inputs with spacing */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={(text) => {
            if (text.length <= 10 && /^\d*$/.test(text)) {
              setPhone(text);
            }
          }}
          keyboardType="phone-pad"
        />
        {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

        {/* Update Button */}
        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for image options */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an Option</Text>
            <TouchableOpacity style={styles.optionButton} onPress={() => pickImage('camera')}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={() => pickImage('gallery')}>
              <Ionicons name="image" size={20} color="#fff" />
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;

// Your styles (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06387A', 
  },
  header: {
    padding:36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14274E',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    // textAlign:'center',
    bottom:-20,
    marginRight:180,
    // marginBottom: 10,
  },
  profileContainer: {
    // top:-55,
    alignItems: 'center',
    padding: 20,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#06387A',
    borderRadius: 20,
    padding: 4,
    elevation: 4,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    width: '90%',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Arial Rounded MT Bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  error: {
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginTop: 4,
    color: 'red',
    fontSize: 13,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#E8B801',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 20,
    shadowColor: '#E8B801',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(6, 56, 122, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#06387A',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06387A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
    width: '100%',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  cancelButton: {
    marginTop: 15,
  },
  cancelText: {
    fontSize: 16,
    color: '#ff4d4d',
    fontWeight: '600',
  },
});