using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using DataAccess.Services.CourierService.Interface;
using Domain.DTOs.ShippingProvider.Shiprocket;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class OrderRepo : BaseRepo<Order>, IOrderRepo
    {
        private readonly AppDbContext _context;
        private readonly IShiprocketService _shiprocketService;
        public OrderRepo(AppDbContext context, IShiprocketService shiprocketService ) : base(context)
        {
            _context = context;
            _shiprocketService = shiprocketService;
        }

        public async Task<IEnumerable<Order>> GetOrdersByUserAsync(string userId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderWithItemsAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .Include(o => o.Coupon)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }

        public async Task<IEnumerable<Order>> GetPendingOrdersAsync()
        {
            return await GetOrdersByStatusAsync("Pending");
        }

        public async Task<IEnumerable<Order>> GetCompletedOrdersAsync()
        {
            return await GetOrdersByStatusAsync("Completed");
        }

        public async Task<IEnumerable<Order>> GetOrdersByStatusAsync(string status)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .Where(o => o.OrderStatus == status)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Order>> GetAllOrder()
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Book)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order> CreateOrderAsync(Order order, IEnumerable<OrderItem> items)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Generate order number if not provided
                if (string.IsNullOrEmpty(order.OrderNumber))
                {
                    order.OrderNumber = GenerateOrderNumber();
                }

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();

                foreach (var item in items)
                {
                    item.OrderId = order.Id;
                    await _context.OrderItems.AddAsync(item);
                }

                await _context.SaveChangesAsync();
               // await CreateShiprocketOrderAsync(order); //shiprocket order
                await transaction.CommitAsync();

                return order;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return false;

            order.OrderStatus = newStatus;
            _context.Orders.Update(order);
            
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> UpdatePaymentStatusAsync(int orderId, string newStatus)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return false;

            order.PaymentStatus = newStatus;
            _context.Orders.Update(order);

           
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<decimal> GetTotalSalesAsync()
        {
            return await _context.Orders
                .Where(o => o.PaymentStatus == "Paid")
                .SumAsync(o => o.FinalAmount);
        }

        public async Task<int> GetOrderCountByStatusAsync(string status)
        {
            return await _context.Orders
                .CountAsync(o => o.OrderStatus == status);
        }

        private string GenerateOrderNumber()
        {
            var now = DateTime.Now;
            return $"ORD-{now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
        }

        #region SHIPROCKET API CALL
        //call shiprocket create order  api 
        private async Task<string> CreateShipRocketOrder(Order model)
        {
            try
            {
                // Prepare the order request for Shiprocket
                var orderRequest = new OrderRequest
                {
                    order_id = model.OrderNumber!,
                    order_date = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"), // Matches the format required by Shiprocket
                    pickup_location = "warehouse",
                    // Billing Information
                    billing_customer_name = model.ShippingName!,
                    billing_last_name = "", // Add if available
                    billing_address = model.ShippingAddress!,
                    billing_address_2 = "", // Add secondary address if applicable
                    billing_city = model.ShippingCity!,
                    billing_pincode = model.ShippingPostalCode!,
                    billing_state = model.ShippingState!,
                    billing_country = "India",
                    billing_email = model.ShippingEmail!,
                    billing_phone = model.ShippingPhone!,

                    // Shipping Information - assuming it's the same as billing
                    shipping_is_billing = true,

                    // Order Items (from database)
                    order_items = await GetOrderItemsFromDatabase(model.Id),

                    // Payment and shipping details
                    payment_method = "PREPAID", // "PREPAID" or "COD"
                    shipping_charges = 0, // Change as necessary
                    giftwrap_charges = 0, // Change if applicable
                    transaction_charges = 0, // Change if applicable
                    total_discount = 0, // Adjust based on any discount
                    sub_total = Convert.ToInt32(model.OrderTotal), // Total order value

                    // Package dimensions
                    length = 10, // Adjust as necessary
                    breadth = 15, // Adjust as necessary
                    height = 20, // Adjust as necessary
                    weight = 0.2f // Adjust based on package weight
                };

                // Call Shiprocket CreateOrder API

                var response = await _shiprocketService.CreateOrder(orderRequest);

                return response; // Return the response from Shiprocket
            }
            catch (Exception)
            {
                // Log the exception for better error tracing
                throw;
            }
        }

        // New method to retrieve order items from the database
        private async Task<List<OrderItemApi>> GetOrderItemsFromDatabase(int orderId)
        {
            return await _context.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .Include(oi => oi.Book)
                .Select(oi => new OrderItemApi
                {
                    name = oi.Book!.Title!,
                    sku = GenerateSku(oi.Book.Title!),
                    units = oi.Quantity,
                    selling_price = Convert.ToInt32(oi.UnitPrice),
                    discount = 0!,
                    tax = 0
                })
                .ToListAsync();
        }

        private static string GenerateSku(string productName)
        {
            var guid = Guid.NewGuid().ToString().ToUpper();
            var firstLetter = productName.Trim()[0].ToString().ToUpper();
            var randomDigits = new string(Enumerable.Repeat("0123456789", 6).Select(s => s[new Random().Next(s.Length)]).ToArray());
            return $"{firstLetter}{guid.Substring(0, 6)}{randomDigits}";
        }

        public async Task CreateShiprocketOrderAsync(Order shiprocketOrder)
        {
              await CreateShipRocketOrder(shiprocketOrder);
        }
        #endregion
    }
}