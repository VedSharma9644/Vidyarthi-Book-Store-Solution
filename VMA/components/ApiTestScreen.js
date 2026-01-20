import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import ApiService from '../services/apiService';

const ApiTestScreen = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({});

  const runApiTest = async (testName, testFunction) => {
    try {
      setIsLoading(true);
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      Alert.alert('Success', `${testName} test passed!`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      Alert.alert('Error', `${testName} test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = () => runApiTest('Health Check', () => ApiService.healthCheck());
  const testAuthRoutes = () => runApiTest('Auth Routes', () => ApiService.testAuth());
  const testBooksApi = () => runApiTest('Books API', () => ApiService.getAllBooks({ limit: 3 }));
  const testCartApi = () => runApiTest('Cart API', () => ApiService.getCart());

  const runAllTests = async () => {
    setIsLoading(true);
    const tests = [
      { name: 'Health Check', fn: () => ApiService.healthCheck() },
      { name: 'Auth Routes', fn: () => ApiService.testAuth() },
      { name: 'Books API', fn: () => ApiService.getAllBooks({ limit: 3 }) },
      { name: 'Cart API', fn: () => ApiService.getCart() },
    ];

    const results = {};
    for (const test of tests) {
      try {
        const result = await test.fn();
        results[test.name] = { success: true, data: result };
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
    Alert.alert('Tests Complete', 'Check results below');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>API Test</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.testContainer}>
          <Text style={styles.testTitle}>Backend API Tests</Text>
          <Text style={styles.testSubtitle}>Test connection to Node.js backend</Text>

          {/* Test Buttons */}
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity 
              style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
              onPress={testHealthCheck}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>Health Check</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
              onPress={testAuthRoutes}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>Auth Routes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
              onPress={testBooksApi}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>Books API</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, isLoading && styles.testButtonDisabled]} 
              onPress={testCartApi}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>Cart API</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.testButton, styles.testButtonPrimary, isLoading && styles.testButtonDisabled]} 
              onPress={runAllTests}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.testButtonText}>Run All Tests</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Test Results:</Text>
              {Object.entries(testResults).map(([testName, result]) => (
                <View key={testName} style={styles.resultItem}>
                  <Text style={[
                    styles.resultText,
                    result.success ? styles.resultSuccess : styles.resultError
                  ]}>
                    {result.success ? '✅' : '❌'} {testName}
                  </Text>
                  {result.success ? (
                    <Text style={styles.resultData}>
                      {JSON.stringify(result.data, null, 2).substring(0, 100)}...
                    </Text>
                  ) : (
                    <Text style={styles.resultError}>
                      Error: {result.error}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ApiTestScreen;
