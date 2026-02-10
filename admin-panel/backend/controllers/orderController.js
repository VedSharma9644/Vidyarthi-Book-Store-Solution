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

/**
 * Enrich order items with school, grade, and section names by looking up each item's book.
 * @param {Array<{ itemId: string }>} items - Order items (must have itemId)
 * @returns {Promise<Array>} Items with schoolName, gradeName, sectionName added
 */
const enrichOrderItemsWithSchoolGradeSection = async (items) => {
  if (!items || items.length === 0) return items;
  const enriched = [];
  const schoolCache = {};
  const gradeCache = {};
  const subgradeCache = {};
  const getSchoolName = async (schoolId) => {
    if (!schoolId) return '';
    if (schoolCache[schoolId] !== undefined) return schoolCache[schoolId];
    try {
      const doc = await db.collection('schools').doc(schoolId).get();
      schoolCache[schoolId] = doc.exists ? (doc.data().name || doc.data().schoolName || '') : '';
    } catch {
      schoolCache[schoolId] = '';
    }
    return schoolCache[schoolId];
  };
  const getGradeName = async (gradeId) => {
    if (!gradeId) return '';
    if (gradeCache[gradeId] !== undefined) return gradeCache[gradeId];
    try {
      const doc = await db.collection('grades').doc(gradeId).get();
      gradeCache[gradeId] = doc.exists ? (doc.data().name || '') : '';
    } catch {
      gradeCache[gradeId] = '';
    }
    return gradeCache[gradeId];
  };
  const getSubgradeName = async (subgradeId) => {
    if (!subgradeId) return '';
    if (subgradeCache[subgradeId] !== undefined) return subgradeCache[subgradeId];
    try {
      const doc = await db.collection('subgrades').doc(subgradeId).get();
      subgradeCache[subgradeId] = doc.exists ? (doc.data().name || '') : '';
    } catch {
      subgradeCache[subgradeId] = '';
    }
    return subgradeCache[subgradeId];
  };
  for (const item of items) {
    let schoolName = '';
    let gradeName = '';
    let sectionName = '';
    if (item.itemId) {
      try {
        const bookDoc = await db.collection('books').doc(item.itemId).get();
        if (bookDoc.exists) {
          const book = bookDoc.data();
          const schoolId = book.schoolId || '';
          const gradeId = book.gradeId || '';
          const subgradeId = book.subgradeId || '';
          [schoolName, gradeName, sectionName] = await Promise.all([
            getSchoolName(schoolId),
            getGradeName(gradeId),
            getSubgradeName(subgradeId),
          ]);
        }
      } catch (err) {
        console.warn('Enrich order item: could not resolve book', item.itemId, err.message);
      }
    }
    enriched.push({
      ...item,
      schoolName: schoolName || '—',
      gradeName: gradeName || '—',
      sectionName: sectionName || '—',
    });
  }
  return enriched;
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
    const rawItems = data.items || [];
    const enrichedItems = await enrichOrderItemsWithSchoolGradeSection(rawItems);
    const firstItem = enrichedItems[0];
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
      items: enrichedItems,
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
      schoolName: firstItem?.schoolName || '',
      gradeName: firstItem?.gradeName || '',
      sectionName: firstItem?.sectionName || '',
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
  const orderId = req.params.id;
  console.log('📦 [createShiprocketOrder] START orderId=', orderId);
  try {
    console.log('📦 Creating Shiprocket order...');
    console.log('   Order ID:', orderId);

    // Fail fast with clear message if Shiprocket credentials are not set (common on production)
    if (!shiprocketService.hasApiKeyAuth() && !shiprocketService.hasEmailPasswordAuth()) {
      console.error('❌ Shiprocket create failed: credentials not configured on this server.');
      return res.status(503).json({
        success: false,
        message: 'Shiprocket is not configured on this server. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD (or SHIPROCKET_API_KEY and SHIPROCKET_API_SECRET) in the server environment (e.g. Cloud Run environment variables).',
      });
    }

    console.log('🔍 Shiprocket credentials: present');

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

    // Shiprocket requires pincode and phone for India; use shipping + customerInfo fallbacks (app backend saves customerInfo, not top-level customerName)
    const pincode = String(shippingAddress.postalCode ?? orderData.shippingAddress?.postalCode ?? '').trim();
    const phone = String(shippingAddress.phone ?? orderData.customerInfo?.phoneNumber ?? '').trim();
    if (!pincode || pincode.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address must have a valid postal code (pincode) for Shiprocket.',
      });
    }
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address must have a phone number for Shiprocket.',
      });
    }

    // pickup_location must match a Pickup Address name in Shiprocket (Settings > Pickup Address). Default 'warehouse-1' (or set SHIPROCKET_PICKUP_LOCATION to 'Home', 'warehouse-1', etc.).
    const pickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse-1').trim();
    if (!pickupLocation) {
      return res.status(400).json({
        success: false,
        message: 'SHIPROCKET_PICKUP_LOCATION is not set. Set it to the exact name of a Pickup Address in Shiprocket (Settings > Pickup Address).',
      });
    }

    // Prepare Shiprocket order request (field names per Shiprocket API). Use customerInfo when present (app backend order shape).
    const shiprocketOrder = {
      order_id: orderData.orderNumber || `ORD-${id}`,
      order_date: orderData.createdAt?.toDate
        ? orderData.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 19)
        : new Date().toISOString().replace('T', ' ').substring(0, 19),
      pickup_location: pickupLocation,
      billing_customer_name: shippingAddress.name || orderData.customerInfo?.name || orderData.customerName || 'Customer',
      billing_last_name: '',
      billing_address: (shippingAddress.address || '').trim() || 'Address not provided',
      billing_address_2: '',
      billing_city: (shippingAddress.city || '').trim() || 'City not provided',
      billing_pincode: pincode,
      billing_state: (shippingAddress.state || '').trim() || 'State not provided',
      billing_country: (shippingAddress.country || '').trim() || 'India',
      billing_email: (shippingAddress.email || orderData.customerInfo?.email || '').trim() || '',
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items.map((item, index) => ({
        name: (item.title || `Product ${index + 1}`).toString().substring(0, 255),
        sku: (item.itemId || `SKU-${Date.now()}-${index}`).toString().replace(/[^a-zA-Z0-9\-_]/g, '-').substring(0, 100),
        units: Math.max(1, parseInt(item.quantity, 10) || 1),
        selling_price: Math.round(Number(item.price) || 0),
        discount: 0,
        tax: 0,
        hsn: 0,
      })),
      payment_method: orderData.paymentStatus === 'paid' ? 'prepaid' : 'cod',
      shipping_charges: Math.round(Number(orderData.deliveryCharge) || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Math.round(Number(orderData.subtotal) || Number(orderData.total) || 0),
      length: 10,
      breadth: 15,
      height: 20,
      weight: 0.2,
    };

    // Create order in Shiprocket
    const shiprocketResponse = await shiprocketService.createOrder(shiprocketOrder);

    // Update order in Firestore with Shiprocket tracking info.
    // Shiprocket may return { order_id, shipment_id } at top level or nested under .data
    const data = shiprocketResponse?.data ?? shiprocketResponse;
    const srOrderId = shiprocketResponse?.order_id ?? shiprocketResponse?.id
      ?? data?.order_id ?? data?.id ?? data?.order?.id ?? null;
    const shipmentId = shiprocketResponse?.shipment_id ?? data?.shipment_id
      ?? data?.shipments?.[0]?.id ?? data?.shipments?.[0]?.shipment_id ?? data?.shipment?.id ?? null;
    const awbCode = shiprocketResponse?.awb_code ?? shiprocketResponse?.awb
      ?? data?.awb_code ?? data?.awb ?? null;
    const status = shiprocketResponse?.status ?? data?.status ?? data?.order_status ?? 'created';
    const updateData = {
      shiprocketOrderId: srOrderId,
      shiprocketShipmentId: shipmentId,
      shiprocketAWB: awbCode,
      shiprocketStatus: status,
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
    console.error('Error stack:', error.stack);
    // Always return the actual error message so admin can see why it failed (e.g. auth, validation)
    const message = error.message || 'Failed to create Shiprocket order';
    res.status(500).json({
      success: false,
      message,
      error: message,
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
      return res.status(200).json({
        success: true,
        data: {
          hasShiprocket: false,
          message: 'This order does not have a Shiprocket order ID or shipment ID',
          status: null,
          orderStatus: null,
          orderId: null,
          shipmentId: null,
          awb: null,
          trackingUrl: null,
          fullData: null,
        },
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
    
    // Update order in Firebase. Firestore does not allow undefined; use null for missing values.
    const updateData = {
      shiprocketStatus: status ?? null,
      shiprocketLastUpdated: new Date(),
      updatedAt: new Date(),
    };
    
    if (trackingNumber) {
      updateData.shiprocketAWB = trackingNumber;
      updateData.trackingNumber = trackingNumber;
    }
    
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

