import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';

const SearchableDropdown = ({ items, placeholder, onItemSelect }) => {
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query) return items;
    
    return items.filter(item => {
      const searchStr = query.toLowerCase();
      const itemName = item.name ? item.name.toLowerCase() : '';
      const itemId = item.id ? item.id.toString() : '';
      
      return itemName.includes(searchStr) || itemId.includes(searchStr);
    });
  }, [query, items]);

  const handleItemSelect = (item) => {
    setQuery(item.name || item.id.toString());
    onItemSelect(item.id);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setModalVisible(true)}
          />
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContent}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => handleItemSelect(item)}
              >
                <Text style={styles.itemText}>
                  {item.name} ({item.id})
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.noResultsText}>No results found</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

// Usage in your component
const MyComponent = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    // other fields...
  });
  
  const [errors, setErrors] = useState({});
  


  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is filled
    if (value && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleItemSelect = (userId) => {
    handleInputChange("user_id", userId);
  };

  return (
    <View style={styles.container}>
      <SearchableDropdown
        items={customerdata}
        placeholder="Customer Name... or user ID"
        onItemSelect={handleItemSelect}
      />
      {errors.user_id ? (
        <Text style={styles.errorText}>{errors.user_id}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '50%',
    marginTop: 'auto',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 16,
    color: '#888',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
});

export default MyComponent;