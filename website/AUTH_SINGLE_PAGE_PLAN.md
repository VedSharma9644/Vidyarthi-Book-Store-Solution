# Plan: Single-Page Login & Register (Website)

## Goal
- **One auth page** where the user can log in or register (no separate /register page).
- **First-time user**: After OTP (or email sign-up), register the account → redirect to **profile creation / onboarding** page.
- **Returning user**: Login only → redirect to home with all data intact.

---

## Current State (Brief)
- **Routes**: `/login` (LoginScreen), `/register` (RegisterScreen).
- **Login**: Email/password or Mobile OTP; success → home.
- **Register**: Mobile OTP only; collects name, email, password, phone, school; success → home (no profile-completion step).
- **Backend**: `login-mobile` returns **404** with message "User not found. Please register first." when phone is not registered; we can use this to detect first-time users.

---

## Behaviour After Changes

### Single auth page (e.g. keep URL `/login` or use `/auth`)
1. **Mobile OTP flow**
   - User enters mobile → Send OTP → enters OTP → clicks **Continue**.
   - Frontend calls **login-mobile**.
   - **If success** → returning user → redirect to **home** (data intact).
   - **If 404 "User not found"** → first-time user → on the **same page**, show the registration form (Full name, Email, Password, School) and **Create account**.
   - On Create account → call **register-mobile** with mobile, OTP, name, email, school → on success redirect to **profile creation page** (`/profile/complete`), not home.

2. **Email / password flow**
   - Backend does not distinguish “user not found” from “wrong password” (both 401). So we keep **two modes on the same page**: **Login** vs **Create account** (e.g. toggle or link).
   - **Login**: email + password → **login** → success → home.
   - **Create account**: show fields (email, password, name, school) → **register** → success → **profile creation page** (`/profile/complete`).

3. **Remove** the “Sign up” link to a separate `/register` page; all actions stay on this single page.

### Profile creation page (new)
- **Route**: e.g. `/profile/complete` or `/onboarding`.
- **When**: Shown only after **first-time registration** (mobile or email).
- **Purpose**: “Complete your profile” – optional fields (e.g. class, profile photo, address) and a **Continue** button that goes to **home**.
- **Access**: Protected; only for users who just registered (we can use a flag in localStorage, e.g. `profileCompletePending: true`, cleared when user clicks Continue or when we decide onboarding is done).

---

## Files to Modify / Add

### 1. API / Auth layer – detect “new user” for mobile
- **`website/src/services/apiService.js`**
  - In **loginMobile**: on error, if `error.response?.status === 404`, return a structured result instead of throwing, e.g.  
    `{ success: false, message: error.response.data?.message, userNotFound: true }`  
    so the UI can show the register form without relying on try/catch + status in the component.
- **`website/src/contexts/AuthContext.js`**
  - In **loginMobile**: when ApiService returns `userNotFound: true`, pass that through (e.g. return `{ success: false, userNotFound: true, message }`) so the single auth page can branch correctly.

### 2. Single auth page – merge login + register
- **Rename / repurpose**: Use one component for the single auth page (e.g. keep **LoginScreen** and make it the only entry, or introduce **AuthScreen** and use it for `/login`).
- **Remove** dependency on separate RegisterScreen for the main flow; keep RegisterScreen only if we need to reuse pieces, then delete or redirect.
- **`website/src/components/auth/LoginForm.js`** (or a new unified form component):
  - **Mobile flow**:
    - After OTP, single **Continue** button that calls **loginMobile**.
    - If result is **userNotFound** → set state “show new user form” and display: Full name, Email, Password, School, **Create account** button.
    - Create account calls **registerMobile** with current mobile, OTP, and the new fields; on success call **onRegisterSuccess** (navigate to `/profile/complete`).
    - If **loginMobile** success → call existing **onLoginSuccess** (navigate to home).
  - **Email flow**:
    - Add a toggle or link: “Login” vs “Create account”.
    - **Login**: current email + password → **login** → success → **onLoginSuccess** (home).
    - **Create account**: show fields (email, password, name, school) → **register** → success → **onRegisterSuccess** (`/profile/complete`).
- **`website/src/components/auth/LoginScreen.js`** (or new AuthScreen):
  - Remove “Sign up” link to `/register`.
  - Title/copy can be neutral: e.g. “Login or create account”.
  - Pass **onRegisterSuccess** to the form (navigate to `/profile/complete`).
  - Demo login unchanged (optional: after demo login go to home).

### 3. New profile creation / onboarding page
- **New file**: e.g. `website/src/components/profile/ProfileCompletePage.js` (or `onboarding/OnboardingPage.js`).
- **Content**: Welcome message + form for optional profile fields (e.g. class, profile picture, default address) + **Continue** button.
- **Continue**: clear “profile complete pending” flag, navigate to **home**.
- **Route**: Add in **AppRoutes** a protected route, e.g. `/profile/complete`, rendering this page.

### 4. Routes and redirects
- **`website/src/routes/AppRoutes.js`**
  - Keep **one** public auth route, e.g. `/login`, rendering the single auth page.
  - **Remove** route for `/register` (or make `/register` redirect to `/login` so old links still work).
  - Add protected route: `/profile/complete` → ProfileCompletePage.
  - Catch-all: if not logged in → `/login`; if logged in → `/` (unchanged).

### 5. Post-registration redirect
- In the single auth page, after **register** or **registerMobile** success, call **onRegisterSuccess** which navigates to **`/profile/complete`** instead of home. Optionally set a flag (e.g. in localStorage) like `profileCompletePending: true` so that:
  - We can redirect to `/profile/complete` on next app load until they complete it (optional; can be a later enhancement).

### 6. Cleanup
- **RegisterScreen.js**: Remove from routes; optionally delete the file or keep for reference until migration is verified.
- Any **Link** or **navigate** to `/register` across the app (e.g. TopNavigation, other components) should point to `/login` or be removed.

---

## Data flow summary

| User type    | Action on single page     | API call(s)           | Redirect          |
|-------------|---------------------------|------------------------|-------------------|
| Returning   | Mobile: OTP → Continue    | login-mobile           | Home              |
| First-time  | Mobile: OTP → Continue → “User not found” → fill form → Create account | send-otp, login-mobile (404), register-mobile | /profile/complete |
| Returning   | Email: Login              | login                  | Home              |
| First-time  | Email: Create account     | register               | /profile/complete |

---

## Implementation order (suggested)
1. **ApiService** + **AuthContext**: Add `userNotFound` handling for **loginMobile** (and optionally for **login** if we add “create account” for email).
2. **LoginForm** (or unified form): Add mobile “new user” branch and register form; add email “Create account” mode and register call; add **onRegisterSuccess** callback.
3. **LoginScreen**: Remove Sign up link to `/register`; pass **onRegisterSuccess** → navigate to `/profile/complete`.
4. **ProfileCompletePage**: New component + route `/profile/complete`.
5. **AppRoutes**: Single auth route; remove or redirect `/register`; add `/profile/complete`.
6. **Cleanup**: RegisterScreen out of routes; fix links to `/register`.

---

## Optional later enhancements
- Redirect to `/profile/complete` on app load when `profileCompletePending` is set (so user must complete profile once).
- Backend: optional “login or register” endpoint for email that returns “new user” so email flow can also be one-step (try login → if not found, show register form).
