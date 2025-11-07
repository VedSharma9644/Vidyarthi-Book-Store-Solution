import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const StudentsScreen = ({ onTabPress, onBack, onGoToAddStudent }) => {
  const students = [
    {
      id: 1,
      name: 'Ethan Harper',
      class: 'Class 10',
      school: 'Springfield High',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx3fHgLKjb_9s9qu1qg0nRPXK3qDdwSA_-JBTDmmbJN6l-RGOc88GxKmB3ELkE0OFHTEhWafaH9qylIeNbmROEiebscHrfm-ErL-f6b0E6gm_21eJM-I62Z5PlS6so1_9_2w4mMcjeCcR5paXkw1yYyxwqj6KKiBefMc9kcjQPKE3wSABlFFba9sRi3xlqU0e3c404jmnAHKC4SMxiTb114fIEc6fieSvZodZ277geEh6uLxbhrCTdk89GerXGrusv7NryTw0r-uk',
    },
    {
      id: 2,
      name: 'Olivia Bennett',
      class: 'Class 11',
      school: 'Lakeside Academy',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB51Qjz5VVjr_eUUm6b-lYmgUuW4rd507LcfDE-VjWsiHQGd_0aaECXot7rgRZ-RGwUdnIE3hiEyvWA-Tkdu8PbYt96HWjuRzvaT8-Oi8jy6XyNVXY8TCHoOVd987wGkNg9CJGC9SoJRdB9dPDPXjKlK3biP1iX_UcpmFbFaeYueqH6chsF5tzQJD0Wi_UDjYe0971rySvn4qkPZtuxAviOEDYiw-95XoifEz2umwUQMnCnZDrEhDqe_sDE1-kKR5SphaMu2N2aCtc',
    },
    {
      id: 3,
      name: 'Noah Carter',
      class: 'Class 9',
      school: 'Northwood School',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTqIhwjrPpXWrjrjLcLS5bYAlwFTXyMZ8FdP5YJmA6U4jnQ85rUjWo-bSg0Z4WtMCj6zajbUbGbCDo71EY2M0Ksa-CkuW9EMsPp3BEuKBcJpwPU7JWTEK46oJcmTmBjgvTCt3SWYWiRYDtrr5Ko6EDuaL_fyrqW3w_h9wFzpYiuToYYFqDOky3laCdrLTkz6OZ2m8lYl-IoDz631MOKohM3mCMC0uzwHAHbLAgTRhuWLRMnSn5cpCtkX5UU1Q7fddTd7l4IPcvT8w',
    },
  ];

  const handleStudentPress = (student) => {
    Alert.alert('Student Details', `${student.name} details will be implemented`);
  };

  const handleAddStudent = () => {
    if (onGoToAddStudent) {
      onGoToAddStudent();
    } else {
      Alert.alert('Add Student', 'Add student functionality will be implemented');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.studentsHeader}>
        <View style={styles.studentsHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.studentsHeaderTitle}>Students</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.studentsMainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.studentsContent}>
          {students.map((student, index) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCard}
              onPress={() => handleStudentPress(student)}
            >
              <Image 
                source={{ uri: student.image }} 
                style={styles.studentImage}
                resizeMode="cover"
              />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentDetails}>{student.class}, {student.school}</Text>
              </View>
              <Text style={styles.studentChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Student Button */}
      <View style={styles.studentsAddStudentButtonContainer}>
        <TouchableOpacity
          style={styles.studentsAddStudentButton}
          onPress={handleAddStudent}
        >
          <Text style={styles.studentsAddStudentButtonIcon}>+</Text>
          <Text style={styles.studentsAddStudentButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default StudentsScreen;
