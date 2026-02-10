import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getResponsiveBooksStyles, colors } from '../css/booksStyles';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';
import BookCard from './books/BookCard';
import BookTable from './books/BookTable';
import OptionalBundleSection from './books/OptionalBundleSection';
import { getOptionalTypeTitle, getCategoryDisplayName, getOptionalBundlesFirst, getOptionalBundlesRest } from '../utils/categoryNames';

const GradeBooksPage = () => {
  const { gradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const booksStyles = getResponsiveBooksStyles(isMobile, isTablet);
  const gradeName = location.state?.gradeName || 'Grade Books';
  const schoolId = location.state?.schoolId;
  const subgradeId = location.state?.subgradeId;
  const subgradeName = location.state?.subgradeName;

  const [textbooks, setTextbooks] = useState([]);
  const [mandatoryNotebooks, setMandatoryNotebooks] = useState([]);
  const [optionalItemsByType, setOptionalItemsByType] = useState({});
  const [selectedBundles, setSelectedBundles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadBooks();
  }, [gradeId, subgradeId]);

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

      const categoriesResult = subgradeId
        ? await ApiService.getCategoriesBySubgradeId(subgradeId)
        : await ApiService.getCategoriesByGradeId(gradeId);

      const categoryIds = categoriesResult.success && categoriesResult.data
        ? categoriesResult.data.map(cat => cat.id)
        : [];

      let allBooks = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const booksResult = await ApiService.getAllBooks({ offset, limit });

        if (booksResult.success && booksResult.data && booksResult.data.length > 0) {
          allBooks = allBooks.concat(booksResult.data);
          if (booksResult.data.length < limit) hasMore = false;
          else offset += limit;
        } else {
          hasMore = false;
        }
      }

      const books = allBooks.length > 0
        ? allBooks.filter(book => {
            // When a specific section (subgrade) is selected
            if (subgradeId) {
              return (
                book.subgradeId === subgradeId ||
                (book.categoryId && categoryIds.includes(book.categoryId))
              );
            }

            // "View all books" (no section selected)
            // Prefer category-based mapping when available
            if (categoryIds.length > 0 && book.categoryId && categoryIds.includes(book.categoryId)) {
              return true;
            }

            // Fallback: include books that are directly linked to this grade
            // even if they don't have a category/section assigned
            return book.gradeId === gradeId;
          })
        : [];

      if (books.length > 0) {
        const textbooksList = [];
        const mandatoryNotebooksList = [];
        const optionalByType = {};
        const initialSelectedBundles = {};

        books.forEach(book => {
          let itemPrice = 0;

          if (book.price !== null && book.price !== undefined && book.price !== '' && book.price !== 0) {
            const parsedPrice = parseFloat(book.price);
            if (!isNaN(parsedPrice) && parsedPrice > 0) itemPrice = parsedPrice;
          }
          if (itemPrice === 0 || isNaN(itemPrice)) {
            if (book.unitPrice != null && book.unitPrice !== '' && book.unitPrice !== 0) {
              const p = parseFloat(book.unitPrice);
              if (!isNaN(p) && p > 0) itemPrice = p;
            } else if (book.salePrice != null && book.salePrice !== '' && book.salePrice !== 0) {
              const p = parseFloat(book.salePrice);
              if (!isNaN(p) && p > 0) itemPrice = p;
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
          } else if (book.bookType === 'MANDATORY_NOTEBOOK') {
            mandatoryNotebooksList.push(bookItem);
          } else {
            const typeKey = book.bookType || 'OTHER';
            if (!optionalByType[typeKey]) {
              optionalByType[typeKey] = { type: typeKey, title: getOptionalTypeTitle(typeKey), items: [] };
              initialSelectedBundles[typeKey] = false;
            }
            optionalByType[typeKey].items.push(bookItem);
          }
        });

        setTextbooks(textbooksList);
        setMandatoryNotebooks(mandatoryNotebooksList);
        setOptionalItemsByType(optionalByType);
        setSelectedBundles(initialSelectedBundles);
        setError(null);
      } else {
        setTextbooks([]);
        setMandatoryNotebooks([]);
        setOptionalItemsByType({});
        setSelectedBundles({});
        setError(subgradeId ? 'No books found for this section.' : 'No books found for this grade.');
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

      const itemsToAdd = [
        ...textbooks.map(book => book.id),
        ...mandatoryNotebooks.map(book => book.id),
      ];
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

      // Add all items in one request (backend replaces cart with these items)
      const payload = itemsToAdd.map((id) => ({ itemId: id, quantity: 1 }));
      let result;
      try {
        result = await ApiService.addItemsToCart(payload);
      } catch (error) {
        const data = error.response?.data;
        if (data?.code === 'INSUFFICIENT_STOCK') {
          const bookType = (data.bookType || 'OTHER').toUpperCase();
          const bundleLabel = getCategoryDisplayName(data.bookType);
          const isMandatory = bookType === 'TEXTBOOK' || bookType === 'MANDATORY_NOTEBOOK';
          const message = isMandatory
            ? 'This grade cannot be ordered at the moment due to insufficient stock for required items.'
            : `Insufficient stock for some items in the ${bundleLabel} bundle. Please uncheck the ${bundleLabel} bundle to continue.`;
          alert(message);
          setIsAddingToCart(false);
          return;
        }
        console.error('Error adding to cart:', error);
        alert('Failed to add items to cart. Please try again.');
        setIsAddingToCart(false);
        return;
      }

      if (result?.success && result?.addedCount > 0) {
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
    let count = textbooks.length + mandatoryNotebooks.length;
    Object.entries(optionalItemsByType).forEach(([type, group]) => {
      if (selectedBundles[type]) {
        count += group.items.length;
      }
    });
    return count;
  };

  // Total price of current selection (mandatory + selected optional) — shown before Add to Cart
  const calculateComboTotal = () => {
    return Object.entries(optionalItemsByType).reduce((sum, [type, group]) => {
      if (!selectedBundles[type]) return sum;
      return sum + group.items.reduce((itemSum, item) => itemSum + (item.price || 0), 0);
    }, 0);
  };
  const calculateOrderTotal = () => {
    const mandatoryTextbooksTotal = textbooks.reduce((sum, book) => sum + (parseFloat(book.price) || 0), 0);
    const mandatoryNotebooksTotal = mandatoryNotebooks.reduce((sum, book) => sum + (parseFloat(book.price) || 0), 0);
    const optionalTotal = calculateComboTotal();
    return mandatoryTextbooksTotal + mandatoryNotebooksTotal + optionalTotal;
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
            {mandatoryNotebooks.length > 0 && ` • ${mandatoryNotebooks.length} mandatory notebook${mandatoryNotebooks.length !== 1 ? 's' : ''}`}
            {Object.keys(optionalItemsByType).length > 0 && 
              ` • ${Object.keys(optionalItemsByType).length} optional bundle${Object.keys(optionalItemsByType).length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* Main Content — Order: Optional 1–4 first, then Mandatory Textbooks, Mandatory Notebooks, then Other optional */}
      <div style={booksStyles.booksContent}>
        {/* Optional 1–4 (top when available) */}
        {getOptionalBundlesFirst(Object.values(optionalItemsByType)).length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Optional 1–4</h2>
            {getOptionalBundlesFirst(Object.values(optionalItemsByType)).map((bundle) => (
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

        {/* Mandatory Textbooks Section */}
        {textbooks.length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Mandatory Textbooks</h2>
            {isMobile ? (
              <div style={booksStyles.booksGrid}>
                {textbooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                  />
                ))}
              </div>
            ) : (
              <BookTable books={textbooks} />
            )}
          </>
        )}

        {/* Mandatory Notebooks Section */}
        {mandatoryNotebooks.length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Mandatory Notebooks</h2>
            {isMobile ? (
              <div style={booksStyles.booksGrid}>
                {mandatoryNotebooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <BookTable books={mandatoryNotebooks} />
            )}
          </>
        )}

        {/* Other optional (Notebook, Uniform, etc.) */}
        {getOptionalBundlesRest(Object.values(optionalItemsByType)).length > 0 && (
          <>
            <h2 style={booksStyles.sectionHeader}>Other optional</h2>
            {getOptionalBundlesRest(Object.values(optionalItemsByType)).map((bundle) => (
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
        {textbooks.length === 0 && mandatoryNotebooks.length === 0 && Object.keys(optionalItemsByType).length === 0 && (
          <div style={booksStyles.emptyState}>
            <div style={booksStyles.emptyStateIcon}>📚</div>
            <p style={booksStyles.emptyStateText}>No books available for this grade</p>
          </div>
        )}
      </div>

      {/* Order total + Fixed Add All to Cart Button at bottom */}
      {(textbooks.length > 0 || mandatoryNotebooks.length > 0 || Object.keys(optionalItemsByType).length > 0) && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '12px 16px',
            borderTop: `1px solid ${colors.borderLight || '#e5e7eb'}`,
            backgroundColor: colors.white,
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '10px 12px',
                backgroundColor: colors.gray50 || '#f9fafb',
                borderRadius: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}
              >
                Order total
              </span>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.primary,
                }}
              >
                ₹{calculateOrderTotal().toFixed(2)}
              </span>
            </div>
            <button
              style={{
                ...booksStyles.stickyCartButton,
                position: 'relative',
                bottom: 'auto',
                right: 'auto',
                width: '100%',
                justifyContent: 'center',
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
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeBooksPage;
