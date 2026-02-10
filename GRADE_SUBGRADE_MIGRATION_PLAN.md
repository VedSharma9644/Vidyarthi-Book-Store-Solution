# Grade & Subgrade (Section) Migration Plan

## 1. Current Database & Flow Summary

### 1.1 Active Stack (Firestore)

The **admin-panel** (Node/Express) and **Vidyarthi Mobile App backend** use **Firestore**. The **website** and **VMA** (mobile app) consume this backend.

| Collection   | Key Fields | Relationships |
|-------------|------------|----------------|
| **schools** | name, branchName, code, board, address, city, state, phoneNumber, email, schoolLogo, isActive | — |
| **grades**  | name, schoolId, displayOrder, isActive | Belongs to School (grades.schoolId) |
| **categories** | name, description, imageUrl, gradeId, isActive | Belongs to Grade (categories.gradeId) |
| **books**   | title, author, isbn, price, categoryId, **gradeId**, **schoolId**, bookType, stockQuantity, ... | Belongs to Category; **gradeId/schoolId stored for convenience** |

**Current hierarchy:**  
`School → Grade → Category → Book`  
(Book also stores gradeId and schoolId denormalized.)

### 1.2 How Things Work Today

- **Creating a school:** Admin creates school (admin-panel → Schools → Add). Stored in `schools`.
- **Creating a grade:** Admin creates grade with **name** (e.g. "Class 6 (English)", "Class 6 (Hindi)") and **schoolId**. So each section is a separate grade. Stored in `grades`.
- **Creating a category:** Admin selects School → Grade, then creates category (e.g. "Textbooks", "Notebooks") under that grade. `categories.gradeId` links to grade.
- **Adding products:** Admin selects School → Grade → Category, then adds book. Book gets `categoryId`, `gradeId`, `schoolId` (gradeId/schoolId often derived from category in `bookController.js`).

**Website / Mobile flow:**
1. User enters school (by code or search) → **SchoolPage** loads school and **grades for that school** (`getGradesBySchoolId(schoolId)`).
2. User taps a **grade** (e.g. "Class 6 (English)") → navigates to **GradeBooksPage** with `gradeId`.
3. **GradeBooksPage** loads categories by `gradeId` (`getCategoriesByGradeId(gradeId)`), then loads all books and filters by `book.categoryId in categoryIds` (categories under that grade).

So today, the “grade” in the UI is effectively the **section** (Class 6 English vs Class 6 Hindi). There is no separate “Class 6” parent.

### 1.3 Where Grades Are Used (Touchpoints)

| Area | Files | Usage |
|------|--------|--------|
| **Admin backend** | `admin-panel/backend/models/Grade.js`, `controllers/gradeController.js`, `routes/grades.js`, `controllers/categoryController.js`, `controllers/bookController.js` | CRUD grades; categories filtered by gradeId; books have gradeId, derived from category |
| **Admin frontend** | `admin-panel/frontend/src/pages/Grades.jsx`, `UpsertGrade.jsx`, `UpsertCategory.jsx`, `UpsertBook.jsx`, `Books.jsx`, `Categories.jsx` | List/create/edit grades; category form has School → Grade; book form has School → Grade → Category |
| **Vidyarthi Mobile App backend** | `Vidyarthi Mobile App backend/src/services/gradeService.js`, `categoryService.js`, `bookService.js` | getGradesBySchoolId, getCategoriesByGradeId; books filtered by category (category tied to grade) |
| **Website** | `website/src/components/SchoolPage.js`, `GradeBooksPage.js`, `services/apiService.js`, `routes/AppRoutes.js` | School → list grades → `/grade/:gradeId` → books by categories under that gradeId |
| **VMA (mobile)** | `VMA/components/SchoolPage.js`, `GradeBooksPage.js`, `App.js`, `services/apiService.js`, `ManageGradesScreen.js`, `UpsertGradeScreen.js` | Same flow: school → grades → grade books; manage grades (mobile admin) |
| **Legacy .NET** | `vidyarthibooksonline-main/` (Domain entities, EF migrations) | School → Grade → Category → Book (Book has only CategoryId; Grade has Categories). Not Firestore. |

---

## 2. Target Model: Grade + Subgrade (Section)

### 2.1 Desired Hierarchy

- **Grade** = class level only, e.g. **"Class 6"**, **"Class 7"**. Same fields as now (name, schoolId, displayOrder, isActive). No products attached directly.
- **Subgrade (Section)** = subsection of a grade, e.g. **"English"**, **"Hindi"**. Each has a parent **gradeId**. Products are attached at **subgrade** level (via categories under subgrade).
- **Category** = under **Subgrade** (not Grade). So `category.subgradeId` instead of `category.gradeId`.
- **Book** = linked to category (and thus to a subgrade). Keep `gradeId` and `schoolId` for convenience/filtering; add **subgradeId**.

So:

- **School** → **Grade** (Class 6, 7, …)  
- **Grade** → **Subgrade** (English, Hindi, …)  
- **Subgrade** → **Category** (Textbooks, Notebooks, …)  
- **Book** → Category (and subgradeId, gradeId, schoolId)

### 2.2 New / Changed Firestore Structures

- **grades** (existing, semantics change)
  - Keep: `name`, `schoolId`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`
  - `name` will now be e.g. "Class 6" (no "(English)" in the grade name).

- **subgrades** (new collection)
  - `id` (document id)
  - `gradeId` (parent grade)
  - `name` (e.g. "English", "Hindi")
  - `displayOrder` (number)
  - `isActive` (boolean)
  - `createdAt`, `updatedAt`

- **categories** (change)
  - Remove: `gradeId`
  - Add: `subgradeId` (required). Categories belong to a subgrade.

- **books** (change)
  - Keep: `categoryId`, `gradeId`, `schoolId` (gradeId/schoolId can be derived from category/subgrade but often kept for queries).
  - Add: `subgradeId` (recommended for clarity and indexing).

---

## 3. Migration Strategy

### 3.1 Data Migration (Existing Data)

Current state: each “section” is a grade (e.g. "Class 6 (English)", "Class 6 (Hindi)").

**Option A – Interpret existing grades as subgrades (recommended if names are consistent)**  
- For each existing `grade` document:
  - Parse or map name to a **grade** (e.g. "Class 6") and **subgrade** (e.g. "English").
  - Create a parent **Grade** per (schoolId, class level) if not exists (e.g. one "Class 6" per school).
  - Create a **Subgrade** with `gradeId` = that parent grade, `name` = section part (e.g. "English").
  - Update all **categories** that had `gradeId` = old grade to use `subgradeId` = new subgrade.
  - Update all **books** that had `gradeId` = old grade to use `subgradeId` = new subgrade (and keep `gradeId` = new parent grade).
- Then remove or deprecate the old “section-as-grade” documents (or mark them inactive and never use them again).

**Option B – Fresh start**  
- Create new Grade and Subgrade structure; do not migrate old grades. Old grades stay inactive; new data uses grades + subgrades only.

**Option C – Hybrid**  
- Add subgrades collection and new flows; migrate in batches (e.g. one school at a time) and run old and new flows in parallel until migration is done.

### 3.2 Backward Compatibility / URL and UX

- Today: **School** → list of **grades** (sections) → `/grade/:gradeId` → books.
- Tomorrow: **School** → list of **grades** (Class 6, 7, …) → select **subgrade** (English, Hindi) → then show books (e.g. `/grade/:gradeId/section/:subgradeId` or `/section/:subgradeId`).

So:
- **Routes:** Add a step for “section” (subgrade) or change route to be subgrade-based (e.g. books page by `subgradeId`).
- **APIs:** Add `getSubgradesByGradeId(gradeId)`. Categories and books should be filtered by `subgradeId` where needed; existing `getCategoriesByGradeId` can be replaced or complemented with `getCategoriesBySubgradeId(subgradeId)`.

---

## 4. Implementation Plan (Order of Work)

### Phase 1 – Backend (Admin + Vidyarthi Mobile App backend) ✅ DONE

1. **Subgrade model and Firestore**
   - Add `admin-panel/backend/models/Subgrade.js` (gradeId, name, displayOrder, isActive, createdAt, updatedAt).
   - Create `subgrades` collection in Firestore (no schema file; use the model as source of truth).

2. **Subgrade API (admin-panel)**
   - `controllers/subgradeController.js`: CRUD; list filtered by `gradeId`.
   - `routes/subgrades.js`: GET all (query `gradeId`), GET by id, POST, PUT, DELETE.
   - Register routes in `admin-panel/backend/server.js`.

3. **Category model and API**
   - Add `subgradeId` to `admin-panel/backend/models/Category.js`; keep or drop `gradeId` (recommend: drop after migration, or keep temporarily and sync from subgrade).
   - Category controller: validate subgrade exists; list categories by `subgradeId` (and optionally by gradeId via subgrades).
   - Categories under a grade = all categories whose subgrade belongs to that grade.

4. **Book model and API**
   - Add `subgradeId` to `admin-panel/backend/models/Book.js`. When saving, set `subgradeId` (and optionally gradeId/schoolId) from category’s subgrade/grade/school.
   - `bookController.js`: accept subgradeId; when resolving from category, set book.subgradeId from category’s subgrade.

5. **Vidyarthi Mobile App backend**
   - `services/subgradeService.js`: getSubgradesByGradeId(gradeId), getSubgradeById(id).
   - `controllers/subgrade.controller.js`, `routes/subgrade.routes.js`, register in server.
   - Categories: add endpoint or param to get categories by `subgradeId` (replace or complement getCategoriesByGradeId).
   - Books: ensure filtering by subgrade/category still works (e.g. books by subgradeId or by categoryIds under that subgrade).

### Phase 2 – Admin Frontend ✅ DONE

6. **Grades UI**
   - **Grades.jsx**: List grades as parent only (e.g. "Class 6"). Option: expand row or link to “Sections” to show subgrades.
   - **UpsertGrade.jsx**: Create/edit **Grade** only (name = "Class 6", no sections here).
   - New: **Subgrades** per grade (e.g. "Grades → Class 6 → Sections" or a dedicated “Sections” page). List/create/edit/delete **Subgrade** (name: "English", "Hindi", etc.).

7. **Categories UI**
   - **UpsertCategory.jsx**: Flow = School → **Grade** → **Subgrade** → Category name/description. So category is under subgrade, not grade.
   - **Categories.jsx**: Show category’s grade and subgrade (resolve from subgradeId → grade).

8. **Books UI**
   - **UpsertBook.jsx**: Flow = School → Grade → **Subgrade** → Category → book details. Load categories when subgrade is selected (categories by subgradeId).
   - **Books.jsx**: Show subgrade (and grade) in table; filter by grade/subgrade if needed.

### Phase 3 – Website & VMA (Consumer Apps)

9. **Website**
   - **SchoolPage**: After loading school, fetch **grades** for school (getGradesBySchoolId). Show list of grades (Class 6, Class 7, …).
   - New step: On grade click, fetch **subgrades** for that grade (getSubgradesByGradeId). Show list of sections (English, Hindi, …). On section click → navigate to books page (e.g. `/grade/:gradeId/section/:subgradeId` or `/section/:subgradeId`).
   - **GradeBooksPage** (or rename to SectionBooksPage): Take `subgradeId` (and optionally gradeId for title). Load categories by subgradeId; load books for those categories (same logic as now but filter by subgrade/categories under subgrade).
   - **AppRoutes**: Add route for grade → sections → section books (or one route with subgradeId).

10. **VMA (mobile)**
   - Same flow: School → Grades → **Subgrades** (new screen or modal) → Section books.
   - **SchoolPage**: On grade tap, open subgrade list (or new screen SubgradesList) then on subgrade tap call existing “view books” with subgradeId.
   - **GradeBooksPage**: Accept `subgradeId` (and gradeName/subgradeName for display). Load categories by subgradeId, then books by those categories.
   - **ManageGradesScreen / UpsertGradeScreen**: If these manage “grades” for the school, decide whether they manage parent grades only or also subgrades (likely parent grades only; subgrades managed in admin).

### Phase 4 – Data Migration & Cleanup

11. **Migration script (optional)**
   - Script: for each existing grade (e.g. "Class 6 (English)"):
     - Create or find parent grade "Class 6" for same schoolId.
     - Create subgrade "English" with gradeId = parent grade.
     - Update all categories with old gradeId to subgradeId = new subgrade.
     - Update all books with old gradeId to subgradeId = new subgrade, gradeId = parent grade.
   - Run in staging first; backup Firestore before running in production.

12. **Deprecate old behavior**
   - Remove or stop using “section as grade” in UI and APIs (list only parent grades on school page; books only via subgrade).
   - Optionally keep getCategoriesByGradeId that returns categories for all subgrades under that grade (for backward compatibility) or remove once all clients use subgrades.

---

## 5. Summary Table

| Component | Current | After change |
|-----------|--------|--------------|
| **Grade** | Section (e.g. "Class 6 (English)") | Parent only (e.g. "Class 6") |
| **Subgrade** | — | New; section under grade (e.g. "English", "Hindi") |
| **Category** | category.gradeId | category.subgradeId |
| **Book** | categoryId, gradeId, schoolId | categoryId, **subgradeId**, gradeId, schoolId |
| **School page** | Lists grades (sections) → click → books | Lists grades → click → list subgrades → click → books |
| **Books URL** | `/grade/:gradeId` | e.g. `/grade/:gradeId/section/:subgradeId` or `/section/:subgradeId` |
| **Admin – Add product** | School → Grade → Category | School → Grade → **Subgrade** → Category |

---

## 6. Open Decisions

1. **Naming:** Prefer **"Subgrade"** vs **"Section"** in code and UI (e.g. `subgrades` collection and "Sections" in UI).
2. **Migration:** Use Option A (migrate existing grades to grade+subgrade), B (fresh start), or C (hybrid).
3. **Legacy .NET (vidyarthibooksonline-main):** Whether to add Grade → Subgrade → Category there too or leave it as-is if that stack is not used for this flow.
4. **URL design:** `/grade/:gradeId/section/:subgradeId` vs `/section/:subgradeId` (subgradeId is globally unique).

Once these are decided, implementation can follow the phases above in order.
