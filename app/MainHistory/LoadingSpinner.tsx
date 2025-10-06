// LoadingSpinner.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const LoadingSpinner: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3C97" />
      <Text style={styles.text}>Loading loan history...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: '#4a5568',
  },
});

export default LoadingSpinner;