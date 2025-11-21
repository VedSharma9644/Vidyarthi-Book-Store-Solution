# Shiprocket Webhook Testing Guide

This guide shows how to test the Shiprocket webhook endpoint using curl or Postman.

## Webhook Endpoint

**URL:** `POST /api/webhooks/shiprocket`

**Base URL (Local):** `http://localhost:5000`
**Base URL (Production):** `https://admin-panel-backend-594708558503.us-central1.run.app`

## Testing with cURL (Linux/Mac/Git Bash)

### 1. Test Order Placed Status

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123456",
    "status": "ORDER_PLACED",
    "status_code": 100,
    "message": "Order has been placed successfully",
    "timestamp": "2025-11-21T10:00:00Z"
  }'
```

### 2. Test Order Confirmed Status

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123456",
    "status": "ORDER_CONFIRMED",
    "status_code": 200,
    "message": "Order has been confirmed",
    "timestamp": "2025-11-21T10:05:00Z"
  }'
```

### 3. Test Order Shipped Status (with tracking number)

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123456",
    "status": "ORDER_SHIPPED",
    "status_code": 300,
    "message": "Order has been shipped via courier partner",
    "tracking_number": "SRKT123456789",
    "courier": "Delhivery",
    "timestamp": "2025-11-21T12:00:00Z"
  }'
```

### 4. Test Order Delivered Status

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123456",
    "status": "ORDER_DELIVERED",
    "status_code": 400,
    "message": "Order has been delivered to customer",
    "delivered_at": "2025-11-22T15:30:00Z"
  }'
```

### 5. Test with Shipment ID (alternative)

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "shipment_id": "SHIP123456",
    "status": "ORDER_SHIPPED",
    "tracking_number": "SRKT987654321",
    "awb_code": "SRKT987654321"
  }'
```

### 6. Test with Nested Data Structure

```bash
curl -X POST http://localhost:5000/api/webhooks/shiprocket \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "order_id": "123456",
      "status": "ORDER_SHIPPED",
      "tracking_number": "SRKT123456789"
    }
  }'
```

## Testing with PowerShell (Windows)

**Note:** In PowerShell, `curl` is an alias for `Invoke-WebRequest`. Use `Invoke-RestMethod` for JSON APIs or `curl.exe` if you have curl installed.

### Option 1: Using Invoke-RestMethod (Recommended for PowerShell)

```powershell
# Test Order Shipped Status
Invoke-RestMethod -Uri "http://localhost:5000/api/webhooks/shiprocket" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "order_id": "123456",
    "status": "ORDER_SHIPPED",
    "status_code": 300,
    "tracking_number": "SRKT123456789",
    "courier": "Delhivery"
  }'

# Test Order Delivered Status
Invoke-RestMethod -Uri "http://localhost:5000/api/webhooks/shiprocket" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "order_id": "123456",
    "status": "ORDER_DELIVERED",
    "status_code": 400
  }'

# Test Order Placed Status
Invoke-RestMethod -Uri "http://localhost:5000/api/webhooks/shiprocket" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "order_id": "123456",
    "status": "ORDER_PLACED",
    "status_code": 100
  }'
```

### Option 2: Using curl.exe (if curl is installed)

```powershell
curl.exe -X POST http://localhost:5000/api/webhooks/shiprocket `
  -H "Content-Type: application/json" `
  -d '{\"order_id\": \"123456\", \"status\": \"ORDER_SHIPPED\", \"tracking_number\": \"SRKT123456789\"}'
```

### Option 3: Using Invoke-WebRequest (Alternative)

```powershell
$body = @{
    order_id = "123456"
    status = "ORDER_SHIPPED"
    status_code = 300
    tracking_number = "SRKT123456789"
    courier = "Delhivery"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/webhooks/shiprocket" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Important Notes

1. **Order ID Matching**: The webhook will try to find an order in Firebase by matching:
   - `shiprocketOrderId` field with the `order_id` from webhook
   - `shiprocketShipmentId` field with the `shipment_id` from webhook

2. **Before Testing**: Make sure you have:
   - Created a Shiprocket order for a test order in your admin panel
   - The order has a `shiprocketOrderId` or `shiprocketShipmentId` stored in Firebase
   - Use that ID in your webhook test payload

3. **Check Logs**: After sending a webhook, check your server console logs to see:
   - The webhook payload received
   - Whether the order was found
   - The update that was made

## Expected Response

**Success Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "orderId": "firebase-order-id",
    "status": "ORDER_SHIPPED",
    "trackingNumber": "SRKT123456789"
  }
}
```

**Error Response (Order Not Found):**
```json
{
  "success": false,
  "message": "Order not found for the given Shiprocket order ID or shipment ID"
}
```

## Finding Orders with Shiprocket IDs

### Option 1: Use PowerShell Script (Easiest)

```powershell
# Find all orders with Shiprocket IDs
.\find-shiprocket-orders.ps1
```

This will list all orders that have Shiprocket Order IDs, which you can use for testing.

### Option 2: Check Admin Panel

1. Go to your admin panel → Orders
2. Open an order that has been created in Shiprocket
3. Look for "Shiprocket Order ID" or "Shiprocket Shipment ID" in the order details
4. Copy that ID for webhook testing

### Option 3: Query API Directly

```powershell
# Get all orders and find ones with Shiprocket IDs
$orders = Invoke-RestMethod -Uri "http://localhost:5000/api/orders"
$orders.data | Where-Object { $_.shiprocketOrderId } | Select-Object id, orderNumber, shiprocketOrderId
```

## Testing Workflow

1. **Find an order with Shiprocket ID** using one of the methods above
2. **Use the Shiprocket Order ID** (not the Firebase order ID) in your webhook test
3. **Send webhook** using one of the PowerShell commands above
4. **Check the order details page** - the status should update automatically
5. **Refresh the page** to see the updated status

## Production Setup

To receive real webhooks from Shiprocket:

1. **Get your webhook URL**: `https://admin-panel-backend-594708558503.us-central1.run.app/api/webhooks/shiprocket`
2. **Configure in Shiprocket Dashboard**:
   - Go to Settings → Webhooks
   - Add webhook URL
   - Select events: Order Status Updates, Shipment Status Updates
3. **Test with a real order** to verify webhooks are being received

## Troubleshooting

- **Order not found**: Make sure the `order_id` in the webhook matches the `shiprocketOrderId` stored in Firebase
- **Status not updating**: Check server logs for errors
- **Webhook not received**: Verify the webhook URL is accessible and CORS is configured correctly

