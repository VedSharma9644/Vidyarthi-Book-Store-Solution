import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styles, colors } from '../css/styles';
import { getSchoolPageStyles } from '../css/schoolPageStyles';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import { useIsMobile } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

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
  // Match prefix (e.g. "NURSERY (EY1)" -> NURSERY); use longest match so CLASS-10 beats CLASS-1
  for (let i = GRADE_DISPLAY_ORDER.length - 1; i >= 0; i--) {
    if (n.startsWith(GRADE_DISPLAY_ORDER[i].toUpperCase())) return i;
  }
  return 999;
};

const sortGrades = (grades) => {
  return [...grades].sort((a, b) => getGradeOrderIndex(a.name) - getGradeOrderIndex(b.name));
};

const SchoolPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const headerHeight = useHeaderHeight();
  const isMobile = useIsMobile();
  const [school, setSchool] = useState(null);
  const [grades, setGrades] = useState([]);
  const [sectionsByGradeId, setSectionsByGradeId] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchool();
  }, [schoolId]);

  const loadSchool = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSectionsByGradeId({});

      if (!schoolId) {
        setError('No school identifier provided');
        setIsLoading(false);
        return;
      }

      const result = await ApiService.getSchoolById(schoolId);

      if (result.success && result.data) {
        setSchool(result.data);

        const gradesResult = await ApiService.getGradesBySchoolId(schoolId);
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
                  .filter((book) => book.schoolId === schoolId && book.gradeId)
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
    navigate(`/grade/${grade.id}`, {
      state: {
        gradeName: grade.name,
        schoolId,
        subgradeId: section?.id || null,
        subgradeName: section?.name || null,
      },
    });
  };

  const handleViewAllBooks = (grade) => {
    navigate(`/grade/${grade.id}`, {
      state: {
        gradeName: grade.name,
        schoolId,
      },
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

  const schoolPageStyles = getSchoolPageStyles(headerHeight);

  return (
    <div style={schoolPageStyles.pageContainer}>
      <div style={schoolPageStyles.pageContent}>
        {/* School Banner - no top margin/padding so it touches the header */}
        <div style={schoolPageStyles.bannerWrap}>
          <img
            src={getSchoolBannerImage()}
            alt={school.name}
            style={{
              width: '100%',
              height: '218px',
              borderRadius: '8px',
              objectFit: 'contain',
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
          ...schoolPageStyles.sectionPadding,
          color: colors.textPrimary,
          fontSize: '28px',
          fontWeight: 'bold',
          paddingTop: 0,
          paddingBottom: 0,
          margin: '12px 0',
        }}>
          {school.name}
        </h1>

        {/* School Address */}
        <p style={{
          ...schoolPageStyles.sectionPadding,
          color: colors.textPrimary,
          fontSize: '16px',
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: '12px',
        }}>
          {getSchoolAddress() || 'Address not available'}
        </p>

        {/* Grades and sections on school page */}
        {grades.length === 0 ? (
          <div style={{ ...schoolPageStyles.sectionPadding, padding: '16px' }}>
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
            ...schoolPageStyles.sectionPadding,
            paddingTop: '20px',
            paddingBottom: '16px',
            width: '100%',
            display: 'grid',
            // On mobile: 1 grade per row, on larger screens: 3 per row
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {grades.map((grade) => {
              const sections = sectionsByGradeId[grade.id] || [];
              return (
                <div
                  key={grade.id}
                  style={{
                    backgroundColor: '#d2f7ff',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #a8e8f0',
                  }}
                >
                  <h3 style={{
                    color: colors.textPrimary,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: '0 0 12px 0',
                  }}>
                    {grade.name}
                  </h3>
                  <p style={{
                    color: colors.textPrimary,
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 10px 0',
                  }}>
                    Select Language
                  </p>
                  {sections.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleViewAllBooks(grade)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '14px 16px',
                        backgroundColor: colors.white || '#ffffff',
                        border: `1px solid ${colors.borderLight || colors.gray200 || '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '16px',
                        color: colors.textPrimary,
                        fontWeight: '500',
                        transition: 'background-color 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray50 || '#f9fafb';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.white || '#ffffff';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>View all books</span>
                      <span style={{ color: colors.textSecondary || '#6b7280', fontSize: '18px' }}>→</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => handleSelectSection(grade, section)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            padding: '14px 16px',
                            backgroundColor: colors.white || '#ffffff',
                            border: `1px solid ${colors.borderLight || colors.gray200 || '#e5e7eb'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '16px',
                            color: colors.textPrimary,
                            fontWeight: '500',
                            transition: 'background-color 0.2s, box-shadow 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.gray50 || '#f9fafb';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.white || '#ffffff';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span>{section.name}</span>
                          <span style={{ color: colors.textSecondary || '#6b7280', fontSize: '18px' }}>→</span>
                        </button>
                      ))}
                    </div>
                  )}
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

