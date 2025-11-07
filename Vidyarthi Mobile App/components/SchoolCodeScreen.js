import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const SchoolCodeScreen = ({ onTabPress, onBack }) => {
  const [schoolCode, setSchoolCode] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0));

  const allSchools = [
    { code: 'SCH-12345', name: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE' },
    { code: 'SCH-67890', name: 'BLOOMING MINDS-KORUTLA-CBSE' },
    { code: 'SCH-11111', name: 'SRI CHAITANYA-JAGTIAL-STATE' },
    { code: 'SCH-22222', name: 'KAKATIYA-KARIMNAGAR-ICSE' },
    { code: 'SCH-33333', name: 'VIVEKANANDA-GODAVARIKHANI-STATE' },
    { code: 'SCH-44444', name: 'APEX E-TECHNO-PEDDAPALLI-CBSE' },
    { code: 'SCH-55555', name: 'DELHI PUBLIC SCHOOL-HYDERABAD-CBSE' },
    { code: 'SCH-66666', name: 'CHINMAYA VIDYALAYA-BANGALORE-ICSE' },
    { code: 'SCH-77777', name: 'KENDRIYA VIDYALAYA-MUMBAI-CBSE' },
    { code: 'SCH-88888', name: 'DAV PUBLIC SCHOOL-CHENNAI-CBSE' },
  ];

  useEffect(() => {
    // Fade in animation on component mount
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCodeChange = (text) => {
    setSchoolCode(text);
    
    if (text.length > 0) {
      const filtered = allSchools.filter(school => 
        school.code.toLowerCase().includes(text.toLowerCase()) ||
        school.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSchools(filtered);
      setShowDropdown(true);
      
      // Animate dropdown opening
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setShowDropdown(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSchoolSelect = (school) => {
    setSchoolCode(school.code);
    setShowDropdown(false);
    setFilteredSchools([]);
    
    // Animate dropdown closing
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Show selection feedback
    Alert.alert('School Selected', `You selected: ${school.name}`);
  };

  const handleContinue = () => {
    if (!schoolCode.trim()) {
      Alert.alert('Error', 'Please enter a school code');
      return;
    }
    
    // Find the selected school
    const selectedSchool = allSchools.find(school => school.code === schoolCode);
    if (selectedSchool) {
      Alert.alert('Success', `Proceeding with: ${selectedSchool.name}`);
      // TODO: Navigate to next screen
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid school code');
    }
  };

  const dropdownHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(filteredSchools.length * 60, 300)],
  });

  const dropdownOpacity = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnimation }]}>
      {/* Header */}
      <View style={styles.schoolCodeHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.schoolCodeHeaderTitle}>School Code</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.schoolCodeMainContent}>
        <View style={styles.schoolCodeContainer}>
          <Text style={styles.schoolCodeTitle}>Enter your school code</Text>
          <Text style={styles.schoolCodeSubtitle}>
            Please enter the code provided by your school to continue.
          </Text>
          
          <View style={styles.schoolCodeInputContainer}>
            <TextInput
              style={styles.schoolCodeInput}
              placeholder="e.g., SCH-12345"
              placeholderTextColor={`${colors.textPrimary}60`}
              value={schoolCode}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            {/* Dropdown */}
            {showDropdown && filteredSchools.length > 0 && (
              <Animated.View 
                style={[
                  styles.dropdown,
                  {
                    height: dropdownHeight,
                    opacity: dropdownOpacity,
                  }
                ]}
              >
                <ScrollView 
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredSchools.map((school, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleSchoolSelect(school)}
                    >
                      <Text style={styles.dropdownItemCode}>{school.code}</Text>
                      <Text style={styles.dropdownItemName}>{school.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
      </Animated.View>
    </SafeAreaView>
  );
};

export default SchoolCodeScreen;
