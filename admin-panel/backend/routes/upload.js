const express = require('express');
const router = express.Router();
const multer = require('multer');
const { admin, db } = require('../config/database');
const { Timestamp } = require('firebase-admin/firestore');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  },
});

/**
 * Get all uploaded images
 * @route GET /api/upload/images
 */
router.get('/images', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let query = db.collection('images').orderBy('uploadedAt', 'desc');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.limit(parseInt(limit)).get();
    const images = [];
    
    snapshot.forEach(doc => {
      images.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      data: images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images',
      error: error.message,
    });
  }
});

/**
 * Get image by ID
 * @route GET /api/upload/images/:id
 */
router.get('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('images').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image',
      error: error.message,
    });
  }
});

/**
 * Delete image
 * @route DELETE /api/upload/images/:id
 */
router.delete('/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image document
    const doc = await db.collection('images').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    const imageData = doc.data();
    
    // Delete from Firebase Storage
    try {
      const bucket = admin.storage().bucket('vidyarthi-mobile-app.firebasestorage.app');
      const file = bucket.file(imageData.storagePath);
      await file.delete();
      console.log('File deleted from Storage:', imageData.storagePath);
    } catch (storageError) {
      console.error('Error deleting from Storage:', storageError);
      // Continue to delete from Firestore even if Storage deletion fails
    }

    // Delete from Firestore
    await db.collection('images').doc(id).delete();

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message,
    });
  }
});

/**
 * Upload image to Firebase Storage and Firestore
 * @route POST /api/upload/image
 */
router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log('Uploading file:', req.file.originalname, 'Size:', req.file.size, 'Type:', req.file.mimetype);

    // Get Firebase Storage bucket
    // Use the specific bucket name: vidyarthi-mobile-app.firebasestorage.app
    let bucket;
    try {
      bucket = admin.storage().bucket('vidyarthi-mobile-app.firebasestorage.app');
      console.log('Storage bucket:', bucket.name);
    } catch (storageError) {
      console.error('Error accessing Firebase Storage:', storageError);
      return res.status(500).json({
        success: false,
        message: 'Firebase Storage not configured. Please enable Storage in Firebase Console.',
        error: storageError.message,
      });
    }

    // Get folder path from request or use default
    const folderPath = req.body.folderPath || 'images';
    
    // Sanitize filename to remove special characters
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${folderPath}/${Date.now()}-${sanitizedFileName}`;
    const file = bucket.file(fileName);

    // Upload file to Firebase Storage using Promise-based approach
    try {
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
            metadata: {
              originalName: req.file.originalname,
            },
          },
        });

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          reject(error);
        });

        stream.on('finish', () => {
          console.log('File upload stream finished');
          resolve();
        });

        stream.end(req.file.buffer);
      });

      // Make the file publicly accessible
      try {
        await file.makePublic();
        console.log('File made public:', fileName);
      } catch (publicError) {
        console.warn('Warning: Could not make file public:', publicError.message);
        // Continue even if makePublic fails - we can still get a signed URL
      }

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Verify the file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('File was not uploaded successfully');
      }

      // Store metadata in Firestore
      const imageMetadata = {
        imageUrl: publicUrl,
        fileName: req.file.originalname,
        storagePath: fileName,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        category: req.body.category || 'general',
        description: req.body.description || '',
        folderPath: req.body.folderPath || 'images',
        uploadedAt: Timestamp.now(),
        uploadedBy: req.body.uploadedBy || 'admin', // You can get from auth token
      };

      // Determine which collection to save to
      // Profile images should go to 'profile-images' collection, not 'images' collection
      // The 'images' collection is only for admin-uploaded images (banners, etc.)
      const isProfileImage = 
        req.body.category === 'profile-images' || 
        req.body.folderPath === 'profile-images' ||
        imageMetadata.category === 'profile-images' ||
        imageMetadata.folderPath === 'profile-images';
      
      const collectionName = isProfileImage ? 'profile-images' : 'images';

      // Save to appropriate Firestore collection
      try {
        const imageRef = await db.collection(collectionName).add(imageMetadata);
        console.log(`Image metadata saved to Firestore collection '${collectionName}' with ID:`, imageRef.id);
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Continue even if Firestore save fails - the image is already uploaded
      }

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        url: publicUrl,
        metadata: imageMetadata,
      });
    } catch (uploadError) {
      console.error('Error during upload process:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image to Firebase Storage',
        error: uploadError.message,
        details: process.env.NODE_ENV === 'development' ? uploadError.stack : undefined,
      });
    }
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;

