import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import { GRADE_IMAGES } from '../config/imagePaths';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import { useIsMobile } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

const SchoolPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const headerHeight = useHeaderHeight();
  const isMobile = useIsMobile();
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchool();
  }, [schoolId]);

  const loadSchool = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!schoolId) {
        setError('No school identifier provided');
        setIsLoading(false);
        return;
      }

      const result = await ApiService.getSchoolById(schoolId);
      
      if (result.success && result.data) {
        setSchool(result.data);
        
        // Fetch grades for this school
        const gradesResult = await ApiService.getGradesBySchoolId(schoolId);
        if (gradesResult.success && gradesResult.data) {
          const transformedGrades = gradesResult.data.map(grade => ({
            id: grade.id,
            name: grade.name,
          }));
          setGrades(transformedGrades);
          console.log('Loaded grades:', transformedGrades);
        } else {
          setGrades([]);
          console.warn('Failed to load grades:', gradesResult.message);
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
    navigate(`/grade/${grade.id}`, { 
      state: { 
        gradeName: grade.name,
        schoolId: schoolId 
      } 
    });
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
    return school?.schoolLogo || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlR5TvAo7qnUZ8Ct1x-LWQ-WKjwYg2DA11C_1L94Ymzq3mWktc4aR_eiKp7_ySpwxGvnY_fYiDLU6SDZPdnEEjFLplcPOPVpwcCpu_dNzl3pEOcfqZET_ER9fs7mrv4OV6BSxqAqJ4U2ZmU-oKVugcsp7h2rD4AvocdvACICt4Y7k2ggJnqOSdKewnWlPAWwsv6GAKTGF3QmwfSQzKityM21DhGkWIW6h84jZKA_lBiM-Agj21JfbYSt2vDuBLrmwki6-TH7GPqiw';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !school) {
    return (
      <div style={styles.container}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: '20px',
        }}>
          <p style={{ fontSize: '18px', color: colors.textPrimary, marginBottom: '20px', textAlign: 'center' }}>
            {error || 'School not found'}
          </p>
          <button
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
            onClick={() => navigate('/search')}
          >
            Go Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.container,
      paddingTop: headerHeight, // Account for fixed top navigation
    }}>
      <div style={{
        ...styles.mainContent,
        justifyContent: 'flex-start',
        flexDirection: 'column',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        paddingTop: '20px',
        paddingBottom: '40px',
      }}>
        {/* School Banner */}
        <div style={{
          padding: '0 16px',
          marginBottom: '20px',
        }}>
          <img
            src={getSchoolBannerImage()}
            alt={school.name}
            style={{
              width: '100%',
              height: '218px',
              borderRadius: '8px',
              objectFit: 'cover',
              backgroundColor: colors.gray100,
              display: 'block',
            }}
            onError={(e) => {
              console.log('Banner image failed to load:', getSchoolBannerImage());
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* School Name */}
        <h1 style={{
          color: colors.textPrimary,
          fontSize: '28px',
          fontWeight: 'bold',
          padding: '0 16px',
          margin: '12px 0',
        }}>
          {school.name}
        </h1>

        {/* School Address */}
        <p style={{
          color: colors.textPrimary,
          fontSize: '16px',
          padding: '0 16px',
          marginBottom: '12px',
        }}>
          {getSchoolAddress() || 'Address not available'}
        </p>

        {/* Available Grades Heading */}
        <h2 style={{
          color: colors.textPrimary,
          fontSize: '22px',
          fontWeight: 'bold',
          padding: '20px 16px 12px',
          margin: 0,
        }}>
          Available Grades
        </h2>

        {/* Grade Cards */}
        {grades.length === 0 ? (
          <div style={{ padding: '16px' }}>
            <p style={{
              color: colors.textSecondary,
              fontSize: '16px',
              textAlign: 'center',
              padding: '20px 0',
            }}>
              No grades available for this school
            </p>
          </div>
        ) : (
          <div style={{ 
            padding: '0 16px 16px', 
            width: '100%',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '16px',
          }}>
            {grades.map((grade) => {
              // Use the default grade image for all grades
              const gradeImage = GRADE_IMAGES.DEFAULT;
              return (
                <div key={grade.id} style={{ width: '100%' }}>
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: colors.gray100,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => handleViewBooks(grade)}
                  >
                    {/* Background Image */}
                    <img
                      src={gradeImage}
                      alt={grade.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 20%',
                        zIndex: 0,
                      }}
                      onError={(e) => {
                        console.log('Grade image failed to load:', gradeImage);
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Dark Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      zIndex: 1,
                    }} />
                    
                    {/* Grade Info */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      padding: '12px',
                      gap: '8px',
                      zIndex: 2,
                    }}>
                      <h3 style={{
                        flex: 1,
                        color: colors.white,
                        fontSize: '18px',
                        fontWeight: 'bold',
                        lineHeight: '22px',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      }}>
                        {grade.name}
                      </h3>
                      <button
                        style={{
                          minWidth: '80px',
                          height: '32px',
                          backgroundColor: '#000000',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 12px',
                          color: colors.white,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          flexShrink: 0,
                          transition: 'background-color 0.2s ease',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBooks(grade);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#333333';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#000000';
                        }}
                      >
                        View Books
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolPage;

