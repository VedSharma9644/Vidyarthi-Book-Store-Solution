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
/** Hardcoded grade display order: always show in this sequence */
const GRADE_DISPLAY_ORDER = [
  'NURSERY',
  'PP-1',
  'PP-2',
  'CLASS-1',
  'CLASS-2',
  'CLASS-3',
  'CLASS-4',
  'CLASS-5',
  'CLASS-6',
  'CLASS-7',
  'CLASS-8',
  'CLASS-9',
  'CLASS-10',
  'CLASS-11',
  'CLASS-12',
];

const getGradeOrderIndex = (name) => {
  const n = (name || '').trim().toUpperCase();
  const exact = GRADE_DISPLAY_ORDER.findIndex((o) => o.toUpperCase() === n);
  if (exact >= 0) return exact;
  for (let i = GRADE_DISPLAY_ORDER.length - 1; i >= 0; i--) {
    if (n.startsWith(GRADE_DISPLAY_ORDER[i].toUpperCase())) return i;
  }
  return 999;
};

const sortGrades = (grades) => {
  return [...grades].sort((a, b) => getGradeOrderIndex(a.name) - getGradeOrderIndex(b.name));
};

const GRADE_IMAGES_FALLBACK = {
  9: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5lNrDizC9IkVT9WBpy8yqmaUVkdVnV9If6m-FGZwQwPO1lWy3sMd_KiBYbC7Gws_rnK4YcR0YIsLQ7n5xHyYq3L6cIpHuToeZaXS6u67ZMgnCsJ6ozEIZFqoVkTvYmQJ3N6N-3xr7bHARdS8cIBR5ueBsTv1mPSM53xBSqn7Tvq2VcuO5Tqn8E89FpGK_B-wWULft-Bykd5O4Mjpbht8tE6XVXEQRRyo0CVnSvJOoPFQWNiKbn5HAJUT0HuUmx_T3rTQ_BwYC520',
  10: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMmvmZcjuXIsKvwA08IJF8Sm-VsaYpQxPygsBx94mA3ydNVklWTdKaAP3QygwC4ruqj4AVBy-uVK_A7WnqXN23IhtLtYEx7zhThBfh7Glxcp6bL6rWh0hKBIDeYxuA_taEx-WLJld_2NNlbM5ccxBs3OC1tgv-GwG18VoI9gQT-aHd-RyJdyyfAOj20fKrXZJkmLt3-5Avf6ZahYvJdxQAy4PHvKspShZcLaCb6xfQzWKUicf4uEPUG78g9O8dxua-uq4sFf5agWI',
  11: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4JU66-rzvfrajrlpgcqIY_aTXeRTqZ7zcdVC7pJGGLvn3AWQGhfQNgdvp6sZn6ZU74kRxqjofqbbk1BalrK9a6YJ36OVK1X2mxagc8qdee9ikDwQM1ZsIf4t7ZA3rJdtzs_M9IIKMEeR0qo_GTtQM6ehDfunOpwNslm3HQo6IkA0ZdSVb3fkDPqBROSxdNyZVKxNLAtI7EMOkPhPph22nl4i_UOgE_BV5CQ1D8Eg0UsxIBA7eY7K8IlWTXWjv4-BESYoqnI-lK3Q',
  12: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHndnGiUw1THvCQy3z6p6RpoYytWan7u1m97HwZ83pDtzdLveJ9Y6HGKEMWEZauvk5AOthIctNpFBhdD62k-Pha2BtfPZNWCx8csvY36CgmYSEp13jJCeZzkg90FCY4ijjyDssxtVr7LeiLYixmE_eRwsXIpJMtQPaPcWAiUl7f3Z3AUbUkJFx7FGvjPfyMzgiI7tyIhUy4FzRhPlU4kVcN2e8SObwtUs-HXUoLuYcuRBmINpBnCBuG4wXYokNNJel4h13KsyebxA',
};

const SchoolPage = ({ onTabPress, onBack, schoolId, schoolCode, onSelectSection, onViewAllBooks }) => {
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [sectionsByGradeId, setSectionsByGradeId] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchool();
  }, [schoolId, schoolCode]);

  const loadSchool = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSectionsByGradeId({});

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

        if (loadedSchoolId) {
          const gradesResult = await ApiService.getGradesBySchoolId(loadedSchoolId);
          if (gradesResult.success && gradesResult.data) {
            const transformedGrades = gradesResult.data.map(grade => ({
              id: grade.id,
              name: grade.name,
            }));

            // Optionally hide grades that have no products/books
            let finalGrades = transformedGrades;
            try {
              const booksResult = await ApiService.getAllBooks({ offset: 0, limit: 500 });
              if (booksResult.success && Array.isArray(booksResult.data)) {
                const gradesWithBooks = new Set(
                  booksResult.data
                    .filter((book) => book.schoolId === loadedSchoolId && book.gradeId)
                    .map((book) => book.gradeId)
                );
                if (gradesWithBooks.size > 0) {
                  finalGrades = transformedGrades.filter((grade) => gradesWithBooks.has(grade.id));
                }
              }
            } catch (filterError) {
              console.warn('Failed to filter grades by books; showing all grades instead.', filterError);
            }

            setGrades(sortGrades(finalGrades));
            // Fetch sections (subgrades) for each grade
            const byGrade = {};
            await Promise.all(
              finalGrades.map(async (grade) => {
                const res = await ApiService.getSubgradesByGradeId(grade.id);
                byGrade[grade.id] = (res.success && res.data) ? res.data : [];
              })
            );
            setSectionsByGradeId(byGrade);
          } else {
            setGrades([]);
            console.warn('Failed to load grades:', gradesResult.message);
          }
        } else {
          setGrades([]);
        }
      } else {
        setError(result.message || 'School not found');
      }
    } catch (err) {
      console.error('Error loading school:', err);
      setError('Failed to load school information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSection = (grade, section) => {
    if (onSelectSection) onSelectSection(grade, section);
  };

  const handleViewAllBooks = (grade) => {
    if (onViewAllBooks) onViewAllBooks(grade);
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

        {/* Grades and sections (one grade card per row on mobile) */}
        {grades.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text
              style={{
                color: '#666',
                fontSize: 16,
                textAlign: 'center',
                paddingVertical: 20,
              }}
            >
              No grades available for this school
            </Text>
          </View>
        ) : (
          grades.map((grade) => {
            const sections = sectionsByGradeId[grade.id] || [];
            return (
              <View
                key={grade.id}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 20,
                  backgroundColor: '#d2f7ff',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#a8e8f0',
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 12,
                  }}
                >
                  {grade.name}
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 10,
                  }}
                >
                  Select Language
                </Text>
                {sections.length === 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleViewAllBooks(grade)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: colors.white,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.borderLight || '#e5e7eb',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.textPrimary }}>View all books</Text>
                    <Text style={{ fontSize: 18, color: colors.textSecondary || '#6b7280' }}>→</Text>
                  </TouchableOpacity>
                ) : (
                  sections.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelectSection(grade, section)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.white,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.borderLight || '#e5e7eb',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary }}>
                        {section.name}
                      </Text>
                      <Text style={{ fontSize: 18, color: colors.textSecondary || '#6b7280' }}>→</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default SchoolPage;
