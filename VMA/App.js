import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import SchoolSearchScreen from './components/SchoolSearchScreen';
import SchoolCodeScreen from './components/SchoolCodeScreen';
import SchoolPage from './components/SchoolPage';
import CartScreen from './components/CartScreen';
import ProfileScreen from './components/ProfileScreen';
import CheckoutScreen from './components/CheckoutScreen';
import OrderHistoryScreen from './components/OrderHistoryScreen';
import OrderDetailsScreen from './components/OrderDetailsScreen';
import AddStudentScreen from './components/AddStudentScreen';
import StudentsScreen from './components/StudentsScreen';
import ApiTestScreen from './components/ApiTestScreen';
import ManageGradesScreen from './components/ManageGradesScreen';
import UpsertGradeScreen from './components/UpsertGradeScreen';
import GradeBooksPage from './components/GradeBooksPage';
import ShippingAddressesScreen from './components/ShippingAddressesScreen';
import { View, ActivityIndicator } from 'react-native';
import { colors } from './css/styles';

// Inner component that uses auth context. Uses authReady (not isLoading) so login screen never unmounts due to loading.
function AppContent() {
  const { isLoggedIn, authReady } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(null);
  const [upsertGradeId, setUpsertGradeId] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubgrade, setSelectedSubgrade] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Set initial screen only when auth is ready (once). Never show loading again after that.
  useEffect(() => {
    if (authReady && currentScreen === null) {
      setCurrentScreen(isLoggedIn ? 'home' : 'login');
    }
  }, [authReady, isLoggedIn, currentScreen]);

  const goToHome = () => {
    setCurrentScreen('home');
  };

  const goToSearch = () => {
    setCurrentScreen('search');
  };

  const goToSchoolCode = () => {
    setCurrentScreen('schoolCode');
  };

  const goToCart = () => {
    setCurrentScreen('cart');
  };

  const goToProfile = () => {
    setCurrentScreen('profile');
  };

  const goToCheckout = () => {
    setCurrentScreen('checkout');
  };

  const goToOrderHistory = () => {
    setCurrentScreen('orderHistory');
  };


  const goToOrderDetails = (orderId) => {
    setSelectedOrderId(orderId);
    setCurrentScreen('orderDetails');
  };

  const goBackFromOrderDetails = () => {
    setSelectedOrderId(null);
    setCurrentScreen('orderHistory');
  };

  const goToAddStudent = () => {
    setCurrentScreen('addStudent');
  };

  const goToStudents = () => {
    setCurrentScreen('students');
  };

  const goToManageGrades = () => {
    setCurrentScreen('manageGrades');
  };

  const goToShippingAddresses = () => {
    setCurrentScreen('shippingAddresses');
  };

  const goToUpsertGrade = (gradeId) => {
    setUpsertGradeId(gradeId);
    setCurrentScreen('upsertGrade');
  };

  const goBackFromUpsertGrade = () => {
    setUpsertGradeId(null);
    setCurrentScreen('manageGrades');
  };

  const goToApiTest = () => {
    setCurrentScreen('apiTest');
  };

  const goBack = () => {
    if (currentScreen === 'gradeBooks') {
      setSelectedSubgrade(null);
      setCurrentScreen('schoolPage');
    } else if (currentScreen === 'schoolPage') {
      setSelectedSchool(null);
      setCurrentScreen('schoolCode');
    } else if (currentScreen === 'shippingAddresses') {
      setCurrentScreen('profile');
    } else {
      setCurrentScreen('home');
    }
  };

  const goToSchoolPage = (school) => {
    setSelectedSchool(school);
    setCurrentScreen('schoolPage');
  };

  const goToGradeBooks = (grade, skipSections) => {
    setSelectedGrade(grade);
    setSelectedSubgrade(null);
    setCurrentScreen('gradeBooks');
  };

  const goBackToSchoolFromGradeBooks = () => {
    setSelectedSubgrade(null);
    setCurrentScreen('schoolPage');
  };

  const goToLogin = () => {
    setCurrentScreen('login');
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'home') {
      setCurrentScreen('home');
    } else if (tabId === 'search') {
      setCurrentScreen('schoolCode');
    } else if (tabId === 'cart') {
      setCurrentScreen('cart');
    } else if (tabId === 'profile') {
      setCurrentScreen('profile');
    } else {
      // Handle other tabs - show alerts for now
      alert(`${tabId} functionality will be implemented`);
    }
  };

  const handlePlaceOrder = () => {
    setCurrentScreen('home');
  };

  // Show loading only until first auth check completes. After authReady, login/home never unmount due to loading.
  if (!authReady || currentScreen === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {currentScreen === 'login' ? (
          <LoginScreen onGoToSearch={goToSchoolCode} />
        ) : currentScreen === 'search' ? (
          <SchoolSearchScreen onTabPress={handleTabPress} onClose={goBack} />
        ) : currentScreen === 'schoolCode' ? (
          <SchoolCodeScreen onTabPress={handleTabPress} onBack={goBack} onSchoolSelected={goToSchoolPage} />
        ) : currentScreen === 'schoolPage' ? (
          <SchoolPage 
            onTabPress={handleTabPress} 
            onBack={goBack} 
            schoolId={selectedSchool?.id}
            schoolCode={selectedSchool?.code}
            onSelectSection={(grade, section) => {
              setSelectedGrade(grade);
              setSelectedSubgrade(section);
              setCurrentScreen('gradeBooks');
            }}
            onViewAllBooks={(grade) => {
              setSelectedGrade(grade);
              setSelectedSubgrade(null);
              setCurrentScreen('gradeBooks');
            }}
          />
        ) : currentScreen === 'gradeBooks' ? (
          <GradeBooksPage
            onTabPress={handleTabPress}
            onBack={goBack}
            onBackToSchool={goBackToSchoolFromGradeBooks}
            gradeId={selectedGrade?.id}
            gradeName={selectedSubgrade ? `${selectedGrade?.name} - ${selectedSubgrade?.name}` : selectedGrade?.name}
            schoolId={selectedSchool?.id}
            subgradeId={selectedSubgrade?.id}
            subgradeName={selectedSubgrade?.name}
          />
        ) : currentScreen === 'cart' ? (
          <CartScreen onTabPress={handleTabPress} onBack={goBack} onGoToCheckout={goToCheckout} />
        ) : currentScreen === 'profile' ? (
          <ProfileScreen onTabPress={handleTabPress} onBack={goToLogin} onLogout={goToLogin} onGoToOrderHistory={goToOrderHistory} onGoToStudents={goToStudents} onGoToManageGrades={goToManageGrades} onGoToShippingAddresses={goToShippingAddresses} />
        ) : currentScreen === 'checkout' ? (
          <CheckoutScreen onBack={goBack} onPlaceOrder={handlePlaceOrder} />
        ) : currentScreen === 'orderHistory' ? (
          <OrderHistoryScreen onTabPress={handleTabPress} onBack={goToProfile} onGoToOrderDetails={goToOrderDetails} />
        ) : currentScreen === 'orderDetails' ? (
          <OrderDetailsScreen onTabPress={handleTabPress} onBack={goBackFromOrderDetails} orderId={selectedOrderId} />
        ) : currentScreen === 'addStudent' ? (
          <AddStudentScreen onTabPress={handleTabPress} onBack={goToStudents} />
        ) : currentScreen === 'students' ? (
          <StudentsScreen onTabPress={handleTabPress} onBack={goToProfile} onGoToAddStudent={goToAddStudent} />
        ) : currentScreen === 'manageGrades' ? (
          <ManageGradesScreen onTabPress={handleTabPress} onBack={goToProfile} onGoToUpsertGrade={goToUpsertGrade} />
        ) : currentScreen === 'upsertGrade' ? (
          <UpsertGradeScreen onTabPress={handleTabPress} onBack={goBackFromUpsertGrade} gradeId={upsertGradeId} />
        ) : currentScreen === 'apiTest' ? (
          <ApiTestScreen onBack={goBack} />
        ) : currentScreen === 'shippingAddresses' ? (
          <ShippingAddressesScreen onBack={goBack} />
        ) : (
          <HomeScreen 
            onTabPress={handleTabPress} 
            onGoToSearch={goToSchoolCode}
            onGoToOrderHistory={goToOrderHistory}
          />
        )}
      <StatusBar style="light" />
    </>
  );
}

// Main App component with AuthProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

