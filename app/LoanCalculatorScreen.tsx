// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Dimensions,
//   Alert,
// } from 'react-native';

// const { width } = Dimensions.get('window');

// const SimpleInterestCalculator = () => {
//   const [principal, setPrincipal] = useState('');
//   const [rate, setRate] = useState('');
//   const [time, setTime] = useState('');
//   const [interest, setInterest] = useState(null);
//   const [totalAmount, setTotalAmount] = useState(null);
//   const [monthlyDue, setMonthlyDue] = useState(null);

//   const calculateInterest = () => {
//     // Validate inputs
//     if (!principal || !rate || !time) {
//       Alert.alert('Error', 'Please fill all fields');
//       return;
//     }

//     const p = parseInt(principal);
//     const r = parseInt(rate);
//     const t = parseInt(time);

//     if (isNaN(p) || isNaN(r) || isNaN(t)) {
//       Alert.alert('Error', 'Please enter valid numbers');
//       return;
//     }

//     if (p <= 0 || r <= 0 || t <= 0) {
//       Alert.alert('Error', 'Values must be greater than zero');
//       return;
//     }

//     // Calculate simple interest: (P * R * T) / 100
//     const simpleInterest = Math.floor((p * r * t) / 100);
//     const amount = p + simpleInterest;
//     const monthlyPayment = Math.ceil(amount / (t * 12));

//     setInterest(simpleInterest);
//     setTotalAmount(amount);
//     setMonthlyDue(monthlyPayment);
//   };

//   const resetCalculator = () => {
//     setPrincipal('');
//     setRate('');
//     setTime('');
//     setInterest(null);
//     setTotalAmount(null);
//     setMonthlyDue(null);
//   };

//   // Format currency with INR symbol and commas
//   const formatCurrency = (value) => {
//     return `₹${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Simple Interest Calculator</Text>
//           <Text style={styles.subtitle}>Calculate interest in Indian Rupees (INR)</Text>
//         </View>

//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Enter Details</Text>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Principal Amount (₹)</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter amount"
//               keyboardType="numeric"
//               value={principal}
//               onChangeText={setPrincipal}
//               placeholderTextColor="#999"
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Interest Rate (% per year)</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter rate"
//               keyboardType="numeric"
//               value={rate}
//               onChangeText={setRate}
//               placeholderTextColor="#999"
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Time Period (years)</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter years"
//               keyboardType="numeric"
//               value={time}
//               onChangeText={setTime}
//               placeholderTextColor="#999"
//             />
//           </View>

//           <View style={styles.buttonContainer}>
//             <TouchableOpacity style={styles.calculateButton} onPress={calculateInterest}>
//               <Text style={styles.buttonText}>Calculate</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
//               <Text style={styles.resetButtonText}>Reset</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {interest !== null && totalAmount !== null && monthlyDue !== null && (
//           <View style={styles.resultCard}>
//             <Text style={styles.resultTitle}>Calculation Results</Text>
            
//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Principal Amount:</Text>
//               <Text style={styles.resultValue}>{formatCurrency(parseInt(principal))}</Text>
//             </View>
            
//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Interest Rate:</Text>
//               <Text style={styles.resultValue}>{rate}% per year</Text>
//             </View>
            
//             <View style={styles.resultRow}>
//               <Text style={styles.resultLabel}>Time Period:</Text>
//               <Text style={styles.resultValue}>{time} years</Text>
//             </View>
            
//             <View style={styles.divider} />
            
//             <View style={styles.resultRow}>
//               <Text style={styles.interestLabel}>Simple Interest:</Text>
//               <Text style={styles.interestValue}>{formatCurrency(interest)}</Text>
//             </View>
            
//             <View style={styles.resultRow}>
//               <Text style={styles.totalLabel}>Total Amount:</Text>
//               <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
//             </View>

//             <View style={styles.monthlyDueContainer}>
//               <Text style={styles.monthlyDueLabel}>Monthly Due Amount:</Text>
//               <Text style={styles.monthlyDueValue}>{formatCurrency(monthlyDue)}</Text>
//             </View>
//           </View>
//         )}

//         <View style={styles.infoCard}>
//           <Text style={styles.infoTitle}>About Simple Interest</Text>
//           <Text style={styles.infoText}>
//             Simple Interest is calculated using the formula:{'\n'}
//             <Text style={styles.formula}>I = P × R × T / 100</Text>{'\n\n'}
//             Where:{'\n'}
//             • P = Principal amount (₹){'\n'}
//             • R = Rate of interest per year (%){'\n'}
//             • T = Time period in years{'\n\n'}
//             Monthly Due = Total Amount / (Years × 12)
//           </Text>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f0f4f8',
//   },
//   scrollContainer: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 25,
//     marginTop: 10,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: '800',
//     color: '#2d3748',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#718096',
//     textAlign: 'center',
//   },
//   card: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 24,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   cardTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#2d3748',
//     marginBottom: 20,
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#4a5568',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#f7fafc',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderRadius: 12,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     color: '#2d3748',
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 10,
//   },
//   calculateButton: {
//     flex: 1,
//     backgroundColor: '#4299e1',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   resetButton: {
//     flex: 1,
//     backgroundColor: '#e2e8f0',
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//     marginLeft: 10,
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   resetButtonText: {
//     color: '#4a5568',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   resultCard: {
//     backgroundColor: '#4299e1',
//     borderRadius: 16,
//     padding: 24,
//     marginBottom: 24,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   resultTitle: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: 'white',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   resultRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 8,
//   },
//   resultLabel: {
//     fontSize: 16,
//     color: 'white',
//     opacity: 0.9,
//   },
//   resultValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: 'white',
//   },
//   interestLabel: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: 'white',
//   },
//   interestValue: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: 'white',
//   },
//   totalLabel: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: 'white',
//   },
//   totalValue: {
//     fontSize: 20,
//     fontWeight: '800',
//     color: 'white',
//   },
//   monthlyDueContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     borderRadius: 12,
//     padding: 16,
//     marginTop: 16,
//     alignItems: 'center',
//   },
//   monthlyDueLabel: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: 'white',
//     marginBottom: 8,
//   },
//   monthlyDueValue: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: 'white',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     marginVertical: 16,
//   },
//   infoCard: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 20,
//     marginTop: 10,
//   },
//   infoTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#2d3748',
//     marginBottom: 12,
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#718096',
//     lineHeight: 22,
//   },
//   formula: {
//     fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
//     fontWeight: '600',
//     color: '#4299e1',
//   },
// });

// export default SimpleInterestCalculator;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

const SimpleInterestCalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [interest, setInterest] = useState(null);
  const [totalAmount, setTotalAmount] = useState(null);
  const [monthlyDue, setMonthlyDue] = useState(null);

  const calculateInterest = () => {
    // Validate inputs
    if (!principal || !rate || !time) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const p = parseInt(principal);
    const r = parseFloat(rate);
    const t = parseInt(time);

    if (isNaN(p) || isNaN(r) || isNaN(t)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (p <= 0 || r <= 0 || t <= 0) {
      Alert.alert('Error', 'Values must be greater than zero');
      return;
    }

    // Calculate simple interest for months: (P * R * T) / (100 * 12)
    const simpleInterest = Math.floor((p * r * t) / (100 * 12));
    const amount = p + simpleInterest;
    const monthlyPayment = Math.ceil(amount / t);

    setInterest(simpleInterest);
    setTotalAmount(amount);
    setMonthlyDue(monthlyPayment);
  };

  const resetCalculator = () => {
    setPrincipal('');
    setRate('');
    setTime('');
    setInterest(null);
    setTotalAmount(null);
    setMonthlyDue(null);
  };

  // Format currency with INR symbol and commas
  const formatCurrency = (value) => {
    return `₹${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Simple Interest Calculator</Text>
          <Text style={styles.subtitle}>Calculate interest in Indian Rupees (INR)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Principal Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={principal}
              onChangeText={setPrincipal}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Interest Rate (% per year)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter rate"
              keyboardType="numeric"
              value={rate}
              onChangeText={setRate}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Time Period (months)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter months"
              keyboardType="numeric"
              value={time}
              onChangeText={setTime}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.calculateButton} onPress={calculateInterest}>
              <Text style={styles.buttonText}>Calculate</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {interest !== null && totalAmount !== null && monthlyDue !== null && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Calculation Results</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Principal Amount:</Text>
              <Text style={styles.resultValue}>{formatCurrency(parseInt(principal))}</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Interest Rate:</Text>
              <Text style={styles.resultValue}>{rate}% per year</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Time Period:</Text>
              <Text style={styles.resultValue}>{time} months</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.resultRow}>
              <Text style={styles.interestLabel}>Simple Interest:</Text>
              <Text style={styles.interestValue}>{formatCurrency(interest)}</Text>
            </View>
            
            <View style={styles.resultRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
            </View>

            <View style={styles.monthlyDueContainer}>
              <Text style={styles.monthlyDueLabel}>Monthly Payment:</Text>
              <Text style={styles.monthlyDueValue}>{formatCurrency(monthlyDue)}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Simple Interest (Monthly)</Text>
          <Text style={styles.infoText}>
            Simple Interest for months is calculated using the formula:{'\n'}
            <Text style={styles.formula}>I = P × R × T / (100 × 12)</Text>{'\n\n'}
            Where:{'\n'}
            • P = Principal amount (₹){'\n'}
            • R = Rate of interest per year (%){'\n'}
            • T = Time period in months{'\n\n'}
            Monthly Payment = Total Amount / T
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#2d3748',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calculateButton: {
    flex: 1,
    backgroundColor: '#4299e1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  resetButtonText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#4299e1',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  resultLabel: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  interestLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  interestValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  monthlyDueContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  monthlyDueLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  monthlyDueValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 22,
  },
  formula: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '600',
    color: '#4299e1',
  },
});

export default SimpleInterestCalculator;