import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import ApiService from '../services/apiService';

const SearchScreen = () => {
  const navigate = useNavigate();
  const [schoolCode, setSchoolCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSchoolSelected, setIsSchoolSelected] = useState(false);
  const [searchMode, setSearchMode] = useState('code'); // 'code' or 'name'
  const [searchResults, setSearchResults] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search for school code
  useEffect(() => {
    if (searchMode === 'code' && schoolCode.length > 0) {
      const timer = setTimeout(() => {
        handleCodeSearch(schoolCode);
      }, 300); // 300ms debounce

      return () => clearTimeout(timer);
    } else {
      setFilteredSchools([]);
      setShowDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolCode, searchMode]);

  const handleCodeSearch = async (text) => {
    setIsSearching(true);
    setIsSchoolSelected(false);
    
    try {
      const result = await ApiService.searchSchools(text, 10);
      
      if (result.success && result.data && result.data.length > 0) {
        setFilteredSchools(result.data);
        setShowDropdown(true);
      } else {
        setFilteredSchools([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      setFilteredSchools([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNameSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a school name to search');
      return;
    }

    setIsSearching(true);
    try {
      const result = await ApiService.searchSchools(searchQuery.trim(), 20);
      
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
        alert(result.message || 'No schools found');
      }
    } catch (error) {
      console.error('Error searching schools:', error);
      alert('Failed to search schools. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSchoolSelect = (school) => {
    if (searchMode === 'code') {
      setSchoolCode(school.code);
      setIsSchoolSelected(true);
      setShowDropdown(false);
      setFilteredSchools([]);
    } else {
      // Handle school selection from name search
      handleSchoolContinue(school);
    }
  };

  const handleSchoolContinue = async (school = null) => {
    const codeToValidate = school ? school.code : schoolCode.trim();
    
    if (!codeToValidate) {
      alert('Please enter or select a school code');
      return;
    }
    
    try {
      setIsValidating(true);
      
      // If school is already provided, use it directly
      if (school) {
        navigate(`/school/${school.id}`);
        return;
      }

      // Otherwise validate the code
      const result = await ApiService.validateSchoolCode(codeToValidate);
      
      if (result.success && result.isValid && result.data) {
        navigate(`/school/${result.data.id}`);
      } else {
        alert(result.message || 'Please enter a valid school code');
      }
    } catch (error) {
      console.error('Error validating school code:', error);
      alert('Failed to validate school code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.searchMainContent}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Title */}
          <h1 style={styles.searchPageTitle}>Find Your School</h1>
          <p style={styles.searchPageSubtitle}>
            Enter your school code or search by school name to get started
          </p>

          {/* Search Mode Toggle */}
          <div style={styles.searchModeToggle}>
            <button
              style={{
                ...styles.searchModeButton,
                ...(searchMode === 'code' && styles.searchModeButtonActive),
              }}
              onClick={() => {
                setSearchMode('code');
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              School Code
            </button>
            <button
              style={{
                ...styles.searchModeButton,
                ...(searchMode === 'name' && styles.searchModeButtonActive),
              }}
              onClick={() => {
                setSearchMode('name');
                setSchoolCode('');
                setFilteredSchools([]);
                setShowDropdown(false);
              }}
            >
              Search by Name
            </button>
          </div>

          {/* School Code Search */}
          {searchMode === 'code' && (
            <div style={styles.searchCodeContainer}>
              <div style={styles.searchCodeInputWrapper}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    style={{
                      ...styles.searchCodeInput,
                      ...(isSchoolSelected && { borderColor: colors.primary, borderWidth: '2px' }),
                    }}
                    placeholder="e.g., SCH-12345"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    onFocus={() => {
                      if (filteredSchools.length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    autoCapitalize="characters"
                  />
                  {isSearching && (
                    <div style={styles.searchLoadingIndicator}>
                      <span>🔍</span>
                    </div>
                  )}
                </div>
                
                {/* Dropdown */}
                {showDropdown && filteredSchools.length > 0 && (
                  <div ref={dropdownRef} style={styles.searchDropdown}>
                    {filteredSchools.map((school) => (
                      <button
                        key={school.id || school.code}
                        style={styles.searchDropdownItem}
                        onClick={() => handleSchoolSelect(school)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.gray50;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={styles.searchDropdownCode}>{school.code}</div>
                        <div style={styles.searchDropdownName}>
                          {school.name} {school.branchName ? `- ${school.branchName}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                style={{
                  ...styles.searchContinueButton,
                  ...(isSchoolSelected && { 
                    backgroundColor: colors.primary,
                    color: colors.white,
                    borderColor: colors.primary,
                  }),
                  ...(isValidating && { opacity: 0.6, cursor: 'not-allowed' }),
                }}
                onClick={() => handleSchoolContinue()}
                disabled={isValidating}
              >
                {isValidating ? 'Validating...' : 'Continue'}
              </button>
            </div>
          )}

          {/* School Name Search */}
          {searchMode === 'name' && (
            <div style={styles.searchNameContainer}>
              <div style={styles.searchNameInputWrapper}>
                <input
                  type="text"
                  style={styles.searchNameInput}
                  placeholder="Search for your school name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSearch();
                    }
                  }}
                />
                <button
                  style={styles.searchNameButton}
                  onClick={handleNameSearch}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : '🔍 Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={styles.searchResultsContainer}>
                  <h3 style={styles.searchResultsTitle}>
                    Found {searchResults.length} school{searchResults.length !== 1 ? 's' : ''}
                  </h3>
                  <div style={styles.searchResultsList}>
                    {searchResults.map((school) => (
                      <button
                        key={school.id || school.code}
                        style={styles.searchResultCard}
                        onClick={() => handleSchoolSelect(school)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.borderColor = colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = colors.borderLight;
                        }}
                      >
                        <div style={styles.searchResultCode}>{school.code}</div>
                        <div style={styles.searchResultName}>
                          {school.name} {school.branchName ? `- ${school.branchName}` : ''}
                        </div>
                        {school.board && (
                          <div style={styles.searchResultBoard}>{school.board}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchScreen;

