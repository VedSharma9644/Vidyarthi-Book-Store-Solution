import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

// Grade card background image - using local asset
// Place your grade background image in: assets/images/grade-background.jpg
// Supported formats: .jpg, .jpeg, .png, .webp
const GRADE_BACKGROUND_IMAGE = require('../assets/images/Select-Class-Image.jpeg');

// Fallback to old URLs if local image doesn't exist (for backward compatibility)
const GRADE_IMAGES_FALLBACK = {
  9: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5lNrDizC9IkVT9WBpy8yqmaUVkdVnV9If6m-FGZwQwPO1lWy3sMd_KiBYbC7Gws_rnK4YcR0YIsLQ7n5xHyYq3L6cIpHuToeZaXS6u67ZMgnCsJ6ozEIZFqoVkTvYmQJ3N6N-3xr7bHARdS8cIBR5ueBsTv1mPSM53xBSqn7Tvq2VcuO5Tqn8E89FpGK_B-wWULft-Bykd5O4Mjpbht8tE6XVXEQRRyo0CVnSvJOoPFQWNiKbn5HAJUT0HuUmx_T3rTQ_BwYC520',
  10: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMmvmZcjuXIsKvwA08IJF8Sm-VsaYpQxPygsBx94mA3ydNVklWTdKaAP3QygwC4ruqj4AVBy-uVK_A7WnqXN23IhtLtYEx7zhThBfh7Glxcp6bL6rWh0hKBIDeYxuA_taEx-WLJld_2NNlbM5ccxBs3OC1tgv-GwG18VoI9gQT-aHd-RyJdyyfAOj20fKrXZJkmLt3-5Avf6ZahYvJdxQAy4PHvKspShZcLaCb6xfQzWKUicf4uEPUG78g9O8dxua-uq4sFf5agWI',
  11: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4JU66-rzvfrajrlpgcqIY_aTXeRTqZ7zcdVC7pJGGLvn3AWQGhfQNgdvp6sZn6ZU74kRxqjofqbbk1BalrK9a6YJ36OVK1X2mxagc8qdee9ikDwQM1ZsIf4t7ZA3rJdtzs_M9IIKMEeR0qo_GTtQM6ehDfunOpwNslm3HQo6IkA0ZdSVb3fkDPqBROSxdNyZVKxNLAtI7EMOkPhPph22nl4i_UOgE_BV5CQ1D8Eg0UsxIBA7eY7K8IlWTXWjv4-BESYoqnI-lK3Q',
  12: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHndnGiUw1THvCQy3z6p6RpoYytWan7u1m97HwZ83pDtzdLveJ9Y6HGKEMWEZauvk5AOthIctNpFBhdD62k-Pha2BtfPZNWCx8csvY36CgmYSEp13jJCeZzkg90FCY4ijjyDssxtVr7LeiLYixmE_eRwsXIpJMtQPaPcWAiUl7f3Z3AUbUkJFx7FGvjPfyMzgiI7tyIhUy4FzRhPlU4kVcN2e8SObwtUs-HXUoLuYcuRBmINpBnCBuG4wXYokNNJel4h13KsyebxA',
};

const SchoolPage = ({ onTabPress, onBack, schoolId, schoolCode, onViewBooks }) => {
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchool();
  }, [schoolId, schoolCode]);

  const loadSchool = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let result;
      let loadedSchoolId = null;
      
      if (schoolId) {
        result = await ApiService.getSchoolById(schoolId);
        loadedSchoolId = schoolId;
      } else if (schoolCode) {
        result = await ApiService.getSchoolByCode(schoolCode);
        if (result.success && result.data) {
          loadedSchoolId = result.data.id;
        }
      } else {
        setError('No school identifier provided');
        setIsLoading(false);
        return;
      }

      if (result.success && result.data) {
        setSchool(result.data);
        
        // Fetch grades for this school
        if (loadedSchoolId) {
          const gradesResult = await ApiService.getGradesBySchoolId(loadedSchoolId);
          if (gradesResult.success && gradesResult.data) {
            // Transform grades data to match the component's expected format
            const transformedGrades = gradesResult.data.map(grade => ({
              id: grade.id,
              name: grade.name,
            }));
            setGrades(transformedGrades);
          } else {
            // If grades fetch fails, show empty list
            setGrades([]);
            console.warn('Failed to load grades:', gradesResult.message);
          }
        } else {
          setGrades([]);
        }
      } else {
        setError(result.message || 'School not found');
      }
    } catch (error) {
      console.error('Error loading school:', error);
      setError('Failed to load school information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBooks = (grade) => {
    // Navigate to grade books page
    if (onViewBooks) {
      onViewBooks(grade);
    }
  };

  const getSchoolAddress = () => {
    if (!school) return '';
    const parts = [];
    if (school.address) parts.push(school.address);
    if (school.city && school.state) {
      parts.push(`${school.city}, ${school.state}`);
    } else if (school.city) {
      parts.push(school.city);
    } else if (school.state) {
      parts.push(school.state);
    }
    return parts.join(', ');
  };

  const getSchoolBannerImage = () => {
    // Use school logo if available, otherwise use a default school image
    return school?.schoolLogo || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlR5TvAo7qnUZ8Ct1x-LWQ-WKjwYg2DA11C_1L94Ymzq3mWktc4aR_eiKp7_ySpwxGvnY_fYiDLU6SDZPdnEEjFLplcPOPVpwcCpu_dNzl3pEOcfqZET_ER9fs7mrv4OV6BSxqAqJ4U2ZmU-oKVugcsp7h2rD4AvocdvACICt4Y7k2ggJnqOSdKewnWlPAWwsv6GAKTGF3QmwfSQzKityM21DhGkWIW6h84jZKA_lBiM-Agj21JfbYSt2vDuBLrmwki6-TH7GPqiw';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#06412c" />
          <Text style={{ marginTop: 16, color: '#0e1b16' }}>
            Loading school information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !school) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#0e1b16', marginBottom: 10, textAlign: 'center' }}>
            {error || 'School not found'}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: '#06412c',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={onBack}
          >
            <Text style={{ color: '#f8fcfa', fontSize: 16, fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <TouchableOpacity
          style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}
          onPress={onBack}
        >
          <Text style={{ fontSize: 24, color: colors.white }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.white,
          paddingRight: 48,
        }}>
          School Details
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* School Banner */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <ImageBackground
              source={{ uri: getSchoolBannerImage() }}
              style={{
                height: 218,
                borderRadius: 8,
                overflow: 'hidden',
                justifyContent: 'flex-end',
              }}
              resizeMode="cover"
            >
             
              
            </ImageBackground>
        </View>
        {/* School Name */}
        <Text style={{
          color: '#000000',
          fontSize: 28,
          fontWeight: 'bold',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
        }}>{school.name}</Text>
        {/* School Address */}
        <Text style={{
          color: '#000000',
          fontSize: 16,
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 12,
        }}>
          {getSchoolAddress() || 'Address not available'}
        </Text>

        {/* Available Grades Heading */}
        <Text style={{
          color: '#0e1b16',
          fontSize: 22,
          fontWeight: 'bold',
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 12,
        }}>
          Available Grades
        </Text>

        {/* Grade Cards */}
        {grades.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{
              color: '#666',
              fontSize: 16,
              textAlign: 'center',
              paddingVertical: 20,
            }}>
              No grades available for this school
            </Text>
          </View>
        ) : (
          grades.map((grade) => (
          <View key={grade.id} style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <ImageBackground
              source={GRADE_BACKGROUND_IMAGE}
              style={{
                height: 180,
                borderRadius: 8,
                overflow: 'hidden',
                justifyContent: 'flex-end',
              }}
              resizeMode="cover"
            >
              {/* Gradient Overlay */}
              <View style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
              }}>
                <View style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }} />
              </View>
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: 16,
                gap: 16,
              }}>
                <Text style={{
                  flex: 1,
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: 'bold',
                  lineHeight: 28,
                }}>
                  {grade.name}
                </Text>
                <TouchableOpacity
                  style={{
                    minWidth: 84,
                    height: 40,
                    backgroundColor: '#06412c',
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                  }}
                  onPress={() => handleViewBooks(grade)}
                >
                  <Text style={{
                    color: '#f8fcfa',
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}>
                    View Books
                  </Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default SchoolPage;
