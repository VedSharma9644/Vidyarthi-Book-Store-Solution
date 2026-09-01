import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { profileStyles, colors } from '../css/profileStyles';
import { borderRadius } from '../css/theme';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { normalizeStudentsFromUser, newStudentId } from '../utils/students';
import { getGradeDisplayLabel } from '../utils/gradeUtils';

function buildStudentsUpdatePayload(userData, studentsList) {
  return {
    students: studentsList,
    phoneNumber: userData?.phoneNumber || null,
    email: userData?.email || null,
  };
}

const StudentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const returnTo = location.state?.returnTo;
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    schoolLabel: '',
    gradeLabel: '',
    age: '',
    gender: '',
  });

  const resolveUserId = () => user?.id || localStorage.getItem('userId');

  const load = async () => {
    try {
      setLoading(true);
      setProfileError(null);
      const userId = resolveUserId();
      if (!userId) {
        setProfileError('Please log in to manage students.');
        setStudents([]);
        return;
      }
      const res = await ApiService.getUserById(userId);
      if (!res?.success || !res.data) {
        setProfileError(
          res?.message || 'Your profile could not be loaded. Please log out and sign in again.'
        );
        setStudents([]);
        return;
      }
      ApiService.storeUserData(res.data);
      setStudents(normalizeStudentsFromUser(res.data));
    } catch (e) {
      console.error(e);
      setProfileError('Could not load your profile. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const saveStudents = async (studentsList) => {
    const userId = resolveUserId();
    const userData = ApiService.getUserData();
    if (!userId || !userData) {
      alert('Please log in again.');
      return { success: false };
    }
    const res = await ApiService.updateUserProfile(
      userId,
      buildStudentsUpdatePayload(userData, studentsList)
    );
    if (!res.success) {
      const msg =
        res.code === 'USER_NOT_FOUND'
          ? 'Your account was not found. Please log out and sign in again.'
          : res.message || 'Could not save student';
      alert(msg);
      if (res.code === 'USER_NOT_FOUND') {
        setProfileError(msg);
      }
      return res;
    }
    if (res.data) {
      ApiService.storeUserData(res.data);
    }
    return res;
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeStudent = async (student) => {
    if (!window.confirm(`Remove ${student.name} from your profile?`)) return;
    try {
      const userData = ApiService.getUserData();
      if (!resolveUserId() || !userData) {
        alert('Please log in again.');
        return;
      }
      const raw = Array.isArray(userData.students) ? userData.students : [];
      const next = raw.filter((s) => String(s?.id) !== String(student.id));
      const res = await saveStudents(next);
      if (!res.success) return;
      await load();
    } catch (e) {
      console.error(e);
      alert('Could not remove student');
    }
  };

  const addStudent = async () => {
    if (!form.name.trim()) {
      alert('Please enter student name');
      return;
    }
    try {
      setSaving(true);
      const userData = ApiService.getUserData();
      if (!resolveUserId() || !userData) {
        alert('Please log in again.');
        return;
      }
      const raw = Array.isArray(userData.students) ? [...userData.students] : [];
      raw.push({
        id: newStudentId(),
        name: form.name.trim(),
        schoolLabel: form.schoolLabel.trim() || '',
        gradeLabel: form.gradeLabel.trim() || '',
        age: form.age.trim() || '',
        gender: form.gender.trim() || '',
      });
      const res = await saveStudents(raw);
      if (!res.success) return;
      setForm({ name: '', schoolLabel: '', gradeLabel: '', age: '', gender: '' });
      setShowAdd(false);
      await load();
      if (returnTo) {
        navigate(returnTo);
      }
    } catch (e) {
      console.error(e);
      alert('Could not save student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={profileStyles.profilePageContainer}>
        <div style={{ ...profileStyles.profileContent, textAlign: 'center', color: colors.textSecondary }}>
          Loading…
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={profileStyles.profilePageContainer}>
        <div style={{ ...profileStyles.profileContent, textAlign: 'center', padding: 24 }}>
          <p style={{ color: colors.textPrimary, marginBottom: 16 }}>{profileError}</p>
          <button
            type="button"
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              padding: '10px 16px',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontWeight: 700,
              marginRight: 12,
            }}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Log in again
          </button>
          <button
            type="button"
            style={{
              backgroundColor: colors.gray200,
              color: colors.textPrimary,
              border: 'none',
              padding: '10px 16px',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontWeight: 700,
            }}
            onClick={() => navigate('/profile')}
          >
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={profileStyles.profilePageContainer}>
      <div style={profileStyles.profileHeader}>
        <div style={profileStyles.profileHeaderContent}>
          <h1 style={profileStyles.profileHeaderTitle}>Students</h1>
        </div>
      </div>

      <div style={profileStyles.profileContent}>
        <div style={{ marginBottom: 16 }}>
          <button
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              padding: '10px 14px',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              fontWeight: 700,
            }}
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? 'Cancel' : 'Add student'}
          </button>
          {returnTo ? (
            <button
              style={{
                marginLeft: 12,
                backgroundColor: colors.gray200,
                color: colors.textPrimary,
                border: 'none',
                padding: '10px 14px',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontWeight: 700,
              }}
              onClick={() => navigate(returnTo)}
            >
              Back to checkout
            </button>
          ) : (
            <button
              style={{
                marginLeft: 12,
                backgroundColor: colors.gray200,
                color: colors.textPrimary,
                border: 'none',
                padding: '10px 14px',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontWeight: 700,
              }}
              onClick={() => navigate('/profile')}
            >
              Back to profile
            </button>
          )}
        </div>

        {showAdd && (
          <div style={{ ...profileStyles.sectionContainer, padding: 20 }}>
            <h2 style={{ ...profileStyles.sectionTitle, marginTop: 0 }}>Add student</h2>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Name *</div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}
                  placeholder="Student name"
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>School (optional)</div>
                <input
                  value={form.schoolLabel}
                  onChange={(e) => setForm((p) => ({ ...p, schoolLabel: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}
                  placeholder="School"
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Grade (optional)</div>
                <input
                  value={form.gradeLabel}
                  onChange={(e) => setForm((p) => ({ ...p, gradeLabel: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}
                  placeholder="Grade"
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Age (optional)</div>
                <input
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}
                  placeholder="Age"
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Gender (optional)</div>
                <input
                  value={form.gender}
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}
                  placeholder="Gender"
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                disabled={saving}
                style={{
                  backgroundColor: colors.active,
                  color: colors.white,
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: borderRadius.md,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  fontWeight: 700,
                }}
                onClick={addStudent}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}

        <div style={profileStyles.sectionContainer}>
          <h2 style={profileStyles.sectionTitle}>Your students</h2>
          {students.length === 0 ? (
            <p style={{ color: colors.textSecondary, margin: 0 }}>
              No students added yet.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {students.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: `1px solid ${colors.borderLight}`,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: colors.textPrimary }}>{s.name}</div>
                    <div style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>
                      {[s.gradeLabel ? getGradeDisplayLabel(s.gradeLabel) : '', s.schoolLabel]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => removeStudent(s)}
                    style={{
                      backgroundColor: '#ffecec',
                      color: '#c0392b',
                      border: '1px solid #f5c6cb',
                      padding: '8px 12px',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;

