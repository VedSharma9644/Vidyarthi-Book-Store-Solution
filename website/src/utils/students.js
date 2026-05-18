/**
 * Normalize students array from user profile payload.
 * @param {object|null|undefined} user
 * @returns {Array<{ id: string, name: string, age?: string, gender?: string, schoolLabel?: string, gradeLabel?: string }>}
 */
export function normalizeStudentsFromUser(user) {
  if (!user || !Array.isArray(user.students)) {
    return [];
  }
  return user.students
    .filter((s) => s && (s.name || s.studentName))
    .map((s) => ({
      id: String(s.id || ''),
      name: String((s.name || s.studentName || '').trim()),
      age: s.age != null ? String(s.age) : '',
      gender: s.gender != null ? String(s.gender) : '',
      schoolLabel: s.schoolLabel != null ? String(s.schoolLabel) : s.school != null ? String(s.school) : '',
      gradeLabel: s.gradeLabel != null ? String(s.gradeLabel) : s.class != null ? String(s.class) : '',
    }))
    .filter((s) => s.id && s.name);
}

export function toOrderingStudentPayload(student) {
  if (!student || !student.name || !String(student.name).trim()) {
    return null;
  }
  return {
    id: student.id != null ? String(student.id) : null,
    name: String(student.name).trim(),
    age: student.age ? String(student.age) : null,
    gender: student.gender ? String(student.gender) : null,
    schoolLabel: student.schoolLabel ? String(student.schoolLabel) : null,
    gradeLabel: student.gradeLabel ? String(student.gradeLabel) : null,
  };
}

export function newStudentId() {
  return `stu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

