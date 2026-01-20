# How to Host Privacy Policy on GitHub

This guide explains how to host your Privacy Policy on GitHub so you can link to it from your mobile app and app store listings.

## Option 1: Host as a GitHub Pages Site (Recommended)

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it something like `vidyarthi-kart-privacy` or `vidyakart-docs`
5. Make it **Public** (required for free GitHub Pages)
6. Check "Add a README file"
7. Click "Create repository"

### Step 2: Upload Your Privacy Policy

1. In your new repository, click "Add file" → "Create new file"
2. Name the file `privacy-policy.md` or `index.md`
3. Copy and paste the content from `PRIVACY_POLICY.md`
4. Click "Commit new file"

### Step 3: Enable GitHub Pages

1. Go to your repository **Settings**
2. Scroll down to **Pages** section (in the left sidebar)
3. Under **Source**, select:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
4. Click **Save**

### Step 4: Access Your Privacy Policy

Your Privacy Policy will be available at:
```
https://YOUR_USERNAME.github.io/REPOSITORY_NAME/privacy-policy.md
```

Or if you named it `index.md`:
```
https://YOUR_USERNAME.github.io/REPOSITORY_NAME/
```

**Example:**
- Username: `devlopercreayaa`
- Repository: `vidyarthi-kart-privacy`
- URL: `https://devlopercreayaa.github.io/vidyarthi-kart-privacy/privacy-policy.md`

## Option 2: Host as Raw GitHub File (Simpler)

### Step 1: Create Repository and Upload

1. Create a new repository (same as Option 1, Step 1)
2. Upload `PRIVACY_POLICY.md` to the repository

### Step 2: Get Raw File URL

1. Open your `PRIVACY_POLICY.md` file in GitHub
2. Click the **Raw** button (top right of the file view)
3. Copy the URL from your browser

**Example URL:**
```
https://raw.githubusercontent.com/devlopercreayaa/vidyarthi-kart-privacy/main/PRIVACY_POLICY.md
```

### Step 3: Use the URL

You can use this raw URL directly in:
- Google Play Store listing
- Apple App Store listing
- Your app's About/Settings screen
- Terms of Service links

**Note:** Raw files display as plain text. For better formatting, use Option 1 (GitHub Pages).

## Option 3: Convert to HTML and Host (Best Formatting)

### Step 1: Convert Markdown to HTML

You can use online tools like:
- [Markdown to HTML Converter](https://www.markdowntohtml.com/)
- [Dillinger](https://dillinger.io/)

Or use a tool like `pandoc`:
```bash
pandoc PRIVACY_POLICY.md -o privacy-policy.html
```

### Step 2: Create HTML File

Create a file named `index.html` with basic HTML structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Vidyarthi Kart</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
        a { color: #3498db; }
    </style>
</head>
<body>
    <!-- Paste your converted HTML content here -->
</body>
</html>
```

### Step 3: Upload and Enable GitHub Pages

1. Upload `index.html` to your repository
2. Enable GitHub Pages (same as Option 1, Step 3)
3. Access at: `https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`

## Adding to Your App

### For Google Play Store:

1. Go to Google Play Console
2. Navigate to **Store presence** → **Store settings**
3. Under **Privacy Policy**, paste your GitHub Pages URL

### For Apple App Store:

1. Go to App Store Connect
2. Navigate to your app → **App Information**
3. Under **Privacy Policy URL**, paste your GitHub Pages URL

### In Your App Code:

You can add a link in your app's settings/about screen:

```javascript
// Example in React Native
<TouchableOpacity onPress={() => {
  Linking.openURL('https://devlopercreayaa.github.io/vidyarthi-kart-privacy/privacy-policy.md');
}}>
  <Text>Privacy Policy</Text>
</TouchableOpacity>
```

## Quick Setup Checklist

- [ ] Create GitHub repository
- [ ] Upload Privacy Policy file
- [ ] Enable GitHub Pages (if using Option 1 or 3)
- [ ] Test the URL in a browser
- [ ] Add URL to Google Play Console
- [ ] Add URL to App Store Connect
- [ ] Add link in your app (optional)

## Tips

1. **Keep it Updated:** Update the "Last Updated" date whenever you make changes
2. **Version Control:** Use GitHub's commit history to track changes
3. **Backup:** Keep a local copy of your Privacy Policy
4. **Test Links:** Always test your privacy policy URL before submitting to app stores
5. **Mobile-Friendly:** Ensure the page is readable on mobile devices

## Need Help?

If you need assistance:
1. Check GitHub Pages documentation: https://pages.github.com/
2. GitHub Community: https://github.community/
3. Contact GitHub Support: https://support.github.com/


