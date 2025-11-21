const { db } = require('../config/database');
const shiprocketService = require('../services/shiprocketService');

// Helper function to get customer name
const getCustomerName = async (data) => {
  // First, try to get name from customerInfo
  if (data.customerInfo?.name && data.customerInfo.name.trim() !== '') {
    return data.customerInfo.name.trim();
  }

  // If customerInfo.name is missing, try to fetch from users collection
  if (data.userId) {
    try {
      const userDoc = await db.collection('users').doc(data.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        // Build name from firstName, lastName, or userName
        if (userData.firstName && userData.lastName) {
          return `${userData.firstName} ${userData.lastName}`.trim();
        } else if (userData.firstName) {
          return userData.firstName.trim();
        } else if (userData.lastName) {
          return userData.lastName.trim();
        } else if (userData.userName) {
          return userData.userName.trim();
        } else if (userData.parentFullName) {
          return userData.parentFullName.trim();
        } else if (userData.phoneNumber) {
          return `Customer (${userData.phoneNumber})`;
        }
      }
    } catch (error) {
      console.warn(`Error fetching user ${data.userId} for order:`, error.message);
    }
  }

  // Fallback to phone number from customerInfo or shippingAddress
  if (data.customerInfo?.phoneNumber) {
    return `Customer (${data.customerInfo.phoneNumber})`;
  }
  if (data.shippingAddress?.phone) {
    return `Customer (${data.shippingAddress.phone})`;
  }

  return 'Unknown Customer';
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();
    
    const orders = [];

    // Process orders and fetch customer names
    for (const doc of ordersSnapshot.docs) {
      const data = doc.data();
      const customerName = await getCustomerName(data);
      
      const order = {
        id: doc.id,
        orderId: doc.id, // For compatibility with existing frontend
        orderNumber: data.orderNumber || '',
        customerName: customerName,
        orderTotal: data.total || 0,
        status: data.orderStatus || 'Pending',
        paymentStatus: data.paymentStatus || 'Pending',
        dateCreated: data.createdAt?.toDate 
          ? data.createdAt.toDate().toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : new Date(data.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
        // Additional fields for order details
        userId: data.userId || '',
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryCharge: data.deliveryCharge || 0,
        tax: data.tax || 0,
        shippingAddress: data.shippingAddress || null,
        customerInfo: data.customerInfo || null,
        razorpayOrderId: data.razorpayOrderId || '',
        razorpayPaymentId: data.razorpayPaymentId || '',
      };
      orders.push(order);
    }

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const data = orderDoc.data();
    const customerName = await getCustomerName(data);
    
    const order = {
      id: orderDoc.id,
      orderId: orderDoc.id,
      orderNumber: data.orderNumber || '',
      customerName: customerName,
      orderTotal: data.total || 0,
      status: data.orderStatus || 'Pending',
      paymentStatus: data.paymentStatus || 'Pending',
      dateCreated: data.createdAt?.toDate 
        ? data.createdAt.toDate().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : new Date(data.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
      userId: data.userId || '',
      items: data.items || [],
      subtotal: data.subtotal || 0,
      deliveryCharge: data.deliveryCharge || 0,
      tax: data.tax || 0,
      shippingAddress: data.shippingAddress || null,
      customerInfo: data.customerInfo || null,
      razorpayOrderId: data.razorpayOrderId || '',
      razorpayPaymentId: data.razorpayPaymentId || '',
      deliveryStatus: data.deliveryStatus || 'pending',
      trackingNumber: data.trackingNumber || null,
      shiprocketOrderId: data.shiprocketOrderId || null,
      shiprocketShipmentId: data.shiprocketShipmentId || null,
      shiprocketAWB: data.shiprocketAWB || null,
      shiprocketStatus: data.shiprocketStatus || null,
    };

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, deliveryStatus } = req.body;

    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (orderStatus) {
      updateData.orderStatus = orderStatus;
    }

    if (deliveryStatus) {
      updateData.deliveryStatus = deliveryStatus;
    }

    await orderRef.update(updateData);

    res.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

// Create Shiprocket order
const createShiprocketOrder = async (req, res) => {
  try {
    console.log('📦 Creating Shiprocket order...');
    console.log('   Order ID:', req.params.id);
    
    // Debug: Log environment variables
    console.log('🔍 Environment Variables Check:');
    console.log(`   SHIPROCKET_EMAIL: ${process.env.SHIPROCKET_EMAIL ? '✅ Set (' + process.env.SHIPROCKET_EMAIL.substring(0, 5) + '...)' : '❌ Missing'}`);
    console.log(`   SHIPROCKET_PASSWORD: ${process.env.SHIPROCKET_PASSWORD ? '✅ Set (***hidden***)' : '❌ Missing'}`);
    
    const { id } = req.params;
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const orderData = orderDoc.data();

    // Validate required fields
    if (!orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is missing',
      });
    }

    const shippingAddress = orderData.shippingAddress;
    const items = orderData.items || [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items',
      });
    }

    // Prepare Shiprocket order request
    const shiprocketOrder = {
      order_id: orderData.orderNumber || `ORD-${id}`,
      order_date: orderData.createdAt?.toDate 
        ? orderData.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 19)
        : new Date().toISOString().replace('T', ' ').substring(0, 19),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse',
      billing_customer_name: shippingAddress.name || orderData.customerName || 'Customer',
      billing_last_name: '',
      billing_address: shippingAddress.address || '',
      billing_address_2: '',
      billing_city: shippingAddress.city || '',
      billing_pincode: shippingAddress.postalCode || '',
      billing_state: shippingAddress.state || '',
      billing_country: shippingAddress.country || 'India',
      billing_email: shippingAddress.email || orderData.customerInfo?.email || '',
      billing_phone: shippingAddress.phone || orderData.customerInfo?.phoneNumber || '',
      shipping_is_billing: true,
      order_items: items.map((item, index) => ({
        name: item.title || `Product ${index + 1}`,
        sku: item.itemId || `SKU-${Date.now()}-${index}`,
        units: item.quantity || 1,
        selling_price: Math.round(item.price || 0),
        discount: 0,
        tax: 0,
        hsn: 0,
      })),
      payment_method: orderData.paymentStatus === 'paid' ? 'PREPAID' : 'COD',
      shipping_charges: Math.round(orderData.deliveryCharge || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Math.round(orderData.subtotal || orderData.total || 0),
      length: 10,
      breadth: 15,
      height: 20,
      weight: 0.2,
    };

    // Create order in Shiprocket
    const shiprocketResponse = await shiprocketService.createOrder(shiprocketOrder);

    // Update order in Firestore with Shiprocket tracking info
    const updateData = {
      shiprocketOrderId: shiprocketResponse.order_id || shiprocketResponse.id,
      shiprocketShipmentId: shiprocketResponse.shipment_id || null,
      shiprocketAWB: shiprocketResponse.awb_code || null,
      shiprocketStatus: shiprocketResponse.status || 'created',
      updatedAt: new Date(),
    };

    await db.collection('orders').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Shiprocket order created successfully',
      data: {
        shiprocketOrderId: updateData.shiprocketOrderId,
        shipmentId: updateData.shiprocketShipmentId,
        awb: updateData.shiprocketAWB,
      },
    });
  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Shiprocket order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get Shiprocket order status
const getShiprocketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const orderData = orderDoc.data();
    const shiprocketOrderId = orderData.shiprocketOrderId;
    const shiprocketShipmentId = orderData.shiprocketShipmentId;

    if (!shiprocketOrderId && !shiprocketShipmentId) {
      return res.status(400).json({
        success: false,
        message: 'This order does not have a Shiprocket order ID or shipment ID',
      });
    }

    let shiprocketStatus = null;
    let shiprocketData = null;

    try {
      // Try to fetch by order ID first, then by shipment ID
      if (shiprocketOrderId) {
        console.log(`📦 Fetching Shiprocket order status for order ID: ${shiprocketOrderId}`);
        shiprocketData = await shiprocketService.getOrderStatus(shiprocketOrderId);
        console.log('📦 Shiprocket order response:', JSON.stringify(shiprocketData, null, 2));
        
        // Try multiple possible status fields from Shiprocket API
        // Shiprocket may return status in various fields depending on order type
        shiprocketStatus = shiprocketData.status 
          || shiprocketData.shipment_status 
          || shiprocketData.current_status
          || shiprocketData.order_status
          || shiprocketData.status_code // Sometimes status is numeric code
          || shiprocketData.data?.status
          || shiprocketData.data?.shipment_status
          || shiprocketData.data?.current_status
          || shiprocketData.data?.order_status
          || shiprocketData.shipments?.[0]?.status // Check first shipment status
          || shiprocketData.shipments?.[0]?.current_status
          || null;
        
        // If status is a number, try to map it to a status string
        if (typeof shiprocketStatus === 'number') {
          console.log(`⚠️ Shiprocket returned numeric status: ${shiprocketStatus}`);
          // Common Shiprocket status codes (may vary)
          const statusMap = {
            1: 'NEW',
            2: 'CONFIRMED',
            3: 'PROCESSING',
            4: 'SHIPPED',
            5: 'DELIVERED',
            6: 'CANCELLED',
          };
          shiprocketStatus = statusMap[shiprocketStatus] || shiprocketStatus;
        }
      } else if (shiprocketShipmentId) {
        console.log(`📦 Fetching Shiprocket shipment status for shipment ID: ${shiprocketShipmentId}`);
        shiprocketData = await shiprocketService.getShipmentStatus(shiprocketShipmentId);
        console.log('📦 Shiprocket shipment response:', JSON.stringify(shiprocketData, null, 2));
        
        // Try multiple possible status fields from Shiprocket API
        shiprocketStatus = shiprocketData.status 
          || shiprocketData.shipment_status 
          || shiprocketData.current_status
          || shiprocketData.order_status
          || shiprocketData.status_code
          || shiprocketData.data?.status
          || shiprocketData.data?.shipment_status
          || shiprocketData.data?.current_status
          || shiprocketData.data?.order_status
          || shiprocketData.shipments?.[0]?.status
          || shiprocketData.shipments?.[0]?.current_status
          || null;
        
        // If status is a number, try to map it to a status string
        if (typeof shiprocketStatus === 'number') {
          console.log(`⚠️ Shiprocket returned numeric status: ${shiprocketStatus}`);
          const statusMap = {
            1: 'NEW',
            2: 'CONFIRMED',
            3: 'PROCESSING',
            4: 'SHIPPED',
            5: 'DELIVERED',
            6: 'CANCELLED',
          };
          shiprocketStatus = statusMap[shiprocketStatus] || shiprocketStatus;
        }
      }

      console.log(`📦 Extracted Shiprocket status: ${shiprocketStatus}`);

      // Update order in Firestore with latest Shiprocket status
      if (shiprocketStatus) {
        await db.collection('orders').doc(id).update({
          shiprocketStatus: shiprocketStatus,
          shiprocketLastUpdated: new Date(),
          updatedAt: new Date(),
        });
      }

      // Extract AWB and tracking URL from various possible locations
      const awb = shiprocketData?.awb_code 
        || shiprocketData?.awb 
        || shiprocketData?.tracking_number  // Shiprocket may use tracking_number
        || shiprocketData?.data?.awb_code
        || shiprocketData?.data?.awb
        || shiprocketData?.data?.tracking_number  // Check nested tracking_number
        || orderData.shiprocketAWB 
        || null;
      
      const trackingUrl = shiprocketData?.tracking_url 
        || shiprocketData?.track_url
        || shiprocketData?.data?.tracking_url
        || shiprocketData?.data?.track_url
        || null;

      res.json({
        success: true,
        data: {
          status: shiprocketStatus,
          orderStatus: shiprocketStatus, // Alias for compatibility
          orderId: shiprocketOrderId,
          shipmentId: shiprocketShipmentId,
          awb: awb,
          trackingUrl: trackingUrl,
          fullData: shiprocketData,
        },
      });
    } catch (error) {
      console.error('Error fetching Shiprocket status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch Shiprocket order status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  } catch (error) {
    console.error('Error in getShiprocketStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Shiprocket status',
      error: error.message,
    });
  }
};

// Handle Shiprocket webhook for order status updates
const handleShiprocketWebhook = async (req, res) => {
  try {
    console.log('📦 Shiprocket webhook received:', JSON.stringify(req.body, null, 2));
    
    const webhookData = req.body;
    
    // Extract order ID from webhook payload
    // Shiprocket may send order_id, orderId, or shipment_id
    const shiprocketOrderId = webhookData.order_id 
      || webhookData.orderId 
      || webhookData.data?.order_id
      || webhookData.data?.orderId;
    
    const shiprocketShipmentId = webhookData.shipment_id 
      || webhookData.shipmentId
      || webhookData.data?.shipment_id
      || webhookData.data?.shipmentId;
    
    // Extract status from webhook payload
    const status = webhookData.status 
      || webhookData.order_status
      || webhookData.shipment_status
      || webhookData.data?.status
      || webhookData.data?.order_status
      || webhookData.data?.shipment_status;
    
    // Extract tracking number/AWB
    const trackingNumber = webhookData.tracking_number
      || webhookData.awb_code
      || webhookData.awb
      || webhookData.data?.tracking_number
      || webhookData.data?.awb_code
      || webhookData.data?.awb;
    
    if (!shiprocketOrderId && !shiprocketShipmentId) {
      console.warn('⚠️ Webhook received but no order_id or shipment_id found');
      return res.status(400).json({
        success: false,
        message: 'Missing order_id or shipment_id in webhook payload',
      });
    }
    
    if (!status) {
      console.warn('⚠️ Webhook received but no status found');
      return res.status(400).json({
        success: false,
        message: 'Missing status in webhook payload',
      });
    }
    
    // Find order in Firebase by Shiprocket order ID or shipment ID
    let orderQuery = db.collection('orders');
    let orderDoc = null;
    let orderId = null;
    
    if (shiprocketOrderId) {
      const ordersSnapshot = await orderQuery
        .where('shiprocketOrderId', '==', shiprocketOrderId)
        .limit(1)
        .get();
      
      if (!ordersSnapshot.empty) {
        orderDoc = ordersSnapshot.docs[0];
        orderId = orderDoc.id;
      }
    }
    
    // If not found by order ID, try shipment ID
    if (!orderDoc && shiprocketShipmentId) {
      const ordersSnapshot = await orderQuery
        .where('shiprocketShipmentId', '==', shiprocketShipmentId)
        .limit(1)
        .get();
      
      if (!ordersSnapshot.empty) {
        orderDoc = ordersSnapshot.docs[0];
        orderId = orderDoc.id;
      }
    }
    
    if (!orderDoc) {
      console.warn(`⚠️ Order not found for Shiprocket ID: ${shiprocketOrderId || shiprocketShipmentId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found for the given Shiprocket order ID or shipment ID',
      });
    }
    
    // Update order in Firebase
    const updateData = {
      shiprocketStatus: status,
      shiprocketLastUpdated: new Date(),
      updatedAt: new Date(),
    };
    
    // Update tracking number if provided
    if (trackingNumber) {
      updateData.shiprocketAWB = trackingNumber;
      updateData.trackingNumber = trackingNumber;
    }
    
    // Update Shiprocket IDs if not already set
    if (shiprocketOrderId && !orderDoc.data().shiprocketOrderId) {
      updateData.shiprocketOrderId = shiprocketOrderId;
    }
    
    if (shiprocketShipmentId && !orderDoc.data().shiprocketShipmentId) {
      updateData.shiprocketShipmentId = shiprocketShipmentId;
    }
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    console.log(`✅ Order ${orderId} updated via webhook with status: ${status}`);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        orderId: orderId,
        status: status,
        trackingNumber: trackingNumber,
      },
    });
  } catch (error) {
    console.error('Error processing Shiprocket webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createShiprocketOrder,
  getShiprocketStatus,
  handleShiprocketWebhook,
};

