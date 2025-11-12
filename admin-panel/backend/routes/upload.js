const express = require('express');
const router = express.Router();
const multer = require('multer');
const { admin } = require('../config/database');
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
 * Upload image to Firebase Storage
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

    // Sanitize filename to remove special characters
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `book-covers/${Date.now()}-${sanitizedFileName}`;
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

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        url: publicUrl,
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

