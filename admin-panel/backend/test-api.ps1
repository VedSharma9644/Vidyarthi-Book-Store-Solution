# Test School API with PowerShell
$baseUrl = "http://localhost:5000"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "School API Test Suite" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "🧪 Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server is not running or not accessible" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get All Schools (before creating)
Write-Host "🧪 Testing Get All Schools (before create)..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/schools" -Method Get
    Write-Host "✅ Get All Schools successful!" -ForegroundColor Green
    Write-Host "Total schools: $($getResponse.count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get schools" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Create School
Write-Host "🧪 Testing Create School API..." -ForegroundColor Yellow

$testSchool = @{
    name = "Test School API"
    branchName = "Test Branch"
    code = "TEST001"
    board = "CBSE"
    address = "123 Test Street, Test Area"
    city = "Test City"
    state = "Test State"
    phoneNumber = "1234567890"
    email = "test@school.com"
    schoolLogo = "https://example.com/logo.png"
} | ConvertTo-Json

Write-Host "Request data:" -ForegroundColor Gray
Write-Host $testSchool -ForegroundColor Gray
Write-Host ""

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/schools" -Method Post -Body $testSchool -ContentType "application/json"
    
    if ($createResponse.success) {
        Write-Host "✅ School created successfully!" -ForegroundColor Green
        Write-Host "School ID: $($createResponse.data.id)" -ForegroundColor Gray
        Write-Host "School Name: $($createResponse.data.name)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Full Response:" -ForegroundColor Gray
        Write-Host ($createResponse | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to create school" -ForegroundColor Red
        Write-Host "Message: $($createResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error creating school" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Get All Schools (after creating)
Write-Host "🧪 Testing Get All Schools (after create)..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/schools" -Method Get
    Write-Host "✅ Get All Schools successful!" -ForegroundColor Green
    Write-Host "Total schools: $($getResponse.count)" -ForegroundColor Gray
    if ($getResponse.data.Count -gt 0) {
        Write-Host "First school: $($getResponse.data[0].name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get schools" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Tests completed!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

