# Images Directory

This directory contains static images for the website.

## Folder Structure

- `logo/` - Logo images (main logo, favicon, etc.)
- `products/` - Product category images (textbooks, notebooks, stationary, etc.)
- `categories/` - Category icons and images

## How to Use Images

### From Public Folder

Images in the `public` folder can be referenced directly using `/images/...` path:

```jsx
// In your React components
<img src="/images/logo/logo.png" alt="Logo" />
<img src="/images/products/textbook-placeholder.png" alt="Textbook" />
```

### Example Usage

```jsx
// Logo in TopNavigation
<img src="/images/logo/logo.png" alt="Vidyarthi Book Bank" />

// Product placeholder
<img src="/images/products/notebook-placeholder.png" alt="Notebook" />
```

## Image Naming Convention

- Use lowercase with hyphens: `logo-main.png`, `textbook-placeholder.jpg`
- Be descriptive: `notebook-spiral-bound.png` instead of `img1.png`
- Use appropriate formats: `.png` for logos, `.jpg` for photos

## Notes

- Images in `public` folder are served statically and accessible via URL
- For images that need to be imported in components, use `src/assets/images/` instead
- Product images from backend API will still be used when available

