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
    .map((s, index) => {
      const name = String((s.name || s.studentName || '').trim());
      const rawId = String(s.id || s.studentId || '').trim();
      const id =
        rawId ||
        `student_${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)}`;
      return {
        id,
        name,
        age: s.age != null ? String(s.age) : '',
        gender: s.gender != null ? String(s.gender) : '',
        schoolLabel:
          s.schoolLabel != null ? String(s.schoolLabel) : s.school != null ? String(s.school) : '',
        gradeLabel:
          s.gradeLabel != null ? String(s.gradeLabel) : s.class != null ? String(s.class) : '',
      };
    })
    .filter((s) => s.name);
}

export const CHECKOUT_STUDENT_NAME_KEY = 'checkoutOrderingStudentName';

export function readCheckoutStudentName(locationState) {
  const fromState =
    locationState?.studentName && String(locationState.studentName).trim();
  if (fromState) return fromState;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(CHECKOUT_STUDENT_NAME_KEY);
    if (stored?.trim()) return stored.trim();
  }
  return '';
}

export function persistCheckoutStudentName(name) {
  if (typeof window === 'undefined') return;
  const trimmed = String(name || '').trim();
  if (trimmed) {
    sessionStorage.setItem(CHECKOUT_STUDENT_NAME_KEY, trimmed);
  } else {
    sessionStorage.removeItem(CHECKOUT_STUDENT_NAME_KEY);
  }
}

export function orderingStudentFromName(name) {
  if (!name || !String(name).trim()) return null;
  return toOrderingStudentPayload({ id: '', name: String(name).trim() });
}

/** Build order "ordering for" payload from shipping address student name. */
export function orderingStudentFromShippingAddress(address) {
  if (!address?.studentName || !String(address.studentName).trim()) {
    return null;
  }
  return toOrderingStudentPayload({
    id: '',
    name: String(address.studentName).trim(),
  });
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

