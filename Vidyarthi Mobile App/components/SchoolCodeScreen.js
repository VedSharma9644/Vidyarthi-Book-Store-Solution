import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const SchoolCodeScreen = ({ onTabPress, onBack, onSchoolSelected }) => {
  const [schoolCode, setSchoolCode] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [isSearching, setIsSearching] = useState(false);
  const [isSchoolSelected, setIsSchoolSelected] = useState(false);

  useEffect(() => {
    // Fade in animation on component mount
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCodeChange = async (text) => {
    setSchoolCode(text);
    setIsSchoolSelected(false); // Reset selection when user types
    
    if (text.length > 0) {
      setIsSearching(true);
      try {
        // Search schools from Firebase
        const result = await ApiService.searchSchools(text, 10);
        
        if (result.success && result.data) {
          setFilteredSchools(result.data);
          setShowDropdown(true);
          
      // Animate dropdown opening
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false, // maxHeight doesn't support native driver
      }).start();
        } else {
          setFilteredSchools([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Error searching schools:', error);
        setFilteredSchools([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setFilteredSchools([]);
      setShowDropdown(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false, // maxHeight doesn't support native driver
      }).start();
    }
  };

  const handleSchoolSelect = (school) => {
    setSchoolCode(school.code);
    setIsSchoolSelected(true); // Mark that a school was selected from dropdown
    setShowDropdown(false);
    setFilteredSchools([]);
    
    // Animate dropdown closing
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false, // maxHeight doesn't support native driver
    }).start();
  };

  const handleContinue = async () => {
    if (!schoolCode.trim()) {
      Alert.alert('Error', 'Please enter a school code');
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Validate school code with Firebase
      const result = await ApiService.validateSchoolCode(schoolCode.trim());
      
      if (result.success && result.isValid && result.data) {
        // Navigate to school page
        if (onSchoolSelected) {
          onSchoolSelected(result.data);
        } else {
          Alert.alert('Success', `Proceeding with: ${result.data.name}`);
        }
      } else {
        Alert.alert('Invalid Code', result.message || 'Please enter a valid school code');
      }
    } catch (error) {
      console.error('Error validating school code:', error);
      Alert.alert('Error', 'Failed to validate school code. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const dropdownMaxHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.min(filteredSchools.length * 100, 400)],
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
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.schoolCodeInput}
                placeholder="e.g., SCH-12345"
                placeholderTextColor={`${colors.textPrimary}60`}
                value={schoolCode}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {isSearching && (
                <View style={{ position: 'absolute', right: 12, top: 12 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </View>
            
            {/* Dropdown */}
            {showDropdown && filteredSchools.length > 0 && (
              <Animated.View 
                style={[
                  styles.dropdown,
                  {
                    maxHeight: dropdownMaxHeight,
                    opacity: dropdownOpacity,
                    overflow: 'hidden',
                  }
                ]}
              >
                <ScrollView 
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredSchools.map((school) => (
                    <TouchableOpacity
                      key={school.id || school.code}
                      style={styles.dropdownItem}
                      onPress={() => handleSchoolSelect(school)}
                    >
                      <Text style={styles.dropdownItemCode}>{school.code}</Text>
                      <Text style={styles.dropdownItemName}>
                        {school.name} {school.branchName ? `- ${school.branchName}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.continueButton, 
              isSchoolSelected && { backgroundColor: colors.primary, shadowColor: colors.primary },
              isSearching && { opacity: 0.6 }
            ]} 
            onPress={handleContinue}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
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
