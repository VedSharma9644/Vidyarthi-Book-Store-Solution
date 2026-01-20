import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const AddStudentScreen = ({ onTabPress, onBack }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    age: '',
    gender: '',
    school: '',
    schoolCode: '',
    class: '',
    classCode: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddStudent = () => {
    // Validate required fields
    if (!formData.studentName.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }
    if (!formData.age.trim()) {
      Alert.alert('Error', 'Please enter age');
      return;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Please select gender');
      return;
    }
    if (!formData.school.trim()) {
      Alert.alert('Error', 'Please enter school name');
      return;
    }
    if (!formData.schoolCode.trim()) {
      Alert.alert('Error', 'Please enter school code');
      return;
    }
    if (!formData.class.trim()) {
      Alert.alert('Error', 'Please enter class');
      return;
    }
    if (!formData.classCode.trim()) {
      Alert.alert('Error', 'Please enter class code');
      return;
    }

    // TODO: Implement actual add student logic
    Alert.alert(
      'Success',
      'Student added successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to students list
            if (onBack) {
              onBack();
            }
          },
        },
      ]
    );
  };

  const genderOptions = ['Select gender', 'Male', 'Female', 'Other'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.addStudentHeader}>
        <View style={styles.addStudentHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.addStudentHeaderTitle}>Add Student</Text>
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
          style={styles.addStudentMainContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.addStudentContent}>
          {/* Student Name */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Student Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter student name"
              value={formData.studentName}
              onChangeText={(value) => handleInputChange('studentName', value)}
            />
          </View>

          {/* Age */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Age</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter age"
              value={formData.age}
              onChangeText={(value) => handleInputChange('age', value)}
              keyboardType="numeric"
            />
          </View>

          {/* Gender */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Gender</Text>
            <TouchableOpacity
              style={styles.formSelect}
              onPress={() => {
                Alert.alert(
                  'Select Gender',
                  'Choose gender',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Male', onPress: () => handleInputChange('gender', 'Male') },
                    { text: 'Female', onPress: () => handleInputChange('gender', 'Female') },
                    { text: 'Other', onPress: () => handleInputChange('gender', 'Other') },
                  ]
                );
              }}
            >
              <Text style={[styles.formSelectText, !formData.gender && styles.formSelectPlaceholder]}>
                {formData.gender || 'Select gender'}
              </Text>
              <Text style={styles.formSelectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* School */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>School</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter school name"
              value={formData.school}
              onChangeText={(value) => handleInputChange('school', value)}
            />
          </View>

          {/* School Code */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>School Code</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter school code"
              value={formData.schoolCode}
              onChangeText={(value) => handleInputChange('schoolCode', value)}
            />
          </View>

          {/* Class */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Class</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter class"
              value={formData.class}
              onChangeText={(value) => handleInputChange('class', value)}
            />
          </View>

          {/* Class Code */}
          <View style={styles.formFieldContainer}>
            <Text style={styles.formLabel}>Class Code</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter class code"
              value={formData.classCode}
              onChangeText={(value) => handleInputChange('classCode', value)}
            />
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Student Button */}
      <View style={styles.addStudentButtonContainer}>
        <TouchableOpacity
          style={styles.addStudentButton}
          onPress={handleAddStudent}
        >
          <Text style={styles.addStudentButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default AddStudentScreen;
