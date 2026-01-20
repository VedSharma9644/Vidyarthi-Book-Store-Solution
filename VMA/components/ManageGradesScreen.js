import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';

const ManageGradesScreen = ({ onTabPress, onBack, onGoToUpsertGrade }) => {
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Mock data - replace with API call later
  const mockGrades = [
    { id: 3, name: 'CLASS 1', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 4, name: 'CLASS 2', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 5, name: 'CLASS 3', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 6, name: 'CLASS 4', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 7, name: 'CLASS 5', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 8, name: 'CLASS 6', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 9, name: 'CLASS 7', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 10, name: 'CLASS 8', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 11, name: 'CLASS 9', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
    { id: 12, name: 'CLASS 10', school: 'PARAMITA HERITAGE CAMPUS-PADMANAGAR-CBSE - KARIMNAGAR-PADMANAGAR-CBSE' },
  ];

  useEffect(() => {
    loadGrades();
  }, []);

  useEffect(() => {
    filterGrades();
  }, [searchQuery, grades]);

  const loadGrades = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiService.getAllGrades();
      // setGrades(response.data);
      // setTotalItems(response.total);
      
      // Using mock data for now
      setGrades(mockGrades);
      setTotalItems(mockGrades.length);
      // Initialize filtered grades immediately
      setFilteredGrades(mockGrades);
    } catch (error) {
      Alert.alert('Error', 'Failed to load grades. Please try again.');
      console.error('Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGrades();
    setRefreshing(false);
  };

  const filterGrades = () => {
    if (!searchQuery.trim()) {
      setFilteredGrades([...grades]);
      return;
    }

    const filtered = grades.filter(
      (grade) =>
        grade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grade.school.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredGrades(filtered);
  };

  const handleDelete = (gradeId, gradeName) => {
    Alert.alert(
      'Delete Grade',
      `Are you sure you want to delete ${gradeName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Replace with actual API call
              // await apiService.deleteGrade(gradeId);
              setGrades(grades.filter((g) => g.id !== gradeId));
              Alert.alert('Success', 'Grade deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete grade. Please try again.');
              console.error('Error deleting grade:', error);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (gradeId) => {
    if (onGoToUpsertGrade) {
      onGoToUpsertGrade(gradeId);
    } else {
      Alert.alert('Edit Grade', `Edit functionality for grade ${gradeId} will be implemented`);
    }
  };

  const handleAddNew = () => {
    if (onGoToUpsertGrade) {
      onGoToUpsertGrade(null);
    } else {
      Alert.alert('Add Grade', 'Add grade functionality will be implemented');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGrades = filteredGrades.slice(startIndex, endIndex);
  const startItem = filteredGrades.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(endIndex, filteredGrades.length);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.manageGradesHeader}>
        <View style={styles.manageGradesHeaderContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.manageGradesHeaderTitle}>Manage Grades</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.manageGradesMainContent}>
        {/* Search and Add Button Section */}
        <View style={styles.manageGradesToolbar}>
          <View style={styles.manageGradesSearchContainer}>
            <TextInput
              style={styles.manageGradesSearchInput}
              placeholder="Search grades..."
              placeholderTextColor={colors.gray500}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Text style={styles.manageGradesSearchIcon}>🔍</Text>
          </View>
          <TouchableOpacity
            style={styles.manageGradesAddButton}
            onPress={handleAddNew}
          >
            <Text style={styles.manageGradesAddButtonText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Items Per Page Selector */}
        <View style={styles.manageGradesItemsPerPageContainer}>
          <Text style={styles.manageGradesItemsPerPageLabel}>Show</Text>
          <View style={styles.manageGradesItemsPerPageSelect}>
            <TouchableOpacity
              style={[
                styles.manageGradesItemsPerPageOption,
                itemsPerPage === 10 && styles.manageGradesItemsPerPageOptionActive,
              ]}
              onPress={() => handleItemsPerPageChange(10)}
            >
              <Text
                style={[
                  styles.manageGradesItemsPerPageOptionText,
                  itemsPerPage === 10 && styles.manageGradesItemsPerPageOptionTextActive,
                ]}
              >
                10
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.manageGradesItemsPerPageOption,
                itemsPerPage === 25 && styles.manageGradesItemsPerPageOptionActive,
              ]}
              onPress={() => handleItemsPerPageChange(25)}
            >
              <Text
                style={[
                  styles.manageGradesItemsPerPageOptionText,
                  itemsPerPage === 25 && styles.manageGradesItemsPerPageOptionTextActive,
                ]}
              >
                25
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.manageGradesItemsPerPageOption,
                itemsPerPage === 50 && styles.manageGradesItemsPerPageOptionActive,
              ]}
              onPress={() => handleItemsPerPageChange(50)}
            >
              <Text
                style={[
                  styles.manageGradesItemsPerPageOptionText,
                  itemsPerPage === 50 && styles.manageGradesItemsPerPageOptionTextActive,
                ]}
              >
                50
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.manageGradesItemsPerPageOption,
                itemsPerPage === 100 && styles.manageGradesItemsPerPageOptionActive,
              ]}
              onPress={() => handleItemsPerPageChange(100)}
            >
              <Text
                style={[
                  styles.manageGradesItemsPerPageOptionText,
                  itemsPerPage === 100 && styles.manageGradesItemsPerPageOptionTextActive,
                ]}
              >
                100
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.manageGradesItemsPerPageLabel}>entries</Text>
        </View>

        {/* Grades List */}
        <ScrollView
          style={styles.manageGradesContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.manageGradesLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.manageGradesLoadingText}>Loading grades...</Text>
            </View>
          ) : paginatedGrades.length === 0 ? (
            <View style={styles.manageGradesEmptyContainer}>
              <Text style={styles.manageGradesEmptyText}>
                {searchQuery ? 'No grades found matching your search.' : 'No grades found.'}
              </Text>
            </View>
          ) : (
            <View style={styles.manageGradesTable}>
              {/* Table Header */}
              <View style={styles.manageGradesTableHeader}>
                <View style={[styles.manageGradesTableHeaderCell, { flex: 0.8 }]}>
                  <Text style={styles.manageGradesTableHeaderText}>#</Text>
                </View>
                <View style={[styles.manageGradesTableHeaderCell, { flex: 2 }]}>
                  <Text style={styles.manageGradesTableHeaderText}>GRADE NAME</Text>
                </View>
                <View style={[styles.manageGradesTableHeaderCell, { flex: 3 }]}>
                  <Text style={styles.manageGradesTableHeaderText}>SCHOOL</Text>
                </View>
                <View style={[styles.manageGradesTableHeaderCell, { flex: 2.2 }]}>
                  <Text style={styles.manageGradesTableHeaderText}>ACTIONS</Text>
                </View>
              </View>

              {/* Table Rows */}
              {paginatedGrades.map((grade, index) => (
                <View key={grade.id} style={styles.manageGradesTableRow}>
                  <View style={[styles.manageGradesTableCell, { flex: 0.8 }]}>
                    <Text style={styles.manageGradesTableCellText}>{grade.id}</Text>
                  </View>
                  <View style={[styles.manageGradesTableCell, { flex: 2 }]}>
                    <Text style={styles.manageGradesTableCellText} numberOfLines={1}>{grade.name}</Text>
                  </View>
                  <View style={[styles.manageGradesTableCell, { flex: 3 }]}>
                    <Text style={[styles.manageGradesTableCellText, styles.manageGradesTableCellSchool]} numberOfLines={2}>
                      {grade.school}
                    </Text>
                  </View>
                  <View style={[styles.manageGradesTableCell, styles.manageGradesTableActionsCell, { flex: 2.2 }]}>
                    <TouchableOpacity
                      style={styles.manageGradesEditButton}
                      onPress={() => handleEdit(grade.id)}
                    >
                      <Text style={styles.manageGradesEditButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.manageGradesDeleteButton}
                      onPress={() => handleDelete(grade.id, grade.name)}
                    >
                      <Text style={styles.manageGradesDeleteButtonText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Pagination */}
        {!loading && filteredGrades.length > 0 && (
          <View style={styles.manageGradesPagination}>
            <View style={styles.manageGradesPaginationInfo}>
              <Text style={styles.manageGradesPaginationText}>
                Showing {startItem} to {endItem} of {filteredGrades.length} entries
              </Text>
            </View>
            <View style={styles.manageGradesPaginationControls}>
              <TouchableOpacity
                style={[
                  styles.manageGradesPaginationButton,
                  currentPage === 1 && styles.manageGradesPaginationButtonDisabled,
                ]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text
                  style={[
                    styles.manageGradesPaginationButtonText,
                    currentPage === 1 && styles.manageGradesPaginationButtonTextDisabled,
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => {
                let pageNum;
                if (totalPages <= 6) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <TouchableOpacity
                    key={pageNum}
                    style={[
                      styles.manageGradesPaginationButton,
                      styles.manageGradesPaginationPageButton,
                      currentPage === pageNum && styles.manageGradesPaginationButtonActive,
                    ]}
                    onPress={() => goToPage(pageNum)}
                  >
                    <Text
                      style={[
                        styles.manageGradesPaginationButtonText,
                        currentPage === pageNum && styles.manageGradesPaginationButtonTextActive,
                      ]}
                    >
                      {pageNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.manageGradesPaginationButton,
                  currentPage === totalPages && styles.manageGradesPaginationButtonDisabled,
                ]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text
                  style={[
                    styles.manageGradesPaginationButtonText,
                    currentPage === totalPages && styles.manageGradesPaginationButtonTextDisabled,
                  ]}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default ManageGradesScreen;

