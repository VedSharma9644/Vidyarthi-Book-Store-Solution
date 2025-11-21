# PowerShell script to find orders with Shiprocket Order IDs
# This helps you get real Order IDs for webhook testing

$baseUrl = "http://localhost:5000"

Write-Host "Fetching orders with Shiprocket IDs..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Get
    
    if ($response.success -and $response.data) {
        $ordersWithShiprocket = $response.data | Where-Object { 
            $_.shiprocketOrderId -or $_.shiprocketShipmentId 
        }
        
        if ($ordersWithShiprocket.Count -eq 0) {
            Write-Host "`n❌ No orders found with Shiprocket IDs." -ForegroundColor Yellow
            Write-Host "`nTo create a Shiprocket order:" -ForegroundColor Cyan
            Write-Host "1. Go to admin panel -> Orders" -ForegroundColor White
            Write-Host "2. Open an order" -ForegroundColor White
            Write-Host "3. Click 'Create Shiprocket Order' button" -ForegroundColor White
        } else {
            Write-Host "`n✅ Found $($ordersWithShiprocket.Count) order(s) with Shiprocket IDs:`n" -ForegroundColor Green
            
            foreach ($order in $ordersWithShiprocket) {
                Write-Host "Order ID: $($order.id)" -ForegroundColor Yellow
                Write-Host "  Order Number: $($order.orderNumber)" -ForegroundColor White
                Write-Host "  Customer: $($order.customerName)" -ForegroundColor White
                if ($order.shiprocketOrderId) {
                    Write-Host "  Shiprocket Order ID: $($order.shiprocketOrderId)" -ForegroundColor Green
                }
                if ($order.shiprocketShipmentId) {
                    Write-Host "  Shiprocket Shipment ID: $($order.shiprocketShipmentId)" -ForegroundColor Green
                }
                Write-Host ""
            }
            
            Write-Host "`nTo test webhook, use one of the Shiprocket Order IDs above:" -ForegroundColor Cyan
            Write-Host ".\test-webhook.ps1 -OrderId `"<ShiprocketOrderID>`" -Status `"ORDER_SHIPPED`"" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Failed to fetch orders" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

