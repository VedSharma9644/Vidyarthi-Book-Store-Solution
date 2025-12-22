# Image Setup Guide

## Where to Place Images

### 📁 Folder Structure

```
website/
└── public/
    └── images/
        ├── logo/
        │   ├── logo.png          (Main logo)
        │   ├── logo-small.png    (Small logo for mobile)
        │   └── favicon.png       (Favicon)
        ├── products/
        │   ├── textbook-placeholder.png
        │   ├── notebook-placeholder.png
        │   ├── stationary-placeholder.png
        │   ├── uniform-placeholder.png
        │   └── product-placeholder.png
        └── categories/
            ├── mandatory-icon.png
            ├── optional-icon.png
            └── stationary-icon.png
```

## How to Use Images

### 1. **Logo Images**

Place your logo files in `public/images/logo/`:
- `logo.png` - Main logo (recommended: 200x60px)
- `logo-small.png` - Small logo (recommended: 100x30px)
- `favicon.png` - Favicon (recommended: 32x32px or 64x64px)

**Usage in code:**
```jsx
import { LOGO_IMAGES } from '../config/imagePaths';

<img src={LOGO_IMAGES.MAIN} alt="Logo" />
```

### 2. **Product Images**

Place product placeholder images in `public/images/products/`:
- `textbook-placeholder.png` - For textbooks
- `notebook-placeholder.png` - For notebooks
- `stationary-placeholder.png` - For stationary items
- `uniform-placeholder.png` - For uniforms
- `product-placeholder.png` - Generic placeholder

**Usage in code:**
```jsx
import { getProductImageByCategory, PRODUCT_IMAGES } from '../config/imagePaths';

// Automatic based on category
const image = getProductImageByCategory(book.bookType);

// Or directly
<img src={PRODUCT_IMAGES.TEXTBOOK} alt="Textbook" />
```

### 3. **Category Icons**

Place category icons in `public/images/categories/`:
- `mandatory-icon.png` - For mandatory items
- `optional-icon.png` - For optional items
- `stationary-icon.png` - For stationary category

**Usage in code:**
```jsx
import { getCategoryIcon } from '../config/imagePaths';

const icon = getCategoryIcon(category);
```

## Image Paths Reference

All image paths are centralized in `src/config/imagePaths.js`:

```javascript
import { 
  LOGO_IMAGES, 
  PRODUCT_IMAGES, 
  CATEGORY_IMAGES,
  DEFAULT_IMAGES,
  getProductImageByCategory,
  getCategoryIcon
} from '../config/imagePaths';
```

## Direct URL Reference

You can also reference images directly using the public path:

```jsx
// Direct reference (works from public folder)
<img src="/images/logo/logo.png" alt="Logo" />
<img src="/images/products/textbook-placeholder.png" alt="Textbook" />
```

## Current Implementation

- **Product Images**: Currently using URLs from backend API (`book.coverImageUrl`)
- **Fallback**: When API image fails, uses local placeholder based on category
- **Logo**: Currently using text "V" - can be replaced with actual logo image

## Next Steps

1. Add your logo images to `public/images/logo/`
2. Add product placeholder images to `public/images/products/`
3. Add category icons to `public/images/categories/`
4. Update components to use the new image paths (optional - fallbacks will work automatically)

## Image Recommendations

- **Format**: PNG for logos/icons, JPG for photos
- **Size**: Optimize for web (keep file sizes under 200KB)
- **Dimensions**:
  - Logo: 200x60px (or similar aspect ratio)
  - Product placeholders: 400x600px (or similar)
  - Icons: 64x64px or 128x128px

## Notes

- Images in `public` folder are served statically
- Use `%PUBLIC_URL%` in HTML files if needed
- Images are accessible at `/images/...` path
- Product images from API take priority over local placeholders

