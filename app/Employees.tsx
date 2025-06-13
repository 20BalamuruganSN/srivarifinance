import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
} from "react-native";
import { Avatar } from "react-native-paper";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useNavigation } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

import api from "./Api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Employees = () => {
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All"); // All, Active, Inactive
  const navigation = useNavigation();

  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      if (storedRole) {
        setRole(storedRole);
      }
    };
    fetchRole();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await api.get('/employees');
          if (Array.isArray(response.data.message)) {
            setData(response.data.message);
          } else {
            console.error("Expected an array but received:", response.data.message);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          alert("Failed to fetch data");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [role])
  );

  const handleNavigate = () => {
    router.replace('/CreateEmployees');
  };

  // Filter data based on search and status filter
const filteredData = (Array.isArray(data) ? data : []).filter((item) => {
  const name = (item.user_name || "").toLowerCase();
  const userId = (item.user_id || "").toString().toLowerCase(); // ensure string
  const status = (item.status || "").trim().toLowerCase();

  const searchLower = searchQuery.toLowerCase();
  // const matchesSearch = name.includes(searchQuery.toLowerCase());

const matchesSearch =
    name.includes(searchLower) || userId.includes(searchLower);

  const matchesFilter =
    filter === "All" ||
    (filter === "Active" && status === "active") ||
    (filter === "Inactive" && status === "inactive");

  return matchesSearch && matchesFilter;
});


  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate("EditEmployees", { id: item.user_id })}
    >
      {/* Profile picture with status dot */}
      <View style={styles.avatarContainer}>
        <Avatar.Image
          size={50}
          source={
            item.profile_photo
              ? { uri: item.profile_photo }
              : require("@/assets/images/customer.png")
          }
        />
        {/* Status Dot */}
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                item.status === "active"
                  ? "green"
                  : "yellow",
            },
          ]}
        />
      </View>
      {/* Name and role */}
      <View style={styles.textContainer}>
        <Text style={styles.profileText}>{item.user_name}</Text>
        <Text style={styles.userTypeText}>Employee</Text>
      </View>
      <AntDesign name="right" size={20} color="#07387A" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#001f3f" }}>
      <StatusBar barStyle="light-content" />

      <View style={styles.headerContainer}>
  <TouchableOpacity
    style={[
      styles.filterButton,
      filter === "All" ? styles.activeFilter : styles.inactiveFilter,
    ]}
    onPress={() => setFilter("All")}
  >
    <Text style={styles.filterText}>All Employees</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.filterButton,
      filter === "Active" ? styles.activeFilter : styles.inactiveFilter,
    ]}
    onPress={() => setFilter("Active")}
  >
    <Text style={styles.filterText}>Active</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.filterButton,
      filter === "Inactive" ? styles.activeFilter : styles.inactiveFilter,
    ]}
    onPress={() => setFilter("Inactive")}
  >
    <Text style={styles.filterText}>Inactive</Text>
  </TouchableOpacity>
</View>


      {/* Search and Add Button */}
      <View style={styles.searchAndButtonContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Enter employee name"
            style={styles.searchInput}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleNavigate}>
          <AntDesign name="addusergroup" size={24} color="white" />
        </TouchableOpacity>
      </View>

   
      {/* Employee List */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: 'white' }}>No employees found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Employees;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
  },
   filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  filterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activeFilter: {
       borderColor:'white',
      borderWidth:1,
    backgroundColor: '#07387A', 
  },
  inactiveFilter: {
     borderColor:'white',
      borderWidth:1,
    backgroundColor: '#FFC107', 
  },
  searchAndButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 20,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    marginRight: 10,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#07387A",
    borderRadius: 50,
    padding: 10,
  },
  list: {
    flex: 1,
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  avatarContainer: {
    position: "relative",
    width: 50,
    height: 50,
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  profileText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  userTypeText: {
    fontSize: 14,
    color: "#ccc",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
});

