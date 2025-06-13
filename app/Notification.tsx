import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';



import { Badge } from 'react-native-paper';
import api from './Api';
import { router } from 'expo-router';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  created_at?: string;
  is_read: number;
  type?: string;
  updated_at?: string;
}

const Notification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/get_Notifications');
        console.log('notification full response:', response.data);
        const data = response.data;
        const notifList: NotificationItem[] = Array.isArray(data)
          ? data
          : data.data || [];
        console.log('parsed notifications:', notifList);
        setNotifications(notifList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
    
      await api.post(`/mark-as-read/${id}`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      // Adjust the API route to match your backend
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={{ position: 'relative' }}>
          <Ionicons name="notifications" size={30} color="#fff" />
          {unreadCount > 0 && (
            <Badge style={styles.badge}>{unreadCount}</Badge>
          )}
        </View>
      </View> */}

      <View style={styles.header}>
  <Text style={styles.title}>Notifications</Text>

  <View style={{ position: 'relative' }}>
    <Ionicons name="notifications" size={30} color="#fff" />
    {unreadCount > 0 && (
      <Badge style={styles.badge}>{unreadCount}</Badge>
    )}
  </View>
</View>


     
      {notifications.length === 0 ? (
        <Text style={styles.noNotification}>No notifications to show.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) =>
            `${item.id}-${item.type || 'type'}-${index}`
          }
          renderItem={({ item }) => {
            const isRead = item.is_read === 1;
            return (
              <View style={[styles.card, isRead && styles.readCard]}>
                <View style={styles.headerCard}>
                  <Text style={styles.titleCard}>{item.title}</Text>
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={isRead ? '#aaa' : '#1976d2'}
                  />
                </View>
                <Text style={styles.message}>{item.message}</Text>
                {item.created_at && (
                  <Text style={styles.timestamp}>
                    Created: {new Date(item.created_at).toLocaleString()}
                  </Text>
                )}
                <View style={styles.buttonsContainer}>
                  {!isRead && (
                    <TouchableOpacity
                      style={styles.markReadButton}
                      onPress={() => markAsRead(item.id)}
                    >
                      <Text style={styles.buttonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  )}
                 <TouchableOpacity
  style={styles.deleteButton}
  onPress={() => deleteNotification(item.id)}
>
  <Ionicons name="trash" size={24} color="red" />

</TouchableOpacity>


                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07387A', 
    padding: 16,
  },
  //  header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  // },
  // badge: {
  //   backgroundColor: '#ff3d00',
  //   color: '#fff',
  //   fontSize: 12,
  //   position: 'absolute',
  //   top: -5,
  //   right: -10,
  // },
  // title: {
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   color: '#ffffff',
  //   marginLeft:80,
  //   top:-30,
  //   marginBottom: 10,
  // },

  header: {
     padding:36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  backgroundColor: '#07387A', 
},

title: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#ffffff',
},

badge: {
  backgroundColor: '#ff3d00',
  color: '#fff',
  fontSize: 12,
  position: 'absolute',
  top: -5,
  right: -10,
  paddingHorizontal: 6,
  borderRadius: 8,
},

  noNotification: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#ccc',
  },
  card: {
    backgroundColor: '#14274E', 
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  readCard: {
    backgroundColor: '#1e3a66', // lighter version of card for read
  },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
 
  titleCard: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
   
  },
  message: {
    fontSize: 14,
    color: '#dbe9f4',
    marginTop: 5,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#b0bec5',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  markReadButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteButton: {
    // backgroundColor: '#e53935', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
