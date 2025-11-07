using DataAccess.Data;
using Domain.DTOs.Customer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace WebUi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("getcart")]
        public IActionResult GetCart()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var cart = _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Book)
                .FirstOrDefault(c => c.UserId == userId);

            if (cart == null)
            {
                // Return empty cart structure if no cart exists
                return Ok(new
                {
                    Items = new List<object>(),
                    SubTotal = 0,
                    Shipping = 0m       // <-- always send shipping, even if zero
                });
            }

            var cartDto = new
            {
                Items = cart.CartItems.Select(ci => new
                {
                    ci.Id,
                    ProductId = ci.Book.Id,
                    ci.Book.Title,
                    ci.Book.CoverImageUrl,
                    ci.Quantity,
                    ci.Book.Price
                }),
                
                SubTotal = cart.CartItems.Sum(ci => ci.Quantity * ci.Book.Price),
                Shipping = cart.ShippingCost          // <-- straight from DB
            };

            return Ok(cartDto);
        }

        [HttpPost("update")]
        public IActionResult UpdateCartItemQuantity([FromBody] UpdateCartDto dto)
        {
            var item = _context.CartItems.FirstOrDefault(ci => ci.Id == dto.ItemId);
            if (item == null) return NotFound();

            item.Quantity = dto.Quantity;
            _context.SaveChanges();

            return Ok(new { message = "Quantity updated successfully" });
        }

        [HttpDelete("{itemId}")]
        public IActionResult RemoveCartItem(int itemId)
        {
            var item = _context.CartItems.FirstOrDefault(ci => ci.Id == itemId);
            if (item == null) return NotFound();

            _context.CartItems.Remove(item);
            _context.SaveChanges();

            return Ok(new { message = "Item removed successfully" });
        }

        [HttpGet("count")]
        public IActionResult GetCartCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var count = _context.Carts
                .Where(c => c.UserId == userId)
                .SelectMany(c => c.CartItems)
                .Sum(ci => ci.Quantity);

            return Ok(new { success = true, count = count });
        }

        [HttpPost("clear")]
        public async Task<IActionResult> ClearCart()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart != null)
            {
                _context.Carts.Remove(cart);
                _context.CartItems.RemoveRange(cart.CartItems);
                await _context.SaveChangesAsync();
            }
            return Ok(new { success = true });
        }

    }
}
