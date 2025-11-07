import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const HomeScreen = ({ onTabPress, onGoToSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Popular schools data
  const popularSchools = [
    {
      id: 1,
      name: 'Delhi Public School',
      logo: { uri: 'https://via.placeholder.com/60x60/4A90E2/FFFFFF?text=DPS' }
    },
    {
      id: 2,
      name: 'Kendriya Vidyalaya',
      logo: { uri: 'https://via.placeholder.com/60x60/7ED321/FFFFFF?text=KV' }
    },
    {
      id: 3,
      name: 'St. Xavier\'s School',
      logo: { uri: 'https://via.placeholder.com/60x60/F5A623/FFFFFF?text=SXS' }
    },
    {
      id: 4,
      name: 'Ryan International',
      logo: { uri: 'https://via.placeholder.com/60x60/BD10E0/FFFFFF?text=RI' }
    },
    {
      id: 5,
      name: 'DAV Public School',
      logo: { uri: 'https://via.placeholder.com/60x60/50E3C2/FFFFFF?text=DAV' }
    },
    {
      id: 6,
      name: 'Amity International',
      logo: { uri: 'https://via.placeholder.com/60x60/B8E986/FFFFFF?text=AI' }
    }
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const response = await ApiService.getAllBooks({ limit: 6 });
      
      if (response.success) {
        setBooks(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch books');
      }
    } catch (error) {
      console.log('Error fetching books:', error);
      Alert.alert('Error', 'Failed to fetch books. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolSelect = (school) => {
    Alert.alert('School Selected', `You selected: ${school.name}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchHeaderContent}>
          <View style={styles.searchHeaderSpacer} />
          <Text style={styles.searchHeaderTitle}>Find your school</Text>
          <View style={styles.searchHeaderSpacer} />
        </View>
      </View>

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
                <Image source={school.logo} style={styles.schoolLogo} />
                <Text style={styles.schoolCardText}>{school.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default HomeScreen;
