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
 * @deprecated This endpoint is kept for backward compatibility but returns static image path
 * The mobile app now uses a local static image instead of database banners
 */
const getBannerImages = async (req, res) => {
  try {
    // Return static image path - mobile app should use local asset instead
    // This endpoint is maintained for backward compatibility only
    res.json({
      success: true,
      data: {
        imageUrl: 'static://assets/images/DELIVERY IMG.png',
        isStatic: true,
      },
    });
  } catch (error) {
    console.error('Error in banner endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner image',
      error: error.message,
    });
  }
};

module.exports = {
  getImages,
  getBannerImages,
};

