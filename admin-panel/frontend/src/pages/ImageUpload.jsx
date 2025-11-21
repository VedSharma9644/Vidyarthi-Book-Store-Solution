import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../services/api';
import './ImageUpload.css';

const ImageUpload = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    folderPath: 'images',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    if (!formData.category.trim()) {
      setError('Category is required');
      return;
    }

    try {
      setIsUploading(true);
      
      const response = await uploadAPI.uploadImage(selectedFile, {
        category: formData.category,
        description: formData.description,
        folderPath: formData.folderPath,
        uploadedBy: 'admin', // You can get from auth context
      });

      if (response.data.success) {
        setSuccess('Image uploaded successfully!');
        setFormData({
          category: '',
          description: '',
          folderPath: 'images',
        });
        setSelectedFile(null);
        setPreview(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <div className="page-header">
        <h1>Upload Image</h1>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/manage-images')}
        >
          Back to Images
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="category"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., banners, products, home-page"
                required
              />
              <small className="form-text text-muted">
                Category helps organize images (e.g., banners, products, home-page)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description of the image"
              />
            </div>

            <div className="form-group">
              <label htmlFor="folderPath">Folder Path</label>
              <input
                type="text"
                id="folderPath"
                name="folderPath"
                className="form-control"
                value={formData.folderPath}
                onChange={handleInputChange}
                placeholder="images"
              />
              <small className="form-text text-muted">
                Folder path in GCS bucket (default: images)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="file">
                Image File <span className="text-danger">*</span>
              </label>
              <input
                type="file"
                id="file"
                name="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <small className="form-text text-muted">
                Supported formats: JPG, JPEG, PNG, GIF, WEBP (Max 5MB)
              </small>
            </div>

            {preview && (
              <div className="form-group">
                <label>Preview</label>
                <div className="image-preview-container">
                  <img src={preview} alt="Preview" className="image-preview" />
                </div>
              </div>
            )}

            <div className="alert alert-info">
              <strong>Note:</strong> The image will be:
              <ul className="mb-0 mt-2">
                <li>Uploaded to Google Cloud Storage</li>
                <li>Stored in Firebase database with metadata</li>
                <li>Made publicly accessible</li>
              </ul>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/manage-images')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;

