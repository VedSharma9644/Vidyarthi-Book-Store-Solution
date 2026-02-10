/**
 * Default grades created for every new school.
 * displayOrder controls sequence everywhere (admin, website, mobile app).
 * Admin can still add more grades per school if needed.
 */
const DEFAULT_GRADES = [
  { name: 'NURSERY', displayOrder: 0 },
  { name: 'PP-1', displayOrder: 1 },
  { name: 'PP-2', displayOrder: 2 },
  { name: 'CLASS-1', displayOrder: 3 },
  { name: 'CLASS-2', displayOrder: 4 },
  { name: 'CLASS-3', displayOrder: 5 },
  { name: 'CLASS-4', displayOrder: 6 },
  { name: 'CLASS-5', displayOrder: 7 },
  { name: 'CLASS-6', displayOrder: 8 },
  { name: 'CLASS-7', displayOrder: 9 },
  { name: 'CLASS-8', displayOrder: 10 },
  { name: 'CLASS-9', displayOrder: 11 },
  { name: 'CLASS-10', displayOrder: 12 },
  { name: 'CLASS-11', displayOrder: 13 },
  { name: 'CLASS-12', displayOrder: 14 },
];

module.exports = { DEFAULT_GRADES };
