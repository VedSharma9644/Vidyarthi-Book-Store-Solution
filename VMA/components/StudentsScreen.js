import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';
import { normalizeStudentsFromUser } from '../utils/students';
import { getGradeDisplayLabel } from '../utils/gradeUtils';

const StudentsScreen = ({ onTabPress, onBack, onGoToAddStudent }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      let userData = await ApiService.getUserData();
      const userId = userData?.id || (await AsyncStorage.getItem('userId'));
      if (userId) {
        const res = await ApiService.getUserById(userId);
        if (res?.success && res.data) {
          userData = res.data;
          await ApiService.storeUserData(res.data);
        }
      }
      setStudents(normalizeStudentsFromUser(userData));
    } catch (e) {
      console.error('StudentsScreen load:', e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDelete = (student) => {
    Alert.alert(
      'Remove student',
      `Remove ${student.name} from your profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const userData = await ApiService.getUserData();
              const userId = userData?.id || (await AsyncStorage.getItem('userId'));
              if (!userId || !userData) {
                Alert.alert('Error', 'Could not load your profile.');
                return;
              }
              const raw = Array.isArray(userData.students) ? userData.students : [];
              const next = raw.filter((s) => String(s?.id) !== String(student.id));
              const res = await ApiService.updateUserProfile(userId, { ...userData, students: next });
              if (res.success && res.data) {
                await ApiService.storeUserData(res.data);
              }
              await loadStudents();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Could not remove student.');
            }
          },
        },
      ]
    );
  };

  const subtitleFor = (s) => {
    const parts = [
      s.gradeLabel ? getGradeDisplayLabel(s.gradeLabel) : '',
      s.schoolLabel,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Tap to view';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.studentsHeader}>
        <View style={styles.studentsHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.studentsHeaderTitle}>Students</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.studentsMainContent} showsVerticalScrollIndicator={false}>
          <View style={styles.studentsContent}>
            {students.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🎓</Text>
                <Text style={{ color: colors.textPrimary || '#333', fontSize: 16, textAlign: 'center' }}>
                  No students added yet. Tap below to add a student for checkout.
                </Text>
              </View>
            ) : (
              students.map((student) => (
                <View key={student.id} style={[styles.studentCard, { flexDirection: 'row', alignItems: 'center' }]}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() =>
                      Alert.alert(student.name, subtitleFor(student), [{ text: 'OK' }])
                    }
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: '#e8eef9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                        {(student.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentDetails}>{subtitleFor(student)}</Text>
                    </View>
                    <Text style={styles.studentChevron}>›</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(student)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#c0392b', fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <View style={styles.studentsAddStudentButtonContainer}>
        <TouchableOpacity
          style={styles.studentsAddStudentButton}
          onPress={() => onGoToAddStudent && onGoToAddStudent()}
        >
          <Text style={styles.studentsAddStudentButtonIcon}>+</Text>
          <Text style={styles.studentsAddStudentButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default StudentsScreen;
