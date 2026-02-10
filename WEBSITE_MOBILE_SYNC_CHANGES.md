# Website ↔ Mobile App Sync: Changes to Implement on Website

This document lists **all changes made in the mobile app (VMA)** and the **equivalent changes to implement on the website** so users have a consistent experience across the platform.

---

## 1. Product Types / Categories (Backend & Admin Already Done)

- **Admin panel:** "Textbook" was renamed to **"Mandatory Textbook"**; added **Mandatory Notebook**, **Optional 1**, **Optional 2**, **Optional 3**, **Optional 4**.
- **Backend (mobile app backend):** Mandatory types = `TEXTBOOK`, `MANDATORY_NOTEBOOK`; all others (NOTEBOOK, STATIONARY, UNIFORM, OPTIONAL_1–4, OTHER) are optional.

The website uses the same backend/API, so no API changes are needed. Only frontend (website) UI and logic need to match the mobile app.

---

## 2. Grade Books Page (Website: `website/src/components/GradeBooksPage.js`)

### 2.1 Mandatory Notebooks Section

**Mobile (done):**  
- Added a **Mandatory Notebooks** section (same behaviour as Mandatory Textbooks: always included, no checkbox).  
- Books with `bookType === 'MANDATORY_NOTEBOOK'` go into `mandatoryNotebooks`; `TEXTBOOK` stays in `textbooks`.

**Website (to do):**

- Add state: `const [mandatoryNotebooks, setMandatoryNotebooks] = useState([])`.
- In `loadBooks`, when categorising:
  - `bookType === 'TEXTBOOK'` → `textbooksList`
  - `bookType === 'MANDATORY_NOTEBOOK'` → `mandatoryNotebooksList`
  - Else → `optionalByType` (with friendly title, see 2.3).
- Reset: when no categories, also `setMandatoryNotebooks([])`.
- In `handleAddAllToCart`, include: `...mandatoryNotebooks.map(book => book.id)` in `itemsToAdd` (with textbooks and selected optional).
- Add a **Mandatory Notebooks** UI section (same structure as Mandatory Textbooks): heading "Mandatory Notebooks", list of books, no checkbox. Reuse the same card/table component as Mandatory Textbooks if possible.

### 2.2 Optional Bundles Unchecked by Default

**Mobile (done):**  
- `selectedBundles` initial state: all optional types (`NOTEBOOK`, `UNIFORM`, `STATIONARY`, `OPTIONAL_1`–`OPTIONAL_4`, `OTHER`) are **`false`** (unchecked).

**Website (to do):**

- In `loadBooks`, set `initialSelectedBundles[typeKey] = false` for every optional type (instead of `true`).  
- Remove any logic that pre-checks optional bundles by default.

### 2.3 Optional Section Always Visible

**Mobile (done):**  
- Optional bundles list is **always** shown when there are optional types (no condition like “only show if at least one optional is selected”).

**Website (to do):**

- Ensure the optional bundles section is visible whenever `Object.keys(optionalItemsByType).length > 0`, regardless of `selectedBundles`. Users should always see optional types and check the ones they want.

### 2.4 Friendly Display Names for Optional Types

**Mobile (done):**  
- Optional type titles: `OPTIONAL_1` → "Optional 1", `OPTIONAL_2` → "Optional 2", etc.; `MANDATORY_NOTEBOOK` not in optional list.

**Website (to do):**

- Add a helper, e.g. `getOptionalTypeTitle(typeKey)`:
  - `OPTIONAL_1` → `'Optional 1'`
  - `OPTIONAL_2` → `'Optional 2'`
  - `OPTIONAL_3` → `'Optional 3'`
  - `OPTIONAL_4` → `'Optional 4'`
  - Else: `typeKey.charAt(0) + typeKey.slice(1).toLowerCase().replace(/_/g, ' ')`
- When building `optionalByType[typeKey]`, set `title: getOptionalTypeTitle(typeKey)`.

### 2.5 Add-to-Cart / Stock Error Messaging

**Mobile (done):**  
- On **INSUFFICIENT_STOCK**: if `bookType === 'TEXTBOOK' || bookType === 'MANDATORY_NOTEBOOK'` → show “grade blocked” message; else → “uncheck [bundle]” for that optional type.

**Website (to do):**

- Where add-to-cart or API errors are handled, treat mandatory as `bookType === 'TEXTBOOK' || bookType === 'MANDATORY_NOTEBOOK'` and show the same two messages (grade blocked vs uncheck bundle). Use the same copy as the mobile app if possible.

---

## 3. Cart Page (Website: `website/src/components/CartPage.js` and cart components)

### 3.1 Mandatory = Textbooks + Mandatory Notebooks

**Mobile (done):**  
- “Mandatory” = `bookType === 'TEXTBOOK' || bookType === 'MANDATORY_NOTEBOOK'`.  
- Cart has two sections: **Mandatory Textbooks** and **Mandatory Notebooks**.  
- Mandatory items cannot be removed; quantity cannot go below 1.

**Website (to do):**

- Replace any “is textbook” / “is mandatory” check with:  
  `item.bookType === 'TEXTBOOK' || item.bookType === 'MANDATORY_NOTEBOOK'`.
- In `groupItemsByCategory` (or equivalent), group into:
  - `textbooks` (TEXTBOOK)
  - `mandatoryNotebooks` (MANDATORY_NOTEBOOK)
  - `optionalByType` (all other types).
- Render two sections: “Mandatory Textbooks” and “Mandatory Notebooks” (each with its list). Then “Optional” by type.
- Disable remove/minus for mandatory items and show a short message (e.g. “Mandatory items cannot be removed”) if the user tries.

### 3.2 Category Display Names

**Mobile (done):**  
- Same `getOptionalTypeTitle` for optional types (Optional 1, Optional 2, etc.).

**Website (to do):**

- Use the same `getCategoryName` / display-name logic everywhere cart items are shown (CartPage, CartTable, CartItem, etc.):
  - TEXTBOOK → “Mandatory Textbook” / “Textbooks” (match mobile label).
  - MANDATORY_NOTEBOOK → “Mandatory Notebook” / “Mandatory Notebooks”.
  - OPTIONAL_1 → “Optional 1”, OPTIONAL_2 → “Optional 2”, etc.
  - NOTEBOOK, STATIONARY, UNIFORM, OTHER → same as today or as on mobile.

---

## 4. Checkout Page (Website: `website/src/components/CheckoutPage.js` and checkout components)

### 4.1 Mandatory vs Optional in Order Summary

**Mobile (done):**  
- Order summary shows: “Mandatory Textbooks Bundle”, “Mandatory Notebooks Bundle”, then optional bundles by type (with same display names).

**Website (to do):**

- Group cart items the same way: textbooks, mandatoryNotebooks, optionalByType.
- In the order summary (and any breakdown), show:
  - Mandatory Textbooks Bundle (count + amount)
  - Mandatory Notebooks Bundle (count + amount)
  - Optional bundles (e.g. “Notebook”, “Optional 1”, …) with same names as cart/grade page.

### 4.2 Sort Order

**Mobile (done):**  
- Mandatory textbooks first, then mandatory notebooks, then optional by type.

**Website (to do):**

- When sorting or displaying groups, use the same order: TEXTBOOK, MANDATORY_NOTEBOOK, then optional types (e.g. NOTEBOOK, OPTIONAL_1, …).

---

## 5. Category / Display Name Helpers (Website-wide)

**Mobile (done):**  
- Single place for “Mandatory Textbook”, “Mandatory Notebook”, “Optional 1”–“Optional 4”, “Notebook”, “Stationary”, “Uniform”, “Other”.

**Website (to do):**

- Add a shared helper (e.g. in `website/src/utils/categoryNames.js` or inside an existing config/theme file):

```js
export const getCategoryDisplayName = (bookType) => {
  if (!bookType) return 'Other';
  const u = (bookType || '').toUpperCase();
  const map = {
    TEXTBOOK: 'Mandatory Textbook',
    MANDATORY_NOTEBOOK: 'Mandatory Notebook',
    NOTEBOOK: 'Notebook',
    STATIONARY: 'Stationary',
    STATIONERY: 'Stationary',
    UNIFORM: 'Uniform',
    OPTIONAL_1: 'Optional 1',
    OPTIONAL_2: 'Optional 2',
    OPTIONAL_3: 'Optional 3',
    OPTIONAL_4: 'Optional 4',
    OTHER: 'Other',
  };
  return map[u] || (u.charAt(0) + u.slice(1).toLowerCase().replace(/_/g, ' '));
};
```

- Use this in: GradeBooksPage, CartPage, CartTable, CartItem, CheckoutPage, OrderDetailsPage, OrderHistoryPage, and anywhere else `bookType` is shown.

---

## 6. Images / Icons (Website: `website/src/config/imagePaths.js`)

**Mobile (done):**  
- Mandatory Notebooks use the **same** icon as optional Notebooks (e.g. 📦 or the same image).

**Website (to do):**

- In `getProductImageByCategory` (and any category image helper), add:
  - `MANDATORY_NOTEBOOK` → same image as NOTEBOOK (e.g. `PRODUCT_IMAGES.NOTEBOOK`).
- Add `OPTIONAL_1`–`OPTIONAL_4` if you use per-type images (e.g. same as NOTEBOOK or a generic “optional” image).  
- Ensure “Mandatory Textbook” still uses the textbook image; “Mandatory Notebook” uses the notebook image.

---

## 7. Cart API / Item Shape (Website: `website/src/services/apiService.js` and cart types)

**Mobile (done):**  
- Cart items include `bookType` and `productQuantity` (units per bundle).  
- Backend returns these; mobile shows “Qty: X (per bundle)” when `productQuantity > 1`.

**Website (to do):**

- Ensure cart response mapping includes `bookType` and `productQuantity` (or equivalent) for each item.
- In cart/checkout UI, show “Qty: X (per bundle)” when relevant, same as mobile.

---

## 8. Files to Touch on Website (Checklist)

| Area              | File(s) |
|-------------------|--------|
| Grade books       | `GradeBooksPage.js`, `OptionalItemsCombo.js`, `OptionalBundleSection.js`, `AddToCartButton.js`, `TextbookList.js` (or equivalent) |
| Cart              | `CartPage.js`, `CartTable.js`, `CartItem.js`, `CartSummary.js` |
| Checkout          | `CheckoutPage.js`, checkout `OrderSummary.js` (or equivalent) |
| Orders            | `OrderDetailsPage.js`, `OrderHistoryPage.js` |
| Config / shared   | `imagePaths.js`, new `utils/categoryNames.js` (or existing config) |
| Books / shared    | `BookCard.js`, `BookTable.js` if they show `bookType` |

---

## 9. Short Summary of Behaviour to Match

1. **Product types:** Mandatory Textbook, Mandatory Notebook (always in cart for grade); Notebook, Stationary, Uniform, Optional 1–4, Other (optional; user checks what they want).
2. **Grade page:** Mandatory Textbooks section → Mandatory Notebooks section → Optional section (all optional types listed, **unchecked by default**; optional section always visible when there are optional types).
3. **Cart:** Mandatory Textbooks + Mandatory Notebooks (no remove, min qty 1); then Optional by type with same display names.
4. **Checkout:** Same grouping and labels (Mandatory Textbooks Bundle, Mandatory Notebooks Bundle, then optional bundles).
5. **Names everywhere:** “Mandatory Textbook”, “Mandatory Notebook”, “Optional 1”–“Optional 4”, etc., via one shared helper.
6. **Icons:** Mandatory Notebook uses same icon as Notebook; support OPTIONAL_1–4 if needed.

Once these are implemented on the website, behaviour and naming will match the mobile app and the platform will be consistent.
