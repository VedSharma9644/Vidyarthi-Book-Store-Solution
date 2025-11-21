const { db } = require('../config/firebase');

/**
 * Get images by category
 * @route GET /api/images
 */
const getImages = async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    let query = db.collection('images').orderBy('uploadedAt', 'desc');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.limit(parseInt(limit)).get();
    const images = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      images.push({
        id: doc.id,
        imageUrl: data.imageUrl,
        category: data.category,
        description: data.description,
        folderPath: data.folderPath,
        uploadedAt: data.uploadedAt,
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
};

/**
 * Get banner images for homepage
 * @route GET /api/images/banner
 */
const getBannerImages = async (req, res) => {
  try {
    // Fetch images with category 'banner' or 'home-banner' or 'homepage'
    const categories = ['banner', 'home-banner', 'homepage', 'home'];
    
    // Try to get banner images from any of these categories
    let bannerImages = [];
    
    for (const category of categories) {
      const snapshot = await db.collection('images')
        .where('category', '==', category)
        .orderBy('uploadedAt', 'desc')
        .limit(5)
        .get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        bannerImages.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          category: data.category,
          description: data.description,
        });
      });
      
      // If we found images, break
      if (bannerImages.length > 0) break;
    }
    
    // If no banner images found, get the most recent image as fallback
    if (bannerImages.length === 0) {
      const snapshot = await db.collection('images')
        .orderBy('uploadedAt', 'desc')
        .limit(1)
        .get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        bannerImages.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          category: data.category,
          description: data.description,
        });
      });
    }

    res.json({
      success: true,
      data: bannerImages.length > 0 ? bannerImages[0] : null, // Return first banner image
    });
  } catch (error) {
    console.error('Error fetching banner images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner images',
      error: error.message,
    });
  }
};

module.exports = {
  getImages,
  getBannerImages,
};

