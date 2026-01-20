# Clear Metro Bundler Cache - Instructions

## Method 1: Clear Cache and Restart Metro
1. Stop the Metro bundler (press Ctrl+C in the terminal)
2. Run: `npx expo start --clear`
   OR
   `npx react-native start --reset-cache`

## Method 2: Manual Cache Clear
1. Stop Metro bundler
2. Delete these folders/files:
   - `node_modules/.cache` (if exists)
   - `.expo` folder (if exists)
   - `android/app/build` (if exists)
   - `ios/build` (if exists)
3. Run: `npm start -- --reset-cache`

## Method 3: Full Clean (Nuclear Option)
1. Stop Metro bundler
2. Delete `node_modules` folder
3. Delete `.expo` folder
4. Run: `npm install`
5. Run: `npx expo start --clear`

## After Clearing Cache:
- Reload the app on your device/emulator
- Shake device and select "Reload" OR
- Press 'r' in Metro terminal to reload
- For Android: `adb shell input keyevent 82` then select "Reload"

