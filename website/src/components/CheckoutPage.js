import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutStyles, colors } from '../css/checkoutStyles';
import { useIsMobile } from '../hooks/useMediaQuery';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import LoadingScreen from './common/LoadingScreen';
import OrderSummary from './checkout/OrderSummary';
import AddressSection from './checkout/AddressSection';
import CartTable from './cart/CartTable';
import CartItem from './cart/CartItem';
import { getCategoryDisplayName, getOptionalBundlesFirst, getOptionalBundlesRest } from '../utils/categoryNames';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useModal();
  const isMobile = useIsMobile();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  useEffect(() => {
    loadCart();
    loadRazorpayScript().catch(err => {
      console.error('Failed to load Razorpay:', err);
    });
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
          title: item.title || 'Unknown Item', // Keep for backward compatibility
          price: item.price || 0,
          quantity: item.quantity || 1,
          bundlePieceCount: item.bundlePieceCount || item.piecesInBundle || null,
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
        setExpandedCategories({
          mandatoryTextbooks: true,
          mandatoryNotebooks: true,
          ...categories,
        });
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.subtotal || (item.price * item.quantity)), 0);
  };

  const calculateDelivery = () => {
    return cartItems.length > 0 ? 300 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDelivery();
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

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showWarning('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city) {
      showWarning('Please select a shipping address before placing your order.');
      return;
    }

    try {
      setIsProcessing(true);

      // Validate cart for checkout (inventory check): block if mandatory out of stock, or optional bundles need to be unchecked
      const validateResult = await ApiService.validateCartForCheckout();
      if (!validateResult.success || validateResult.valid === false) {
        setIsProcessing(false);
        const msg = validateResult.message || 'Your cart cannot be fulfilled at the moment.';
        if (validateResult.code === 'INSUFFICIENT_STOCK') {
          showWarning(msg, 'Cannot proceed to payment');
        } else {
          showError(msg);
        }
        return;
      }

      const totalAmount = calculateTotal(); // Amount in rupees (backend will convert to paise)
      const receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Razorpay order
      const orderResult = await ApiService.createPaymentOrder(totalAmount, receipt);

      if (!orderResult.success || !orderResult.data) {
        showError(orderResult.message || 'Failed to create payment order');
        setIsProcessing(false);
        return;
      }

      const orderData = orderResult.data;

      if (!orderData.keyId || !orderData.orderId || !orderData.amount) {
        showError('Invalid payment order data. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay checkout
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        showError('Payment gateway failed to load. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.orderId,
        name: 'Vidyarthi Books',
        description: 'Order Payment',
        image: 'https://vidyarthibooksonline.com/images/logo.png',
        handler: async function (response) {
          try {
            console.log('Payment response received:', response);
            
            // Verify payment
            const verifyResult = await ApiService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            console.log('Payment verification result:', verifyResult);

            if (verifyResult.success) {
              // Create order in database
              const orderResult = await ApiService.createOrder(
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
                shippingAddress
              );

              console.log('Order creation result:', orderResult);

              if (orderResult.success) {
                showSuccess(
                  `Your order has been placed successfully!\n\nOrder Number: ${orderResult.data?.orderNumber || response.razorpay_order_id}`,
                  'Payment Successful!'
                );
                navigate('/');
              } else {
                // Payment succeeded but order creation failed (e.g. INSUFFICIENT_STOCK race)
                const isStockError = orderResult.code === 'INSUFFICIENT_STOCK';
                const message = isStockError
                  ? `Your payment was successful, but we couldn't fulfill your order due to insufficient stock. Please contact support with Payment ID: ${response.razorpay_payment_id} or Order ID: ${response.razorpay_order_id} for a refund.`
                  : `Your payment was successful, but there was an issue saving your order. Please contact support with Order ID: ${response.razorpay_order_id}`;
                showWarning(message, 'Payment Verified');
                if (isStockError) {
                  loadCart(); // Refresh cart so user can adjust and retry
                }
                navigate('/');
              }
            } else {
              showError('Payment Verification Failed: ' + (verifyResult.message || 'Please contact support.'));
            }
          } catch (error) {
            console.error('Error processing payment:', error);
            showError('Error processing payment. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingAddress.name || user?.firstName || '',
          email: user?.email || '',
          contact: shippingAddress.phone || user?.phoneNumber || '',
        },
        theme: {
          color: '#06429c',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setIsProcessing(false);
          },
        },
        notes: {
          address: shippingAddress.address || '',
          order_type: 'book_order',
        },
      };

      console.log('Opening Razorpay checkout with options:', {
        key: options.key,
        amount: options.amount,
        order_id: options.order_id,
      });

      try {
        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          showError(`Payment Failed: ${response.error.description || 'Please try again.'}`);
          setIsProcessing(false);
        });
        razorpay.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        showError('Failed to open payment gateway. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      showError('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleAddressChange = (address) => {
    setShippingAddress({
      name: address.name || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error && cartItems.length === 0) {
    return (
      <div style={checkoutStyles.checkoutPageContainer}>
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
            onClick={() => navigate('/cart')}
          >
            Go to Cart
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={checkoutStyles.checkoutPageContainer}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={checkoutStyles.emptyState}>
            <div style={checkoutStyles.emptyStateIcon}>🛒</div>
            <h2 style={checkoutStyles.emptyStateText}>Your cart is empty</h2>
            <p style={{ fontSize: '16px', color: colors.textSecondary, marginTop: '12px' }}>
              Please add items to your cart before checkout
            </p>
            <button
              style={{
                ...checkoutStyles.placeOrderButton,
                marginTop: '24px',
              }}
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={checkoutStyles.checkoutPageContainer}>
      {/* Page Header */}
      <div style={checkoutStyles.checkoutPageHeader}>
        <div style={checkoutStyles.checkoutPageHeaderContent}>
          <h1 style={checkoutStyles.checkoutPageTitle}>Checkout</h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={checkoutStyles.checkoutContent}>
        {/* Left Column - Main Content */}
        <div style={checkoutStyles.checkoutMain}>
          {/* Order Items */}
          <div style={checkoutStyles.checkoutSection}>
            <h2 style={checkoutStyles.checkoutSectionTitle}>Order Items</h2>
            
            {/* Order Items: Optional 1–4 first, then Mandatory Textbooks, Mandatory Notebooks, then Other optional */}
            {(() => {
              const { textbooks, mandatoryNotebooks, optionalByType } = groupItemsByCategory();
              const optionalGroups = Object.values(optionalByType);
              const optionalFirst = getOptionalBundlesFirst(optionalGroups);
              const optionalRest = getOptionalBundlesRest(optionalGroups);
              const renderSection = (sectionKey, title, items) => {
                if (!items || items.length === 0) return null;
                const isExpanded = expandedCategories[sectionKey] !== false;
                const bundleTotal = items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
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
                          {title} Bundle
                        </h3>
                        <span style={{
                          fontSize: '14px',
                          color: colors.textSecondary,
                          marginLeft: '8px',
                        }}>
                          ({items.length} item{items.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                        ₹{bundleTotal.toFixed(2)}
                      </span>
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

              const renderOptionalBundleSection = (group) => {
                    const isExpanded = expandedCategories[group.type] !== false;
                    const bundleTotal = group.items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
                    return (
                      <div key={group.type} style={{ marginBottom: '24px' }}>
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
                          onClick={() => toggleCategory(group.type)}
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
                              {group.title} Bundle
                            </h3>
                            <span style={{
                              fontSize: '14px',
                              color: colors.textSecondary,
                              marginLeft: '8px',
                            }}>
                              ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                            ₹{bundleTotal.toFixed(2)}
                          </span>
                        </div>
                        {isExpanded && (
                          <>
                            {isMobile ? (
                              <div>
                                {group.items.map((item) => (
                                  <CartItem key={item.id} item={item} />
                                ))}
                              </div>
                            ) : (
                              <CartTable items={group.items} />
                            )}
                          </>
                        )}
                      </div>
                    );
              };

              return (
                <>
                  {optionalFirst.map((group) => renderOptionalBundleSection(group))}
                  {renderSection('mandatoryTextbooks', 'Mandatory Textbooks', textbooks)}
                  {renderSection('mandatoryNotebooks', 'Mandatory Notebooks', mandatoryNotebooks)}
                  {optionalRest.map((group) => renderOptionalBundleSection(group))}
                </>
              );
            })()}
          </div>
        </div>

        {/* Right Column - Order Summary & Shipping Address */}
        <div style={checkoutStyles.checkoutSidebar}>
          <OrderSummary
            cartItems={cartItems}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
          />
          
          {/* Shipping Address */}
          <AddressSection
            shippingAddress={shippingAddress}
            onAddressChange={handleAddressChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

