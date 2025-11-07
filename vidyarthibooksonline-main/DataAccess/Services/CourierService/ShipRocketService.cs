using DataAccess.Data;
using DataAccess.Services.CourierService.Interface;
using Domain.DTOs.ShippingProvider.Shiprocket;
using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace DataAccess.Services.CourierService
{
    public class ShiprocketService : IShiprocketService
    {
        private const string ClientName = "ShiprocketClient";

        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ShiprocketService> _logger;

        public ShiprocketService(
            AppDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<ShiprocketService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /* ---------------------------------------------------------------
           Public API
        ----------------------------------------------------------------*/

        public async Task<string> CheckServiceability(ServiceabilityRequest model)
        {
            var client = await GetAuthenticatedClientAsync();
            using var response = await client.PostAsJsonAsync(
                "courier/serviceability/",
                model);

            await EnsureSuccessAsync(response, "check serviceability");
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> CreateOrder(OrderRequest model)
        {
            var client = await GetAuthenticatedClientAsync();
            using var response = await client.PostAsJsonAsync(
                "orders/create/adhoc",
                model);

            await EnsureSuccessAsync(response, "create Shiprocket order");
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetAuthToken()
        {
            // single row for Shiprocket – add Provider column if you store several
            var tokenInfo = await _context.ApiTokenInfos.SingleOrDefaultAsync();

            if (tokenInfo is { AuthToken: not null }
                && tokenInfo.Expiration > DateTime.UtcNow.AddMinutes(1))
            {
                return tokenInfo.AuthToken!;
            }

            var client = _httpClientFactory.CreateClient(ClientName);
            var credentials = new
            {
                //email = "codev1990@gmail.com",  // TODO: move to configuration / Key Vault
                //password = "Kt@trk925"
               email = "vbbshiproocketretail@gmail.com",  // TODO: move to configuration / Key Vault
               password = "8^LF&GEMKngo^9ZD"
            };

            using var resp = await client.PostAsJsonAsync("auth/login", credentials);
            await EnsureSuccessAsync(resp, "obtain Shiprocket token");

            var body = await resp.Content.ReadAsStringAsync();
            dynamic json = JsonConvert.DeserializeObject(body)!;
            var token = (string)json.token;
            var expiresSec = (int?)json.expires_in ?? 864000;           // 10 days default
            var expiry = DateTime.UtcNow.AddSeconds(expiresSec - 60); // refresh 1 min early

            if (tokenInfo is null)
            {
                tokenInfo = new ApiTokenInfo { AuthToken = token, Expiration = expiry };
                await _context.ApiTokenInfos.AddAsync(tokenInfo);
            }
            else
            {
                tokenInfo.AuthToken = token;
                tokenInfo.Expiration = expiry;
                _context.ApiTokenInfos.Update(tokenInfo);
            }
            await _context.SaveChangesAsync();
            return token;
        }

        /* ---------------------------------------------------------------
           Helpers
        ----------------------------------------------------------------*/

        private async Task<HttpClient> GetAuthenticatedClientAsync()
        {
            var token = await GetAuthToken();
            var client = _httpClientFactory.CreateClient(ClientName);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        private async Task EnsureSuccessAsync(HttpResponseMessage response, string op)
        {
            if (response.IsSuccessStatusCode) return;

            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to {Op}: {Status} {Body}", op, response.StatusCode, body);
            throw new InvalidOperationException($"Failed to {op}. Status: {response.StatusCode}.");
        }
    }
}
