using DataAccess.Data;
using DataAccess.Repository.Interface;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace WebUi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly AppDbContext _context;

        public OrderController(IUnitOfWork unitOfWork, AppDbContext context)
        {
            _unitOfWork = unitOfWork;
            _context = context;
        }

        [HttpGet("getorders")]
        public async Task<IActionResult> GetOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            try
            {
                var orders = await _unitOfWork.Orders.GetOrdersByUserAsync(userId);

                var ordersDto = orders.Select(order => new
                {
                    id = order.Id,
                    orderNumber = order.OrderNumber,
                    orderDate = order.OrderDate,
                    orderTotal = order.OrderTotal,
                    discountAmount = order.DiscountAmount,
                    taxAmount = order.TaxAmount,
                    shippingAmount = order.ShippingAmount,
                    finalAmount = order.FinalAmount,
                    orderStatus = order.OrderStatus,
                    paymentStatus = order.PaymentStatus,
                    paymentMethod = order.PaymentMethod,
                    shippingName = order.ShippingName,
                    shippingPhone = order.ShippingPhone,
                    shippingAddress = order.ShippingAddress,
                    shippingCity = order.ShippingCity,
                    shippingState = order.ShippingState,
                    shippingPostalCode = order.ShippingPostalCode,
                    shippingCountry = order.ShippingCountry,
                    shippingEmail = order.ShippingEmail,
                    items = order.OrderItems.Select(item => new
                    {
                        id = item.Id,
                        bookId = item.BookId,
                        bookTitle = item.Book?.Title ?? "Unknown",
                        bookImage = item.Book?.CoverImageUrl ?? "",
                        quantity = item.Quantity,
                        unitPrice = item.UnitPrice,
                        totalPrice = item.TotalPrice,
                        discountAmount = item.DiscountAmount
                    }).ToList()
                }).ToList();

                return Ok(new { success = true, data = ordersDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error fetching orders", error = ex.Message });
            }
        }

        [HttpGet("getorder/{orderId}")]
        public async Task<IActionResult> GetOrder(int orderId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            try
            {
                var order = await _unitOfWork.Orders.GetOrderWithItemsAsync(orderId);

                if (order == null)
                {
                    return NotFound(new { success = false, message = "Order not found" });
                }

                // Verify order belongs to user
                if (order.UserId != userId)
                {
                    return Forbid();
                }

                var orderDto = new
                {
                    id = order.Id,
                    orderNumber = order.OrderNumber,
                    orderDate = order.OrderDate,
                    orderTotal = order.OrderTotal,
                    discountAmount = order.DiscountAmount,
                    taxAmount = order.TaxAmount,
                    shippingAmount = order.ShippingAmount,
                    finalAmount = order.FinalAmount,
                    orderStatus = order.OrderStatus,
                    paymentStatus = order.PaymentStatus,
                    paymentMethod = order.PaymentMethod,
                    paymentTransactionId = order.PaymentTransactionId,
                    paymentOrderId = order.PaymentOrderId,
                    shippingName = order.ShippingName,
                    shippingPhone = order.ShippingPhone,
                    shippingAddress = order.ShippingAddress,
                    shippingCity = order.ShippingCity,
                    shippingState = order.ShippingState,
                    shippingPostalCode = order.ShippingPostalCode,
                    shippingCountry = order.ShippingCountry,
                    shippingEmail = order.ShippingEmail,
                    alternatePhone = order.AlternetPhone,
                    couponId = order.CouponId,
                    items = order.OrderItems.Select(item => new
                    {
                        id = item.Id,
                        bookId = item.BookId,
                        bookTitle = item.Book?.Title ?? "Unknown",
                        bookAuthor = item.Book?.Author ?? "",
                        bookImage = item.Book?.CoverImageUrl ?? "",
                        bookPrice = item.Book?.Price ?? 0,
                        quantity = item.Quantity,
                        unitPrice = item.UnitPrice,
                        totalPrice = item.TotalPrice,
                        discountAmount = item.DiscountAmount
                    }).ToList()
                };

                return Ok(new { success = true, data = orderDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error fetching order", error = ex.Message });
            }
        }
    }
}

