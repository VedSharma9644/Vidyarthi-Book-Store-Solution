import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartStyles, colors } from '../css/cartStyles';
import ApiService from '../services/apiService';
import LoadingScreen from './common/LoadingScreen';
import CartItem from './cart/CartItem';
import CartSummary from './cart/CartSummary';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);

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
          image: item.coverImageUrl || '',
          subtotal: item.subtotal || (item.price || 0) * (item.quantity || 1),
          bookType: item.bookType || 'OTHER',
        }));
        
        setCartItems(items);
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

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart? This action cannot be undone.')) {
      return;
    }

    try {
      setIsClearing(true);

      const result = await ApiService.clearCart();
      
      if (result.success) {
        setCartItems([]);
        alert('Cart cleared successfully');
      } else {
        alert(result.message || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart. Please try again.');
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

            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <CartSummary cartItems={cartItems} />
        </div>
      )}
    </div>
  );
};

export default CartPage;

