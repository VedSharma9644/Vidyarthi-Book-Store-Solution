using DataAccess.Data;
using DataAccess.Repository.Interface;
using DataAccess.Services.PyamentService;
using DataAccess.Services.PyamentService.Interface;
using Domain.DTOs.PaymentGateway;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NBitcoin.Secp256k1;
using System.Threading.Tasks;

namespace WebUi.Areas.Customer.Controllers
{
    public class PaymentController : BaseCustomerController
    {
        private readonly AppDbContext _context;
        private readonly IRazorpayService _razorpayService;
        private readonly ILogger<HomeController> _logger;
        public PaymentController(AppDbContext context, IRazorpayService razorpayService, IUnitOfWork unitOfWork, UserManager<AppUser> userManager, IMemoryCache cache = null!, ILogger<HomeController> logger = null) : base(unitOfWork, userManager, cache)
        {
            _context = context;
            _razorpayService = razorpayService;
            _logger = logger;
        }

        [Route("make-order-payment.html")]
        public async Task<IActionResult> MakeOrderPayment(decimal orderTotal, string orderId)
        {
            var apiConfig = await _unitOfWork.Carts.GetPaymentApiSettings();
            var dto = new PaymentDto
            {
                OrderAmount = orderTotal,
                ApiClientKey = apiConfig!.ApiKey ?? null!,
                OrderReceipt = orderId
            };
            return View(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDtos model)
        {
            if (model.amount <= 0)
            {
                return BadRequest("Invalid amount");
            }

            var receiptNumber = $"order_rcptid_{RandomString(10)}";

            var orderDto = new CreateOrderDtos
            {
                amount = model.amount, // Amount in paise is received here
                currency = "INR",
                receipt = model.receipt ?? receiptNumber,
            };

            var order = await _razorpayService.CreateOrder(orderDto);

            // update payment orderId in database
            await UpdatePaymentOrderId(order.receipt, order.orderId);

            if (order == null || string.IsNullOrEmpty(order.orderId))
            {
                return Json(new { error = true, message = "Error creating Razorpay order." });
            }

            return Json(order); // Returning order data as JSON
        }

        [HttpPost]
        public async Task<IActionResult> PaymentSuccess([FromBody] PaymentSuccessDto paymentData)
        {
            // Process the payment success data
            _logger.LogInformation($"Payment Success: {paymentData.razorpayPaymentId}");
            var res = await _razorpayService.VerifyPayment(paymentData);

            if (res == null)
            {
                _logger.LogError("Payment signature verification failed");
                return BadRequest("Payment signature verification failed");
            }

            // Redirect to a success page or process further
            return RedirectToAction("Success", new { orderId = paymentData.razorpayOrderId, paymentId = paymentData.razorpayPaymentId });
        }


        private string RandomString(int length)
        {
            var random = new Random();
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Repeat(chars, length).Select(s => s[random.Next(s.Length)]).ToArray());
        }

        [Route("order-completed.html")]
        public async Task<IActionResult> OrderCompleted(string orderId, string paymentId)
        {
            ViewBag.OrderId = orderId;
            ViewBag.PaymentId = paymentId;
            // update payment status in database
            await UpdatePaymentStatus(orderId, paymentId);
            return View();
        }

        //update payment status
        private async Task UpdatePaymentStatus(string orderId, string paymentId)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.PaymentOrderId == orderId && o.PaymentStatus== SD.PaymentStatus.Pending);
            if (order != null)
            {
                order.PaymentStatus = SD.PaymentStatus.Paid;
                order.PaymentTransactionId = paymentId;
                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
            }
        }

        // update payment orderId 
        private async Task UpdatePaymentOrderId(string paymentReceiptId, string orderId)
        {
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.OrderNumber == paymentReceiptId && o.PaymentStatus == SD.PaymentStatus.Pending);
            if (order != null)
            {
                order.PaymentStatus = SD.PaymentStatus.Pending;
                order.PaymentOrderId = orderId;
                _context.Orders.Update(order);
                await _context.SaveChangesAsync();
            }
        }
    }
}
