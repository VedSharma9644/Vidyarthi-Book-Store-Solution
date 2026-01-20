const userService = require('../services/userService');
const { admin, db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
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
 * Update user profile
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const updatedUser = await userService.updateUser(id, updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Upload profile image for user
 * @route POST /api/users/:id/profile-image
 */
const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log('Uploading profile image for user:', id, 'File:', req.file.originalname, 'Size:', req.file.size);

    // Get Firebase Storage bucket
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
    const fileName = `profile-images/${id}-${Date.now()}-${sanitizedFileName}`;
    const file = bucket.file(fileName);

    // Upload file to Firebase Storage
    try {
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
            metadata: {
              originalName: req.file.originalname,
              userId: id,
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

      // Store metadata in Firestore profile-images collection
      const imageMetadata = {
        imageUrl: publicUrl,
        fileName: req.file.originalname,
        storagePath: fileName,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        userId: id,
        uploadedAt: Timestamp.now(),
      };

      try {
        const imageRef = await db.collection('profile-images').add(imageMetadata);
        console.log(`Profile image metadata saved to Firestore with ID:`, imageRef.id);
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Continue even if Firestore save fails - the image is already uploaded
      }

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        url: publicUrl,
        data: {
          imageUrl: publicUrl,
          ...imageMetadata,
        },
      });
    } catch (uploadError) {
      console.error('Error during upload process:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile image to Firebase Storage',
        error: uploadError.message,
        details: process.env.NODE_ENV === 'development' ? uploadError.stack : undefined,
      });
    }
  } catch (error) {
    console.error('Error in profile image upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = {
  updateUser,
  getUserById,
  uploadProfileImage,
  upload: upload.single('file'), // Export multer middleware
};

