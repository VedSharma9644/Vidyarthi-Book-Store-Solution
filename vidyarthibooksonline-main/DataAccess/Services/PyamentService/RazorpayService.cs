using DataAccess.Data;
using DataAccess.Services.PyamentService.Interface;
using Domain.DTOs.PaymentGateway;
using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Services.PyamentService
{
    public class RazorpayServices : IRazorpayService
    {
        private readonly AppDbContext _context;

        public RazorpayServices(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CreateOrderDtos> CreateOrder(CreateOrderDtos model)
        {
            try
            {
                var config = await GetPaymentGatewayConfig();
                if (config == null)
                {
                    throw new Exception("Payment gateway configuration not found");
                }

                // Initialize Razorpay client
                var client = new RazorpayClient(config.ApiKey, config.SecretKey);

                // Create the order options
                var options = new Dictionary<string, object>
                {
                    { "amount", model.amount }, // Amount in paise (1 INR = 100 paise)
                    { "currency", model.currency },
                    { "receipt", model.receipt },
                    { "payment_capture", 1 } // Ensure auto-capture is enabled
                };

                // Create order using Razorpay API
                Order order = client.Order.Create(options);

                // Prepare the response DTO with order details
                var createOrderDtos = new CreateOrderDtos
                {
                    orderId = order["id"].ToString(),
                    amount = model.amount,
                    currency = model.currency,
                    receipt = model.receipt,
                    status = order["status"].ToString(),
                    createdAt = DateTimeOffset.FromUnixTimeSeconds(long.Parse(order["created_at"].ToString())).DateTime
                };

                return createOrderDtos;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Error creating Razorpay order: " + ex.Message, ex);
            }
        }

        public async Task<PaymentSuccessDto> VerifyPayment(PaymentSuccessDto model)
        {
            try
            {
                var config = await GetPaymentGatewayConfig();
                if (config == null)
                {
                    throw new Exception("Payment gateway configuration not found");
                }

                // Verify the payment signature
                string orderId = model.razorpayOrderId;
                string paymentId = model.razorpayPaymentId;
                string signature = model.razorpaySignature;
                string secretKey = config.SecretKey!;

                string generatedSignature = GenerateSignatureAsync(orderId, paymentId, secretKey);

                if (generatedSignature != signature)
                {
                    throw new Exception("Payment signature verification failed");
                }

                // Verify payment status with Razorpay API
                var client = new RazorpayClient(config.ApiKey, config.SecretKey);
                Payment payment = client.Payment.Fetch(paymentId);

                if (payment["status"] != "captured")
                {
                    throw new Exception("Payment not captured");
                }

                return model;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Error verifying payment: " + ex.Message, ex);
            }
        }

        private string GenerateSignatureAsync(string orderId, string paymentId, string secretKey)
        {
            string data = $"{orderId}|{paymentId}";
            byte[] bytes = Encoding.UTF8.GetBytes(data);
            byte[] secretBytes = Encoding.UTF8.GetBytes(secretKey);
            using (HMACSHA256 hmac = new HMACSHA256(secretBytes))
            {
                byte[] signatureBytes = hmac.ComputeHash(bytes);
                return BitConverter.ToString(signatureBytes).Replace("-", "").ToLower();
            }
        }

        private async Task<PaymentGatewayConfig> GetPaymentGatewayConfig()
        {
            var data = await _context.PaymentGatewayConfigs
                .Where(x => x.IsActive == true && x.GatewayName == SD.PaymentGateways.Razorpay)
                .FirstOrDefaultAsync();
            return data!;
        }
    }
}