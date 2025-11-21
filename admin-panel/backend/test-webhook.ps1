# PowerShell script to test Shiprocket webhook endpoint
# Usage: .\test-webhook.ps1 -OrderId "123456" -Status "ORDER_SHIPPED"

param(
    [Parameter(Mandatory=$true)]
    [string]$OrderId,
    
    [Parameter(Mandatory=$false)]
    [string]$Status = "ORDER_SHIPPED",
    
    [Parameter(Mandatory=$false)]
    [string]$TrackingNumber = "SRKT123456789",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:5000"
)

$webhookUrl = "$BaseUrl/api/webhooks/shiprocket"

$body = @{
    order_id = $OrderId
    status = $Status
    status_code = switch ($Status) {
        "ORDER_PLACED" { 100 }
        "ORDER_CONFIRMED" { 200 }
        "ORDER_SHIPPED" { 300 }
        "ORDER_DELIVERED" { 400 }
        default { 0 }
    }
    tracking_number = $TrackingNumber
    courier = "Delhivery"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

Write-Host "Sending webhook to: $webhookUrl" -ForegroundColor Cyan
Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $webhookUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

