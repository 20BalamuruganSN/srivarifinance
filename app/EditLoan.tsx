import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditLoan = () => {
  const { loanData } = useLocalSearchParams();
  const [loan, setLoan] = useState(null);

  // Parse loanData from navigation params and initialize state
  useEffect(() => {
    if (loanData) {
      try {
        const parsed = JSON.parse(loanData);
        setLoan({
          loan_id: parsed.loan_id || '',
          user_id: parsed.user_id || '',
          employee_id: parsed.employee_id || '',
          customer_name: parsed.customer_name || '',
          loan_amount: parsed.loan_amount || '',
          interest_percentage: parsed.interest_percentage || '',
          tenure_month: parsed.tenure_month?.toString() || '',
          loan_date: parsed.loan_date || '',
          loan_category: parsed.loan_category || '',
          total_amount: parsed.total_amount || '',
          status: parsed.status || '',
          loan_closed_date: parsed.loan_closed_date || '',
        });
      } catch (error) {
        console.error('JSON parse error:', error);
      }
    }
  }, [loanData]);

  if (!loan) return <Text>Loading...</Text>;

  const handleChange = (field, value) => {
    setLoan((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async () => {
     const token = await AsyncStorage.getItem('token');
  try {
    const response = await fetch(`http://192.168.1.20:8000/api/loans/${loan.loan_id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
   'Authorization':  `Bearer ${token}`,
  },
  body: JSON.stringify(loan),
});


    if (response.ok) {
      Alert.alert('Success', 'Loan updated successfully');
      router.replace('/ViewLoan');
    } else {
      Alert.alert('Error', 'Failed to update loan');
    }
  } catch (error) {
    console.error('Update error:', error);
    Alert.alert('Error', 'Something went wrong');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Edit Loan</Text>

      <TextInput style={styles.input} placeholder="Loan ID" value={loan.loan_id} editable={false} />
      <TextInput style={styles.input} placeholder="Customer Name" value={loan.customer_name} onChangeText={(val) => handleChange('customer_name', val)} />
      <TextInput style={styles.input} placeholder="User ID" value={loan.user_id} onChangeText={(val) => handleChange('user_id', val)} />
      <TextInput style={styles.input} placeholder="Employee ID" value={loan.employee_id} onChangeText={(val) => handleChange('employee_id', val)} />
      <TextInput style={styles.input} placeholder="Loan Amount" value={loan.loan_amount} keyboardType="numeric" onChangeText={(val) => handleChange('loan_amount', val)} />
      <TextInput style={styles.input} placeholder="Interest %" value={loan.interest_percentage} keyboardType="numeric" onChangeText={(val) => handleChange('interest_percentage', val)} />
      <TextInput style={styles.input} placeholder="Tenure (Months)" value={loan.tenure_month} keyboardType="numeric" onChangeText={(val) => handleChange('tenure_month', val)} />
      <TextInput style={styles.input} placeholder="Loan Category" value={loan.loan_category} onChangeText={(val) => handleChange('loan_category', val)} />
      <TextInput style={styles.input} placeholder="Loan Date (YYYY-MM-DD)" value={loan.loan_date} onChangeText={(val) => handleChange('loan_date', val)} />
      <TextInput style={styles.input} placeholder="Loan Closed Date" value={loan.loan_closed_date} onChangeText={(val) => handleChange('loan_closed_date', val)} />
      <TextInput style={styles.input} placeholder="Total Amount" value={loan.total_amount} keyboardType="numeric" onChangeText={(val) => handleChange('total_amount', val)} />
      <TextInput style={styles.input} placeholder="Status" value={loan.status} onChangeText={(val) => handleChange('status', val)} />

      <Button title="Update Loan" onPress={handleUpdate} />
    </ScrollView>
  );
};


export default EditLoan;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
});

