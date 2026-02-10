import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../css/styles';
import ApiService from '../services/apiService';
import BottomNavigation from './BottomNavigation';

const GradeSectionsScreen = ({
  onTabPress,
  onBack,
  gradeId,
  gradeName,
  schoolId,
  onSelectSection,
  onViewAllBooks,
}) => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (gradeId) {
      loadSections();
    } else {
      setIsLoading(false);
    }
  }, [gradeId]);

  const loadSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ApiService.getSubgradesByGradeId(gradeId);
      if (result.success && result.data) {
        setSections(result.data);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error('Error loading sections:', err);
      setError('Failed to load sections.');
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#e8f4fc' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textPrimary }}>
            Loading sections...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e8f4fc' }}>
      {/* Header - same style as School Details */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
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
          Select section
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Class / Grade name - like "Class - 10" */}
        <Text style={{
          color: colors.textPrimary,
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {gradeName || 'Class'}
        </Text>

        {error ? (
          <Text style={{ color: '#b91c1c', marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        ) : null}

        {/* White card: Select section with rectangle boxes */}
        <View style={{
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: 20,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: 1,
          borderColor: colors.borderLight || colors.gray100,
        }}>
          <Text style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 16,
          }}>
            Select section
          </Text>

          {sections.length === 0 ? (
            <Text style={{
              color: colors.textSecondary || colors.gray500,
              fontSize: 15,
              marginBottom: 16,
            }}>
              No sections added for this grade yet.
            </Text>
          ) : null}

          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              activeOpacity={0.7}
              onPress={() => onSelectSection && onSelectSection(section)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.gray50 || '#f9fafb',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.borderLight || '#e5e7eb',
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: colors.textPrimary,
              }}>
                {section.name}
              </Text>
              <Text style={{ fontSize: 18, color: colors.textSecondary || colors.gray500 }}>→</Text>
            </TouchableOpacity>
          ))}

          {sections.length === 0 && onViewAllBooks ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onViewAllBooks()}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
                View all books for this grade
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <BottomNavigation onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default GradeSectionsScreen;
