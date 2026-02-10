import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartStyles, colors } from '../css/cartStyles';
import { useIsMobile } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';
import CartItem from './cart/CartItem';
import CartTable from './cart/CartTable';
import CartSummary from './cart/CartSummary';
import { useModal } from '../contexts/ModalContext';
import { getCategoryDisplayName, getOptionalBundlesFirst, getOptionalBundlesRest } from '../utils/categoryNames';

const CartPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { showSuccess, showError } = useModal();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiService.getCart();
      
      if (result.success && result.data) {
        const items = (result.data.items || []).map(item => ({
          id: item.itemId,
          itemId: item.itemId,
          name: item.title || 'Unknown Item',
          price: item.price || 0,
          quantity: item.quantity || 1,
          bundlePieceCount: (item.bundlePieceCount || item.piecesInBundle || item.productQuantity) ?? null,
          productQuantity: item.productQuantity ?? item.bundlePieceCount ?? item.piecesInBundle ?? null,
          image: item.coverImageUrl || '',
          subtotal: item.subtotal || (item.price || 0) * (item.quantity || 1),
          bookType: item.bookType || 'OTHER',
        }));
        
        setCartItems(items);
        
        const categories = {};
        items.forEach(item => {
          const category = item.bookType || 'OTHER';
          if (categories[category] === undefined) {
            categories[category] = true;
          }
        });
        setExpandedCategories({ mandatoryTextbooks: true, mandatoryNotebooks: true, ...categories });
      } else {
        setCartItems([]);
        if (result.message) {
          setError(result.message);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart. Please try again.');
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group items: Mandatory Textbooks, Mandatory Notebooks, Optional by type
  const groupItemsByCategory = () => {
    const textbooks = [];
    const mandatoryNotebooks = [];
    const optionalByType = {};
    cartItems.forEach(item => {
      if (item.bookType === 'TEXTBOOK') {
        textbooks.push(item);
      } else if (item.bookType === 'MANDATORY_NOTEBOOK') {
        mandatoryNotebooks.push(item);
      } else {
        const type = item.bookType || 'OTHER';
        if (!optionalByType[type]) {
          optionalByType[type] = { type, title: getCategoryDisplayName(type), items: [] };
        }
        optionalByType[type].items.push(item);
      }
    });
    return { textbooks, mandatoryNotebooks, optionalByType };
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);

      const result = await ApiService.clearCart();
      
      if (result.success) {
        setCartItems([]);
        showSuccess('Cart cleared successfully');
      } else {
        showError(result.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error && cartItems.length === 0) {
    return (
      <div style={cartStyles.cartPageContainer}>
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
            onClick={() => navigate('/')}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={cartStyles.cartPageContainer}>
      {/* Page Header */}
      <div style={cartStyles.cartPageHeader}>
        <div style={cartStyles.cartPageHeaderContent}>
          <h1 style={cartStyles.cartPageTitle}>Shopping Cart</h1>
          {cartItems.length > 0 && (
            <p style={cartStyles.cartItemCount}>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      {cartItems.length === 0 ? (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={cartStyles.emptyCart}>
            <div style={cartStyles.emptyCartIcon}>🛒</div>
            <h2 style={cartStyles.emptyCartTitle}>Your cart is empty</h2>
            <p style={cartStyles.emptyCartText}>
              Add items to your cart to see them here
            </p>
            <button
              style={cartStyles.continueShoppingButton}
              onClick={() => navigate('/')}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, cartStyles.continueShoppingButtonHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = colors.primary;
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      ) : (
        <div style={cartStyles.cartContent}>
          {/* Cart Items Section */}
          <div style={cartStyles.cartItemsSection}>
            <div style={cartStyles.cartItemsHeader}>
              <h2 style={cartStyles.cartItemsTitle}>Cart Items</h2>
              <button
                style={{
                  ...cartStyles.clearCartButton,
                  ...(isClearing && { opacity: 0.6, cursor: 'not-allowed' }),
                }}
                onClick={handleClearCart}
                disabled={isClearing}
                onMouseEnter={(e) => {
                  if (!isClearing) {
                    Object.assign(e.currentTarget.style, cartStyles.clearCartButtonHover);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = colors.gray400;
                }}
              >
                {isClearing ? 'Clearing...' : 'Clear Cart'}
              </button>
            </div>

            {/* Order: Optional 1–4 first, then Mandatory Textbooks, Mandatory Notebooks, then Other optional */}
            {(() => {
              const { textbooks, mandatoryNotebooks, optionalByType } = groupItemsByCategory();
              const optionalGroups = Object.values(optionalByType);
              const optionalFirst = getOptionalBundlesFirst(optionalGroups);
              const optionalRest = getOptionalBundlesRest(optionalGroups);
              const renderSection = (sectionKey, title, items) => {
                if (!items || items.length === 0) return null;
                const isExpanded = expandedCategories[sectionKey] !== false;
                return (
                  <div key={sectionKey} style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: colors.gray50,
                        borderRadius: '8px',
                        border: `1px solid ${colors.borderLight}`,
                        cursor: 'pointer',
                        marginBottom: isExpanded ? '12px' : '0',
                        transition: 'background-color 0.2s ease',
                      }}
                      onClick={() => toggleCategory(sectionKey)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray100;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.gray50;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontSize: '20px',
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}>
                          ▶
                        </span>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: colors.textPrimary,
                          margin: 0,
                        }}>
                          {title}
                        </h3>
                        <span style={{
                          fontSize: '14px',
                          color: colors.textSecondary,
                          marginLeft: '8px',
                        }}>
                          ({items.length} item{items.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <>
                        {isMobile ? (
                          <div>
                            {items.map((item) => (
                              <CartItem key={item.id} item={item} />
                            ))}
                          </div>
                        ) : (
                          <CartTable items={items} />
                        )}
                      </>
                    )}
                  </div>
                );
              };

              const renderOptionalBlock = (sectionKey, title, groups) => {
                if (!groups || groups.length === 0) return null;
                const isSectionExpanded = expandedCategories[sectionKey] !== false;
                const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
                return (
                  <div key={sectionKey} style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        backgroundColor: colors.gray50,
                        borderRadius: '8px',
                        border: `1px solid ${colors.borderLight}`,
                        cursor: 'pointer',
                        marginBottom: isSectionExpanded ? '12px' : '0',
                        transition: 'background-color 0.2s ease',
                      }}
                      onClick={() => toggleCategory(sectionKey)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.gray100; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.gray50; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontSize: '20px',
                          transition: 'transform 0.2s ease',
                          transform: isSectionExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        }}>▶</span>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>
                          {title}
                        </h3>
                        <span style={{ fontSize: '14px', color: colors.textSecondary, marginLeft: '8px' }}>
                          ({totalItems} item{totalItems !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                    {isSectionExpanded && (
                      <>
                        {groups.map((group) => {
                            const isTypeExpanded = expandedCategories[group.type] !== false;
                            return (
                              <div key={group.type} style={{ marginLeft: '16px', marginBottom: '16px' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    backgroundColor: colors.white,
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.borderLight}`,
                                    cursor: 'pointer',
                                    marginBottom: isTypeExpanded ? '8px' : '0',
                                  }}
                                  onClick={() => toggleCategory(group.type)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.gray50;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.white;
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                      fontSize: '16px',
                                      transform: isTypeExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    }}>
                                      ▶
                                    </span>
                                    <span style={{
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      color: colors.textPrimary,
                                    }}>
                                      {group.title}
                                    </span>
                                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                                      ({group.items.length})
                                    </span>
                                  </div>
                                </div>
                                {isTypeExpanded && (
                                  isMobile ? (
                                    <div>
                                      {group.items.map((item) => (
                                        <CartItem key={item.id} item={item} />
                                      ))}
                                    </div>
                                  ) : (
                                    <CartTable items={group.items} />
                                  )
                                )}
                              </div>
                            );
                        })}
                      </>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {renderOptionalBlock('optionalFirst', 'Optional 1–4', optionalFirst)}
                  {renderSection('mandatoryTextbooks', 'Mandatory Textbooks', textbooks)}
                  {renderSection('mandatoryNotebooks', 'Mandatory Notebooks', mandatoryNotebooks)}
                  {renderOptionalBlock('optionalRest', 'Other optional', optionalRest)}
                </>
              );
            })()}
          </div>

          {/* Cart Summary */}
          <CartSummary cartItems={cartItems} />
        </div>
      )}
    </div>
  );
};

export default CartPage;

