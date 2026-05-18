import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';
import { newStudentId } from '../utils/students';
import { getGradeDisplayLabel } from '../utils/gradeUtils';

const AddStudentScreen = ({ onTabPress, onBack }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    age: '',
    gender: '',
    school: '', // schoolLabel (display)
    classGrade: '',
  });
  const [saving, setSaving] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [isSearchingSchools, setIsSearchingSchools] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null); // { id, name, code? }
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [grades, setGrades] = useState([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null); // { id, name }
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const runSchoolSearch = async (q) => {
    const query = String(q || '').trim();
    setSchoolQuery(query);
    setSelectedSchool(null);
    if (!query) {
      setSchoolResults([]);
      return;
    }
    try {
      setIsSearchingSchools(true);
      const res = await ApiService.searchSchools(query, 20);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((s) => ({
          id: String(s.id || ''),
          name: String(s.name || s.schoolName || '').trim(),
          code: String(s.code || s.schoolCode || '').trim(),
        })).filter((s) => s.id && s.name);
        setSchoolResults(mapped);
      } else {
        setSchoolResults([]);
      }
    } catch (e) {
      console.warn('School search failed:', e?.message);
      setSchoolResults([]);
    } finally {
      setIsSearchingSchools(false);
    }
  };

  const loadGradesForSchool = async (schoolId) => {
    const sid = String(schoolId || '').trim();
    if (!sid) {
      setGrades([]);
      return;
    }
    try {
      setIsLoadingGrades(true);
      const res = await ApiService.getGradesBySchoolId(sid);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data
          .map((g) => ({
            id: String(g.id || ''),
            name: String(g.name || '').trim(),
          }))
          .filter((g) => g.id && g.name);
        setGrades(mapped);
      } else {
        setGrades([]);
      }
    } catch (e) {
      console.warn('Load grades failed:', e?.message);
      setGrades([]);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const handleAddStudent = async () => {
    if (!formData.studentName.trim()) {
      Alert.alert('Error', 'Please enter the student name');
      return;
    }

    try {
      setSaving(true);
      const userData = await ApiService.getUserData();
      const userId = userData?.id || (await AsyncStorage.getItem('userId'));
      if (!userId || !userData) {
        Alert.alert('Error', 'Please log in again.');
        return;
      }

      const raw = Array.isArray(userData.students) ? [...userData.students] : [];
      const newRecord = {
        id: newStudentId(),
        name: formData.studentName.trim(),
        age: formData.age.trim() || '',
        gender: formData.gender.trim() || '',
        schoolLabel: formData.school.trim() || '',
        gradeLabel: formData.classGrade.trim() || '',
        schoolId: selectedSchool?.id ? String(selectedSchool.id) : '',
        schoolCode: selectedSchool?.code ? String(selectedSchool.code) : '',
        gradeId: selectedGrade?.id ? String(selectedGrade.id) : '',
      };
      raw.push(newRecord);

      const res = await ApiService.updateUserProfile(userId, { ...userData, students: raw });
      if (!res.success) {
        Alert.alert('Error', res.message || 'Could not save student');
        return;
      }
      if (res.data) {
        await ApiService.storeUserData(res.data);
      } else {
        const merged = { ...userData, students: raw };
        await ApiService.storeUserData(merged);
      }

      Alert.alert('Success', 'Student added successfully.', [
        {
          text: 'OK',
          onPress: () => onBack && onBack(),
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || e.message || 'Could not save student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.addStudentHeader}>
        <View style={styles.addStudentHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.addStudentHeaderTitle}>Add Student</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.addStudentMainContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.addStudentContent}>
            <View style={styles.formFieldContainer}>
              <Text style={styles.formLabel}>Student name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Full name"
                value={formData.studentName}
                onChangeText={(value) => handleInputChange('studentName', value)}
              />
            </View>

            <View style={styles.formFieldContainer}>
              <Text style={styles.formLabel}>School (optional)</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={() => {
                  setShowSchoolPicker(true);
                  setSchoolQuery(formData.school || '');
                  setSchoolResults([]);
                  if (formData.school) {
                    runSchoolSearch(formData.school);
                  }
                }}
              >
                <Text style={[styles.formSelectText, !formData.school && styles.formSelectPlaceholder]}>
                  {formData.school || 'Tap to select school'}
                </Text>
                <Text style={styles.formSelectArrow}>▼</Text>
              </TouchableOpacity>
              {selectedSchool?.code ? (
                <Text style={{ marginTop: 6, color: colors.textSecondary, fontSize: 12 }}>
                  Code: {selectedSchool.code}
                </Text>
              ) : null}
            </View>

            <View style={styles.formFieldContainer}>
              <Text style={styles.formLabel}>Grade (optional)</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={async () => {
                  if (!selectedSchool?.id) {
                    Alert.alert('Select school first', 'Please select a school to load grades.');
                    return;
                  }
                  setShowGradePicker(true);
                  await loadGradesForSchool(selectedSchool.id);
                }}
              >
                <Text style={[styles.formSelectText, !formData.classGrade && styles.formSelectPlaceholder]}>
                  {formData.classGrade ? getGradeDisplayLabel(formData.classGrade) : 'Tap to select grade'}
                </Text>
                <Text style={styles.formSelectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formFieldContainer}>
              <Text style={styles.formLabel}>Age (optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Age"
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formFieldContainer}>
              <Text style={styles.formLabel}>Gender (optional)</Text>
              <TouchableOpacity
                style={styles.formSelect}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={[styles.formSelectText, !formData.gender && styles.formSelectPlaceholder]}>
                  {formData.gender || 'Tap to select'}
                </Text>
                <Text style={styles.formSelectArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* School Picker Modal */}
      <Modal
        visible={showSchoolPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSchoolPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <View style={styles.addressSelectionModalContent}>
              <View style={styles.addressModalHeader}>
                <Text style={styles.addressModalTitle}>Select School</Text>
                <TouchableOpacity onPress={() => setShowSchoolPicker(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Search by school name or code"
                  value={schoolQuery}
                  autoCapitalize="none"
                  onChangeText={(t) => runSchoolSearch(t)}
                />
              </View>

              <ScrollView style={styles.addressSelectionModalBody} showsVerticalScrollIndicator={false}>
                {isSearchingSchools ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ marginTop: 12, color: colors.textSecondary }}>Searching…</Text>
                  </View>
                ) : schoolResults.length === 0 ? (
                  <View style={{ padding: 24 }}>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                      {schoolQuery ? 'No schools found. Try another search.' : 'Type to search schools.'}
                    </Text>
                  </View>
                ) : (
                  schoolResults.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.addressSelectionCard}
                      onPress={() => {
                        setSelectedSchool(s);
                        setSelectedGrade(null);
                        handleInputChange('school', s.name);
                        handleInputChange('classGrade', '');
                        setShowSchoolPicker(false);
                      }}
                    >
                      <View style={styles.addressSelectionCardContent}>
                        <Text style={styles.addressSelectionCardName}>{s.name}</Text>
                        <Text style={styles.addressSelectionCardAddress}>
                          {s.code ? `Code: ${s.code}` : ' '}
                        </Text>
                      </View>
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>›</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Grade Picker Modal */}
      <Modal
        visible={showGradePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGradePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <View style={styles.addressSelectionModalContent}>
              <View style={styles.addressModalHeader}>
                <Text style={styles.addressModalTitle}>Select Grade</Text>
                <TouchableOpacity onPress={() => setShowGradePicker(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.addressSelectionModalBody} showsVerticalScrollIndicator={false}>
                {isLoadingGrades ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading grades…</Text>
                  </View>
                ) : grades.length === 0 ? (
                  <View style={{ padding: 24 }}>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                      No grades found for this school.
                    </Text>
                  </View>
                ) : (
                  grades.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.addressSelectionCard,
                        selectedGrade?.id === g.id && styles.addressSelectionCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedGrade(g);
                        handleInputChange('classGrade', g.name);
                        setShowGradePicker(false);
                      }}
                    >
                      <View style={styles.addressSelectionCardContent}>
                        <Text style={styles.addressSelectionCardName}>{getGradeDisplayLabel(g.name)}</Text>
                      </View>
                      {selectedGrade?.id === g.id && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <View style={styles.addressSelectionModalContent}>
              <View style={styles.addressModalHeader}>
                <Text style={styles.addressModalTitle}>Select Gender</Text>
                <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.addressSelectionModalBody} showsVerticalScrollIndicator={false}>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.addressSelectionCard,
                      formData.gender === g && styles.addressSelectionCardSelected,
                    ]}
                    onPress={() => {
                      handleInputChange('gender', g);
                      setShowGenderPicker(false);
                    }}
                  >
                    <View style={styles.addressSelectionCardContent}>
                      <Text style={styles.addressSelectionCardName}>{g}</Text>
                    </View>
                    {formData.gender === g && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIndicatorText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {formData.gender ? (
                  <TouchableOpacity
                    style={[styles.addressSelectionCard, { marginTop: 8 }]}
                    onPress={() => {
                      handleInputChange('gender', '');
                      setShowGenderPicker(false);
                    }}
                  >
                    <View style={styles.addressSelectionCardContent}>
                      <Text style={[styles.addressSelectionCardName, { color: '#c0392b' }]}>
                        Clear selection
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <View style={styles.addStudentButtonContainer}>
        <TouchableOpacity
          style={[styles.addStudentButton, saving && { opacity: 0.7 }]}
          onPress={handleAddStudent}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.addStudentButtonText}>Save student</Text>
          )}
        </TouchableOpacity>
      </View>

      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default AddStudentScreen;
