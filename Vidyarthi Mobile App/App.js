import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import HomeScreen from './components/HomeScreen';
import SchoolSearchScreen from './components/SchoolSearchScreen';
import SchoolCodeScreen from './components/SchoolCodeScreen';
import SchoolPage from './components/SchoolPage';
import CartScreen from './components/CartScreen';
import ProfileScreen from './components/ProfileScreen';
import CheckoutScreen from './components/CheckoutScreen';
import OrderHistoryScreen from './components/OrderHistoryScreen';
import PastOrdersScreen from './components/PastOrdersScreen';
import OrderDetailsScreen from './components/OrderDetailsScreen';
import AddStudentScreen from './components/AddStudentScreen';
import StudentsScreen from './components/StudentsScreen';
import ApiTestScreen from './components/ApiTestScreen';
import OtpVerificationScreen from './components/OtpVerificationScreen';
import ManageGradesScreen from './components/ManageGradesScreen';
import UpsertGradeScreen from './components/UpsertGradeScreen';
import GradeBooksPage from './components/GradeBooksPage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [otpVerificationData, setOtpVerificationData] = useState(null);
  const [upsertGradeId, setUpsertGradeId] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);

  const switchToRegister = () => {
    setCurrentScreen('register');
  };

  const switchToLogin = () => {
    setCurrentScreen('login');
  };

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

  const goToPastOrders = () => {
    setCurrentScreen('pastOrders');
  };

  const goToOrderDetails = () => {
    setCurrentScreen('orderDetails');
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

  const goToOtpVerification = (data) => {
    setOtpVerificationData(data);
    setCurrentScreen('otpVerification');
  };

  const goBackFromOtp = () => {
    setOtpVerificationData(null);
    setCurrentScreen('register');
  };

  const handleOtpSuccess = () => {
    setOtpVerificationData(null);
    setCurrentScreen('home');
  };

  const goBack = () => {
    if (currentScreen === 'gradeBooks') {
      setSelectedGrade(null);
      setCurrentScreen('schoolPage');
    } else if (currentScreen === 'schoolPage') {
      setSelectedSchool(null);
      setCurrentScreen('schoolCode');
    } else {
      setCurrentScreen('home');
    }
  };

  const goToSchoolPage = (school) => {
    setSelectedSchool(school);
    setCurrentScreen('schoolPage');
  };

  const goToGradeBooks = (grade) => {
    setSelectedGrade(grade);
    setCurrentScreen('gradeBooks');
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

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {currentScreen === 'login' ? (
          <LoginScreen 
            onSwitchToRegister={switchToRegister} 
            onGoToSearch={goToSchoolCode}
            onGoToApiTest={goToApiTest}
          />
        ) : currentScreen === 'register' ? (
          <RegisterScreen 
            onBack={goBack} 
            onSwitchToLogin={switchToLogin} 
            onGoToOtpVerification={goToOtpVerification}
          />
        ) : currentScreen === 'otpVerification' ? (
          <OtpVerificationScreen
            onBack={goBackFromOtp}
            onSuccess={handleOtpSuccess}
            email={otpVerificationData?.email}
            firstName={otpVerificationData?.firstName}
            lastName={otpVerificationData?.lastName}
            password={otpVerificationData?.password}
            schoolName={otpVerificationData?.schoolName}
            classStandard={otpVerificationData?.classStandard}
            phoneNumber={otpVerificationData?.phoneNumber}
          />
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
            onViewBooks={goToGradeBooks}
          />
        ) : currentScreen === 'gradeBooks' ? (
          <GradeBooksPage
            onTabPress={handleTabPress}
            onBack={goBack}
            gradeId={selectedGrade?.id}
            gradeName={selectedGrade?.name}
            schoolId={selectedSchool?.id}
          />
        ) : currentScreen === 'cart' ? (
          <CartScreen onTabPress={handleTabPress} onBack={goBack} onGoToCheckout={goToCheckout} />
        ) : currentScreen === 'profile' ? (
          <ProfileScreen onTabPress={handleTabPress} onBack={goToLogin} onLogout={goToLogin} onGoToOrderHistory={goToOrderHistory} onGoToPastOrders={goToPastOrders} onGoToStudents={goToStudents} onGoToManageGrades={goToManageGrades} />
        ) : currentScreen === 'checkout' ? (
          <CheckoutScreen onBack={goBack} onPlaceOrder={handlePlaceOrder} />
        ) : currentScreen === 'orderHistory' ? (
          <OrderHistoryScreen onTabPress={handleTabPress} onBack={goToProfile} onGoToOrderDetails={goToOrderDetails} />
        ) : currentScreen === 'pastOrders' ? (
          <PastOrdersScreen onTabPress={handleTabPress} onBack={goToProfile} />
        ) : currentScreen === 'orderDetails' ? (
          <OrderDetailsScreen onTabPress={handleTabPress} onBack={goToOrderHistory} />
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
        ) : (
          <HomeScreen onTabPress={handleTabPress} onGoToSearch={goToSchoolCode} />
        )}
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

