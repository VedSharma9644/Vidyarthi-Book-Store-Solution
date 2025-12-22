import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getResponsiveBooksStyles, colors } from '../css/booksStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';
import BookCard from './books/BookCard';
import OptionalBundleSection from './books/OptionalBundleSection';

const GradeBooksPage = () => {
  const { gradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const booksStyles = getResponsiveBooksStyles(isMobile, isTablet);
  const gradeName = location.state?.gradeName || 'Grade Books';
  const schoolId = location.state?.schoolId;

  const [textbooks, setTextbooks] = useState([]);
  const [optionalItemsByType, setOptionalItemsByType] = useState({});
  const [selectedBundles, setSelectedBundles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadBooks();
  }, [gradeId]);

  useEffect(() => {
    loadCartCount();
    const interval = setInterval(() => {
      loadCartCount();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const result = await ApiService.getCartCount();
      if (result.success) {
        setCartCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartCount(0);
    }
  };

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const categoriesResult = await ApiService.getCategoriesByGradeId(gradeId);
      
      if (!categoriesResult.success || !categoriesResult.data || categoriesResult.data.length === 0) {
        setTextbooks([]);
        setOptionalItemsByType({});
        setIsLoading(false);
        return;
      }

      const categoryIds = categoriesResult.data.map(cat => cat.id);
      
      let allBooks = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore) {
        const booksResult = await ApiService.getAllBooks({ offset, limit });
        
        if (booksResult.success && booksResult.data && booksResult.data.length > 0) {
          allBooks = allBooks.concat(booksResult.data);
          
          if (booksResult.data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
      }
      
      if (allBooks.length > 0) {
        const books = allBooks.filter(book => 
          book.categoryId && categoryIds.includes(book.categoryId)
        );
        
        const textbooksList = [];
        const optionalByType = {};
        const initialSelectedBundles = {};

        books.forEach(book => {
          let itemPrice = 0;
          
          if (book.price !== null && book.price !== undefined && book.price !== '' && book.price !== 0) {
            const parsedPrice = parseFloat(book.price);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              itemPrice = parsedPrice;
            }
          }
          
          if (itemPrice === 0 || isNaN(itemPrice)) {
            if (book.unitPrice !== null && book.unitPrice !== undefined && book.unitPrice !== '' && book.unitPrice !== 0) {
              const parsedPrice = parseFloat(book.unitPrice);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                itemPrice = parsedPrice;
              }
            } else if (book.salePrice !== null && book.salePrice !== undefined && book.salePrice !== '' && book.salePrice !== 0) {
              const parsedPrice = parseFloat(book.salePrice);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                itemPrice = parsedPrice;
              }
            }
          }
          
          const bookItem = {
            id: book.id,
            title: book.title,
            coverImageUrl: book.coverImageUrl || '',
            price: itemPrice,
            bookType: book.bookType || '',
            productQuantity: book.productQuantity || null,
            perProductPrice: book.perProductPrice || null,
          };

          if (book.bookType === 'TEXTBOOK') {
            textbooksList.push(bookItem);
          } else {
            const typeKey = book.bookType || 'OTHER';
          
            if (!optionalByType[typeKey]) {
              optionalByType[typeKey] = {
                type: typeKey,
                title: typeKey.charAt(0) + typeKey.slice(1).toLowerCase().replace(/_/g, ' '),
                items: [],
              };
              initialSelectedBundles[typeKey] = true; // Default to selected
            }
          
            optionalByType[typeKey].items.push(bookItem);
          }
        });

        setTextbooks(textbooksList);
        setOptionalItemsByType(optionalByType);
        setSelectedBundles(initialSelectedBundles);
      } else {
        setError('No books found for this grade');
      }
    } catch (error) {
      console.error('Error loading books:', error);
      setError('Failed to load books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBundle = (type) => {
    setSelectedBundles((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleAddAllToCart = async () => {
    try {
      setIsAddingToCart(true);

      const itemsToAdd = [...textbooks.map(book => book.id)];
      
      Object.entries(optionalItemsByType).forEach(([type, group]) => {
        if (selectedBundles[type]) {
          itemsToAdd.push(...group.items.map(item => item.id));
        }
      });

      if (itemsToAdd.length === 0) {
        alert('No items selected to add to cart.');
        setIsAddingToCart(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const itemId of itemsToAdd) {
        try {
          const result = await ApiService.updateCartItem(itemId, 1);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error adding item ${itemId} to cart:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        await loadCartCount();
        navigate('/cart');
      } else {
        alert('Failed to add items to cart. Please try again.');
        setIsAddingToCart(false);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add items to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getTotalItemsCount = () => {
    let count = textbooks.length;
    Object.entries(optionalItemsByType).forEach(([type, group]) => {
      if (selectedBundles[type]) {
        count += group.items.length;
      }
    });
    return count;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div style={booksStyles.booksPageContainer}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: '20px',
        }}>
          <p style={{ fontSize: '18px', color: colors.textPrimary, marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </p>
          <button
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={booksStyles.booksPageContainer}>
      {/* Page Header */}
      <div style={booksStyles.booksPageHeader}>
        <div style={booksStyles.booksPageHeaderContent}>
          <h1 style={booksStyles.booksPageTitle}>{gradeName}</h1>
          <p style={booksStyles.booksPageSubtitle}>
            {textbooks.length} mandatory textbook{textbooks.length !== 1 ? 's' : ''}
            {Object.keys(optionalItemsByType).length > 0 && 
              ` • ${Object.keys(optionalItemsByType).length} optional bundle${Object.keys(optionalItemsByType).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={booksStyles.booksContent}>
        {/* Mandatory Textbooks Section */}
        {textbooks.length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Mandatory Textbooks</h2>
            <div style={booksStyles.booksGrid}>
              {textbooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                />
              ))}
            </div>
          </>
        )}

        {/* Optional Items Bundles */}
        {Object.keys(optionalItemsByType).length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Optional Items Bundles</h2>
            {Object.values(optionalItemsByType).map((bundle) => (
              <OptionalBundleSection
                key={bundle.type}
                bundleType={bundle.type}
                bundleTitle={bundle.title}
                items={bundle.items}
                isSelected={selectedBundles[bundle.type] || false}
                onToggle={() => toggleBundle(bundle.type)}
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {textbooks.length === 0 && Object.keys(optionalItemsByType).length === 0 && (
          <div style={booksStyles.emptyState}>
            <div style={booksStyles.emptyStateIcon}>📚</div>
            <p style={booksStyles.emptyStateText}>No books available for this grade</p>
          </div>
        )}
      </div>

      {/* Sticky Add All to Cart Button */}
      {(textbooks.length > 0 || Object.keys(optionalItemsByType).length > 0) && (
        <button
          style={{
            ...booksStyles.stickyCartButton,
            ...(isAddingToCart && { opacity: 0.6, cursor: 'not-allowed' }),
          }}
          onClick={handleAddAllToCart}
          disabled={isAddingToCart}
          onMouseEnter={(e) => {
            if (!isAddingToCart) {
              Object.assign(e.currentTarget.style, booksStyles.stickyCartButtonHover);
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
        >
          <span>🛒</span>
          <span>{isAddingToCart ? 'Adding...' : 'Add All to Cart'}</span>
          {getTotalItemsCount() > 0 && (
            <span style={booksStyles.cartButtonBadge}>
              {getTotalItemsCount()}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default GradeBooksPage;
