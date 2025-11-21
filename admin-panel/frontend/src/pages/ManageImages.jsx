import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { uploadAPI } from '../services/api';
import './ManageImages.css';

const ManageImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    loadImages();
  }, [selectedCategory]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await uploadAPI.getAllImages(selectedCategory || undefined);
      
      if (response.data.success) {
        setImages(response.data.data || []);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await uploadAPI.deleteImage(id);
      if (response.data.success) {
        alert('Image deleted successfully');
        loadImages();
      } else {
        alert('Failed to delete image: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredImages = images.filter(item => {
    const searchText = filterText.toLowerCase();
    return (
      (item.category?.toLowerCase().includes(searchText)) ||
      (item.description?.toLowerCase().includes(searchText)) ||
      (item.fileName?.toLowerCase().includes(searchText))
    );
  });

  const categories = [...new Set(images.map(img => img.category).filter(Boolean))];

  const columns = [
    {
      name: 'Image',
      selector: row => row.imageUrl,
      cell: row => (
        <img 
          src={row.imageUrl} 
          alt={row.fileName || 'Image'} 
          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80?text=Image';
          }}
        />
      ),
      width: '100px',
    },
    {
      name: 'File Name',
      selector: row => row.fileName || 'N/A',
      sortable: true,
    },
    {
      name: 'Category',
      selector: row => row.category || 'N/A',
      sortable: true,
    },
    {
      name: 'Description',
      selector: row => row.description || '-',
      cell: row => (
        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.description || '-'}
        </div>
      ),
    },
    {
      name: 'Size',
      selector: row => row.fileSize,
      cell: row => formatFileSize(row.fileSize),
      sortable: true,
    },
    {
      name: 'Uploaded',
      selector: row => row.uploadedAt,
      cell: row => formatDate(row.uploadedAt),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="action-buttons">
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </button>
        </div>
      ),
      width: '100px',
    },
  ];

  return (
    <div className="manage-images-container">
      <div className="page-header">
        <h1>Manage Images</h1>
        <Link to="/upload-image" className="btn btn-primary">
          + Upload New Image
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filters">
            <input
              type="text"
              className="form-control"
              placeholder="Search by category, description, or filename..."
              value={filterText}
              onChange={e => {
                setFilterText(e.target.value);
                setResetPaginationToggle(!resetPaginationToggle);
              }}
              style={{ maxWidth: '400px', marginBottom: '16px' }}
            />
            
            <select
              className="form-control"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '200px', marginBottom: '16px' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={filteredImages}
            progressPending={loading}
            pagination
            paginationResetDefaultPage={resetPaginationToggle}
            highlightOnHover
            striped
            responsive
            noDataComponent="No images found"
          />
        </div>
      </div>
    </div>
  );
};

export default ManageImages;

