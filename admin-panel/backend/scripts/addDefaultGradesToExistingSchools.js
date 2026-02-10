// Script to backfill default grades for all existing schools
// Run once from the backend folder:
//   node scripts/addDefaultGradesToExistingSchools.js

const { db } = require('../config/database');
const Grade = require('../models/Grade');
const School = require('../models/School');
const { DEFAULT_GRADES } = require('../constants/defaultGrades');

async function addDefaultsForSchool(schoolDoc) {
  const school = School.fromFirestore(schoolDoc);
  const schoolId = school.id;

  console.log(`\n▶ Processing school: ${school.name} (${schoolId})`);

  // Fetch existing grades for this school
  const existingSnapshot = await db
    .collection('grades')
    .where('schoolId', '==', schoolId)
    .where('isActive', '==', true)
    .get();

  const existingNames = new Set();
  existingSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (data.name) {
      existingNames.add(String(data.name).trim().toUpperCase());
    }
  });

  const now = new Date();
  const batch = db.batch();
  let createdCount = 0;

  for (const { name, displayOrder } of DEFAULT_GRADES) {
    const key = String(name).trim().toUpperCase();
    if (existingNames.has(key)) {
      continue; // grade already exists for this school
    }

    const grade = new Grade({
      name,
      schoolId,
      displayOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const gradeRef = db.collection('grades').doc();
    batch.set(gradeRef, grade.toFirestore());
    createdCount += 1;
  }

  if (createdCount === 0) {
    console.log('  ✅ All default grades already present. No changes.');
    return;
  }

  await batch.commit();
  console.log(`  ✅ Created ${createdCount} missing default grade(s).`);
}

async function main() {
  try {
    console.log('=== Backfilling default grades for existing schools ===');
    const schoolsSnapshot = await db.collection('schools').where('isActive', '==', true).get();

    if (schoolsSnapshot.empty) {
      console.log('No active schools found. Nothing to do.');
      process.exit(0);
    }

    console.log(`Found ${schoolsSnapshot.size} active school(s).`);

    let index = 0;
    for (const schoolDoc of schoolsSnapshot.docs) {
      index += 1;
      console.log(`\n[${index}/${schoolsSnapshot.size}] ---------------------------------------`);
      await addDefaultsForSchool(schoolDoc);
    }

    console.log('\n✅ Backfill complete.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    process.exit(1);
  }
}

main();

