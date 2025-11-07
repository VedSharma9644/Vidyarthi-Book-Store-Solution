using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace DataAccess.Repository
{
    public class Fast2SmsService : ISmsService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _dbContext;
        public Fast2SmsService(HttpClient httpClient, IConfiguration configuration, AppDbContext dbContext = null)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _dbContext = dbContext;
        }

        // 1. FAST2SMS Manual OTP
        public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
        {
            var baseUrl = "https://www.fast2sms.com/dev/bulkV2";
            var authorization = "dLzw9Ria2Hv75ybJVYSpsh0ueBPfCg3T1loENxnIXrQKG8UkOFKeVt3Elm2bikucMAs1Zh0yP5rwB69f";
            var route = "otp";
            var flash = "0";

            var fullUrl = $"{baseUrl}?authorization={authorization}&route={route}&variables_values={otp}&flash={flash}&numbers={phoneNumber}";

            try
            {
                var response = await _httpClient.GetAsync(fullUrl);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        // 2. OTP Generator (5-digit)
        public string GenerateOtp()
        {
            Random rand = new Random();
            int otp = rand.Next(10000, 99999); // 5-digit OTP
            return otp.ToString();
        }

        // 3. 2Factor.in API with hardcoded key
        public async Task<bool> SendOtp2fAsync(string phoneNumber, string templateName = "OTP1")
        {
            var apiKey = "ce34ca26-2e5c-11f0-8b17-0200cd936042"; // Replace with your actual API key

            // Generate random 6-digit OTP
            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();

            string url = $"https://2factor.in/API/V1/{apiKey}/SMS/{phoneNumber}/{otp}/{templateName}";

            try
            {
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return false;
                }

                await SaveOtpToDatabaseAsync(phoneNumber, otp); // Save OTP to DB only if SMS sent successfully

                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task SaveOtpToDatabaseAsync(string phoneNumber, string otp)
        {
            try
            {
                // Delete expired OTP entries and existing entries for the same phone number
                var expiredOrExistingOtps = await _dbContext.MembersOtps
                    .Where(o => o.MobileNumber == phoneNumber || o.ExpiryDateTime < DateTime.Now)
                    .ToListAsync();

                if (expiredOrExistingOtps.Any())
                {
                    _dbContext.MembersOtps.RemoveRange(expiredOrExistingOtps);
                    await _dbContext.SaveChangesAsync();
                }

                // Create new OTP entry
                var otpEntry = new MembersOtp
                {
                    MobileNumber = phoneNumber,
                    OTP = otp,
                    ExpiryDateTime = DateTime.Now.AddMinutes(5)
                };

                _dbContext.MembersOtps.Add(otpEntry);
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Consider logging the exception
                throw;
            }
        }

        
    }
}
