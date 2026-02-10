import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { colors } from '../css/theme';
import { getSchoolPageStyles } from '../css/schoolPageStyles';
import { useHeaderHeight } from '../hooks/useHeaderHeight';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';

const GradeSectionsPage = () => {
  const { gradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const gradeName = location.state?.gradeName || 'Class';
  const schoolId = location.state?.schoolId;

  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSections();
  }, [gradeId]);

  const loadSections = async () => {
    if (!gradeId) {
      setIsLoading(false);
      return;
    }
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

  const handleViewBooks = (section) => {
    navigate(`/grade/${gradeId}`, {
      state: {
        gradeName: section ? `${gradeName} - ${section.name}` : gradeName,
        schoolId,
        subgradeId: section?.id || null,
        subgradeName: section?.name || null,
      },
    });
  };

  const goBack = () => {
    if (schoolId) {
      navigate(`/school/${schoolId}`);
    } else {
      navigate(-1);
    }
  };

  const headerHeight = useHeaderHeight();
  const schoolPageStyles = getSchoolPageStyles(headerHeight);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div style={schoolPageStyles.pageContainer}>
      <div style={schoolPageStyles.pageContent}>
        <div style={{ ...schoolPageStyles.sectionPadding, paddingTop: '16px', paddingBottom: '24px' }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: colors.primary,
              fontSize: '16px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '20px' }}>←</span> Back to school
          </button>

          <h1 style={{
            color: colors.textPrimary,
            fontSize: '26px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
          }}>
            {gradeName}
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: '14px',
            margin: '0 0 24px 0',
          }}>
            Select a section to view books
          </p>

          {error && (
            <p style={{ color: '#b91c1c', marginBottom: '16px' }}>{error}</p>
          )}

          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '20px',
            border: `1px solid ${colors.borderLight || colors.gray200}`,
          }}>
            <h2 style={{
              color: colors.textPrimary,
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 16px 0',
            }}>
              Select section
            </h2>

            {sections.length === 0 ? (
              <p style={{
                color: colors.textSecondary,
                fontSize: '15px',
                margin: '0 0 16px 0',
              }}>
                No sections added for this grade yet.
              </p>
            ) : null}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleViewBooks(section)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: colors.gray50 || colors.gray100,
                    border: `1px solid ${colors.gray200}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '16px',
                    color: colors.textPrimary,
                    fontWeight: '500',
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray100 || '#f3f4f6';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray50 || colors.gray100;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>{section.name}</span>
                  <span style={{ color: colors.textSecondary, fontSize: '18px' }}>→</span>
                </button>
              ))}
            </div>

            {sections.length === 0 && (
              <button
                type="button"
                onClick={() => handleViewBooks(null)}
                style={{
                  marginTop: '16px',
                  padding: '12px 20px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                View all books for this grade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeSectionsPage;
