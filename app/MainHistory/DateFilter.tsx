// components/DateFilter.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateFilterProps {
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
  onFilterClick: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ 
  fromDate, 
  toDate,
  onFromDateChange,
  onToDateChange,
  onFilterClick
}) => {
  const [showFromDatePicker, setShowFromDatePicker] = React.useState(false);
  const [showToDatePicker, setShowToDatePicker] = React.useState(false);

  const handleFromDateChange = (event: any, date?: Date) => {
    setShowFromDatePicker(false);
    if (date) {
      onFromDateChange(date);
    }
  };

  const handleToDateChange = (event: any, date?: Date) => {
    setShowToDatePicker(false);
    if (date) {
      onToDateChange(date);
    }
  };

  // ✅ Format date as DD-MM-YYYY
  const formatDate = (date?: Date) => {
    if (!date) return 'Select Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterGroup}>
        <View style={styles.filterContainer}>
          <View style={styles.labelContainer}>
            <MaterialIcons name="date-range" size={16} color="#F4C10F" />
            <Text style={styles.label}>From Date</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowFromDatePicker(true)}
          >
            <Text style={styles.yearText}>{formatDate(fromDate)}</Text>
            {showFromDatePicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleFromDateChange}
                maximumDate={toDate || new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.filterContainer}>
          <View style={styles.labelContainer}>
            <MaterialIcons name="date-range" size={16} color="#F4C10F" />
            <Text style={styles.label}>To Date</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowToDatePicker(true)}
          >
            <Text style={styles.yearText}>{formatDate(toDate)}</Text>
            {showToDatePicker && (
              <DateTimePicker
                value={toDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleToDateChange}
                maximumDate={new Date()}
                minimumDate={fromDate || new Date(1900, 0, 1)}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={onFilterClick}
        style={styles.filterButton}
        activeOpacity={0.8}
      >
        <MaterialIcons name="filter-list" size={18} color="#0D1B2A" />
        <Text style={styles.filterButtonText}>Apply Filter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  filterContainer: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#F4C10F',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#1E3C97',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#14274E',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  yearText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  picker: {
    height: 48,
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#14274E',
  },
  filterButton: {
    backgroundColor: '#F4C10F',
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  filterButtonText: {
    color: '#0D1B2A',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default DateFilter;
