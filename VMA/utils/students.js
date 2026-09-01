/**
 * Checkout student name flow (aligned with website/src/utils/students.js).
 * Name is entered on the cart, persisted, then sent as orderingStudent at payment.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHECKOUT_STUDENT_NAME_KEY = 'checkoutOrderingStudentName';

export async function readCheckoutStudentName() {
  try {
    const stored = await AsyncStorage.getItem(CHECKOUT_STUDENT_NAME_KEY);
    if (stored?.trim()) return stored.trim();
  } catch (_) {
    /* ignore */
  }
  return '';
}

export async function persistCheckoutStudentName(name) {
  const trimmed = String(name || '').trim();
  try {
    if (trimmed) {
      await AsyncStorage.setItem(CHECKOUT_STUDENT_NAME_KEY, trimmed);
    } else {
      await AsyncStorage.removeItem(CHECKOUT_STUDENT_NAME_KEY);
    }
  } catch (_) {
    /* ignore */
  }
}

export function orderingStudentFromName(name) {
  if (!name || !String(name).trim()) return null;
  return toOrderingStudentPayload({ id: '', name: String(name).trim() });
}

export function toOrderingStudentPayload(student) {
  if (!student || !student.name || !String(student.name).trim()) {
    return null;
  }
  return {
    id: student.id != null && String(student.id).trim() ? String(student.id) : null,
    name: String(student.name).trim(),
    age: student.age ? String(student.age) : null,
    gender: student.gender ? String(student.gender) : null,
    schoolLabel: student.schoolLabel ? String(student.schoolLabel) : null,
    gradeLabel: student.gradeLabel ? String(student.gradeLabel) : null,
  };
}
