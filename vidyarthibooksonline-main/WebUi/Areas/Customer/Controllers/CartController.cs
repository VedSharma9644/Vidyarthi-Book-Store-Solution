using DataAccess.Data;
using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Customer;
using Domain.DTOs.PaymentGateway;
using Domain.Entities;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace WebUi.Areas.Customer.Controllers
{
    [Authorize]
    public class CartController : BaseCustomerController
    {
        private readonly AppDbContext _context;
        private const decimal ShippingIncrement = 250m;
        public CartController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, AppDbContext context = null!) : base(unitOfWork, userManager)
        {
            _context = context;
        }

        [Route("shopping-cart.html")]
        public IActionResult Index()
        {
            return View();
        }

        [Route("cart-checkout.html")]
        public async Task<IActionResult> CartCheckout(int shipping = 250)
        {
            var loggedInUser = await _userManager.GetUserAsync(User);
            if (loggedInUser == null)
            {
                return Challenge(); // Or redirect to login
            }

            // Find cart with items and their books
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Book)
                .FirstOrDefaultAsync(c => c.UserId == loggedInUser.Id);

            // Handle case where cart doesn't exist or is empty
            if (cart == null || !cart.CartItems.Any())
            {
                return View(new OrderDto { OrderTotal = 0 });
            }

            var cartTotal = cart.CartItems.Sum(ci => ci.Book.Price * ci.Quantity);
            var standardFee = cart.ShippingCost; // standard fee for shipping and other charges
            var orderTotal = cartTotal + standardFee; 
            ViewBag.ShippingFee = standardFee;
            ViewBag.SubTotal = cartTotal;

            var oderDto = new OrderDto
            {
                OrderTotal = orderTotal,
                ShippingAddress = loggedInUser!.Address ?? string.Empty,
                ShippingName = loggedInUser.FirstName + " " + loggedInUser.LastName ?? string.Empty,
                ShippingPhone = loggedInUser!.PhoneNumber ?? string.Empty,
                ShippingCity = loggedInUser!.City ?? string.Empty,
                ShippingState = loggedInUser!.State ?? string.Empty,
                ShippingPostalCode = loggedInUser!.PostalCode ?? string.Empty,
            };
            return View(oderDto);
        }

        

        [HttpPost("add-to-cart-multiple")]
        
        public async Task<IActionResult> AddMultiple(List<int> selectedBookIds, List<int> quantities, bool redirectToCheckout)
        {
            if (selectedBookIds == null || selectedBookIds.Count == 0)
                 return Json(new { success = false, message = "No books selected." });

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
                {
                    Response.StatusCode = 401;
                    return Json(new
                    {
                        success = false,
                        requiresLogin = true,
                        redirectUrl = Url.Action("Login", "Account", new { area = "Auth" })
                    });
                }
                return Challenge();
            }
            // 1️  Load (or create) the cart -----------------------------------
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == user.Id);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = user.Id,
                    ShippingCost = 0m, //initialize shipping cost
                    CartItems = new List<CartItem>()
                };

                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(); // Save here to generate CartId
            }

            for (int i = 0; i < selectedBookIds.Count; i++)
            {
                var bookId = selectedBookIds[i];
                var qty = quantities[i];

                var existingItem = cart.CartItems.FirstOrDefault(ci => ci.BookId == bookId);
                if (existingItem != null)
                {
                    existingItem.Quantity += qty;
                }
                else
                {
                    _context.CartItems.Add(new CartItem
                    {
                        CartId = cart.Id, // Set foreign key explicitly
                        BookId = bookId,
                        Quantity = qty
                    });
                }
            }
            
            //   - one flat increment per *AddMultiple* call
            cart.ShippingCost += ShippingIncrement;
            await _unitOfWork.SaveAsync();

            return Json(new { success = true, redirectUrl = redirectToCheckout ? Url.Action("CartCheckout") : Url.Action("Index") });
        }


        //place order 
        [HttpPost]
        public async Task<IActionResult> PlaceOrder(OrderDto model)
        {
            var loggedInUser = await _userManager.GetUserAsync(User);
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid order details." });
            }

            // 1. Map DTO to Order
            var order = DtoToEntityMapper.MapToEntity(model);
            order.UserId = loggedInUser!.Id;
            order.ShippingEmail = model.Email;
            order.AlternetPhone = model.AlternatePhone;
            order.OrderStatus = "Pending";
            order.OrderDate = DateTime.UtcNow.AddHours(5).AddMinutes(30);
            order.PaymentStatus = "Pending";
            order.OrderTotal = model.OrderTotal;
            order.FinalAmount = model.OrderTotal - model.DiscountAmount;
            // 2. Find User Cart and CartItems
            var cart = await _context.Carts
                .Where(u => u.UserId == loggedInUser.Id)
                .FirstOrDefaultAsync();

            if (cart == null)
            {
                return Json(new { success = false, message = "Cart not found." });
            }

            var cartItems = await _context.CartItems
                .Include(ci => ci.Book)
                .Where(ci => ci.CartId == cart.Id)
                .ToListAsync();

            if (!cartItems.Any())
            {
                return Json(new { success = false, message = "Your cart is empty." });
            }

            // 3. Map CartItems to OrderItems
            var orderItems = cartItems.Select(ci => new OrderItem
            {
                BookId = ci.BookId,
                Quantity = ci.Quantity,
                UnitPrice = ci.Book.Price
            }).ToList();

            // 4. Save Order and OrderItems
            var createdOrder = await _unitOfWork.Orders.CreateOrderAsync(order, orderItems);

            // 5. Clear Cart
            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();

            // 6. Return success message and redirect URL
            return Json(new { success = true, message = "Order placed successfully.", redirectUrl = Url.Action("MakeOrderPayment","Payment", new { orderTotal = createdOrder.OrderTotal, orderId = createdOrder.OrderNumber }) });
        }

    }
}
