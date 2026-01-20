import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const UpsertGradeScreen = ({ onTabPress, onBack, gradeId }) => {
  const [gradeName, setGradeName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = gradeId !== null && gradeId !== undefined;

  // Mock schools data - replace with API call later
  const mockSchools = [
    { id: 1, name: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 2, name: 'BLOOMING MINDS-KORUTLA-CBSE' },
    { id: 3, name: 'SRI CHAITANYA-JAGTIAL-STATE' },
  ];

  useEffect(() => {
    loadSchools();
    if (isEditMode) {
      loadGrade();
    }
  }, [gradeId]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiService.getAllSchools();
      // setSchools(response.data);
      
      // Using mock data for now
      setSchools(mockSchools);
    } catch (error) {
      Alert.alert('Error', 'Failed to load schools. Please try again.');
      console.error('Error loading schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGrade = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiService.getGradeById(gradeId);
      // setGradeName(response.data.name);
      // setSchoolId(response.data.schoolId);
      
      // Using mock data for now
      const mockGrade = {
        id: gradeId,
        name: `CLASS ${gradeId}`,
        schoolId: 1,
      };
      setGradeName(mockGrade.name);
      setSchoolId(mockGrade.schoolId.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to load grade. Please try again.');
      console.error('Error loading grade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!gradeName.trim()) {
      Alert.alert('Validation Error', 'Grade Name is required');
      return;
    }

    if (!schoolId) {
      Alert.alert('Validation Error', 'Please select a school');
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Replace with actual API call
      // const gradeData = {
      //   name: gradeName.trim(),
      //   schoolId: parseInt(schoolId),
      // };
      // if (isEditMode) {
      //   await apiService.updateGrade(gradeId, gradeData);
      // } else {
      //   await apiService.createGrade(gradeData);
      // }
      
      // Mock success
      Alert.alert(
        'Success',
        isEditMode ? 'Grade updated successfully' : 'Grade created successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onBack) {
                onBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save grade. Please try again.');
      console.error('Error saving grade:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.upsertGradeHeader}>
          <View style={styles.upsertGradeHeaderContent}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.upsertGradeHeaderTitle}>
              {isEditMode ? 'Edit Grade' : 'Add Grade'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <View style={styles.upsertGradeLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.upsertGradeLoadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.upsertGradeHeader}>
        <View style={styles.upsertGradeHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.upsertGradeHeaderTitle}>
            {isEditMode ? 'Edit Grade' : 'Add Grade'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.upsertGradeMainContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.upsertGradeContent}>
          {/* Grade Name Field */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Grade Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter grade name (e.g., CLASS 1, Grade 1)"
              placeholderTextColor={colors.gray500}
              value={gradeName}
              onChangeText={setGradeName}
              autoCapitalize="words"
            />
          </View>

          {/* School Selection Field */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>School *</Text>
            <View style={styles.upsertGradeSchoolSelectContainer}>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school.id}
                  style={[
                    styles.upsertGradeSchoolOption,
                    schoolId === school.id.toString() && styles.upsertGradeSchoolOptionSelected,
                  ]}
                  onPress={() => setSchoolId(school.id.toString())}
                >
                  <View style={styles.upsertGradeSchoolOptionContent}>
                    <View
                      style={[
                        styles.upsertGradeSchoolOptionRadio,
                        schoolId === school.id.toString() &&
                          styles.upsertGradeSchoolOptionRadioSelected,
                      ]}
                    />
                    <Text
                      style={[
                        styles.upsertGradeSchoolOptionText,
                        schoolId === school.id.toString() &&
                          styles.upsertGradeSchoolOptionTextSelected,
                      ]}
                    >
                      {school.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.upsertGradeButtonContainer}>
        <TouchableOpacity
          style={[
            styles.upsertGradeSubmitButton,
            submitting && styles.upsertGradeSubmitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.upsertGradeSubmitButtonText}>
              {isEditMode ? 'Update Grade' : 'Create Grade'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default UpsertGradeScreen;

