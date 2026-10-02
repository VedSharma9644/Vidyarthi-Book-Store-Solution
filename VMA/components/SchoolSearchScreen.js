import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ScreenHeader from './ScreenHeader';
import ScrollingNoticeBanner from './ScrollingNoticeBanner';

const SchoolSearchScreen = ({ onTabPress, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularSchools = [
    'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE',
    'BLOOMING MINDS-KORUTLA-CBSE',
    'SRI CHAITANYA-JAGTIAL-STATE',
    'KAKATIYA-KARIMNAGAR-ICSE',
    'VIVEKANANDA-GODAVARIKHANI-STATE',
    'APEX E-TECHNO-PEDDAPALLI-CBSE',
  ];

  const handleSchoolSelect = (schoolName) => {
    Alert.alert('School Selected', `You selected: ${schoolName}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Search Schools"
        right={
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollingNoticeBanner />

      {/* Main Content */}
      <ScrollView style={styles.searchMainContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for your school"
              placeholderTextColor={`${colors.textLight}80`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Popular Schools Section */}
        <View style={styles.popularSchoolsContainer}>
          <Text style={styles.popularSchoolsTitle}>Popular schools</Text>
          <View style={styles.schoolsGrid}>
            {popularSchools.map((school, index) => (
              <TouchableOpacity
                key={index}
                style={styles.schoolCard}
                onPress={() => handleSchoolSelect(school)}
              >
                <Text style={styles.schoolCardText}>{school}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default SchoolSearchScreen;
