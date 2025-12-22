import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkoutStyles, colors } from '../css/checkoutStyles';
import { getProductImageByCategory } from '../config/imagePaths';
import ApiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './common/LoadingScreen';
import OrderSummary from './checkout/OrderSummary';
import AddressSection from './checkout/AddressSection';
import PaymentSection from './checkout/PaymentSection';

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
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
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
          title: item.title || 'Unknown Item',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.coverImageUrl || '',
          subtotal: item.subtotal || (item.price || 0) * (item.quantity || 1),
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.subtotal || (item.price * item.quantity)), 0);
  };

  const calculateDelivery = () => {
    return cartItems.length > 0 ? 300 : 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateDelivery();
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Validate shipping address
    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city) {
      alert('Please select a shipping address before placing your order.');
      return;
    }

    try {
      setIsProcessing(true);

      const totalAmount = calculateTotal() * 100; // Convert to paise
      const receipt = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Razorpay order
      const orderResult = await ApiService.createPaymentOrder(totalAmount, receipt);

      if (!orderResult.success || !orderResult.data) {
        alert(orderResult.message || 'Failed to create payment order');
        setIsProcessing(false);
        return;
      }

      const orderData = orderResult.data;

      if (!orderData.keyId || !orderData.orderId || !orderData.amount) {
        alert('Invalid payment order data. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Initialize Razorpay checkout
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        alert('Payment gateway failed to load. Please refresh the page and try again.');
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
                alert(
                  `Payment Successful!\n\nYour order has been placed successfully!\n\nOrder Number: ${orderResult.data?.orderNumber || response.razorpay_order_id}`
                );
                navigate('/');
              } else {
                alert(
                  `Payment Verified\n\nYour payment was successful, but there was an issue saving your order. Please contact support with Order ID: ${response.razorpay_order_id}`
                );
                navigate('/');
              }
            } else {
              alert('Payment Verification Failed: ' + (verifyResult.message || 'Please contact support.'));
            }
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error processing payment. Please contact support.');
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
          alert(`Payment Failed: ${response.error.description || 'Please try again.'}`);
          setIsProcessing(false);
        });
        razorpay.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        alert('Failed to open payment gateway. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
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
            <div style={checkoutStyles.orderItemsList}>
              {cartItems.map((item) => {
                const imageUri = item.image && item.image.trim() !== '' ? item.image : null;
                const fallbackImage = getProductImageByCategory(item.bookType || item.category);
                return (
                  <div key={item.id} style={checkoutStyles.orderItem}>
                    {imageUri ? (
                      <img
                        src={imageUri}
                        alt={item.title}
                        style={checkoutStyles.orderItemImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <img
                      src={fallbackImage}
                      alt={item.title || 'Product'}
                      style={{
                        ...checkoutStyles.orderItemImage,
                        display: imageUri ? 'none' : 'block',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                    <div style={{
                      ...checkoutStyles.orderItemImagePlaceholder,
                      display: 'none',
                    }}>
                      📚
                    </div>
                    <div style={checkoutStyles.orderItemDetails}>
                      <h3 style={checkoutStyles.orderItemTitle}>{item.title}</h3>
                      <p style={checkoutStyles.orderItemQuantity}>
                        Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div style={checkoutStyles.orderItemPrice}>
                      ₹{(item.subtotal || (item.price * item.quantity)).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          <AddressSection
            shippingAddress={shippingAddress}
            onAddressChange={handleAddressChange}
          />

          {/* Payment Method */}
          <PaymentSection />
        </div>

        {/* Right Column - Order Summary */}
        <div style={checkoutStyles.checkoutSidebar}>
          <OrderSummary
            cartItems={cartItems}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

