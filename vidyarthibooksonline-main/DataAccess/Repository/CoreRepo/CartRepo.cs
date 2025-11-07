using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class CartRepo : BaseRepo<Cart>, ICartRepo
    {
        private readonly AppDbContext _context;

        public CartRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Cart?> GetCartWithItemsAsync(string userId)
        {
            return await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Book)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<int> GetCartItemCountAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            return cart?.CartItems?.Sum(ci => ci.Quantity) ?? 0;
        }

        public async Task<decimal> CalculateCartTotalAsync(string userId)
        {
            var cart = await GetCartWithItemsAsync(userId);
            if (cart == null) return 0;

            return cart.CartItems.Sum(ci =>
                (ci.Book.DiscountPrice ?? ci.Book.Price) * ci.Quantity);
        }

        public async Task ClearCartAsync(string userId)
        {
            var cart = await GetCartWithItemsAsync(userId);
            if (cart != null)
            {
                _context.CartItems.RemoveRange(cart.CartItems);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<PaymentGatewayConfig> GetPaymentApiSettings()
        {
            var apiConfig = await _context.PaymentGatewayConfigs
             .Where(x => x.IsActive == true && x.GatewayName == SD.PaymentGateways.Razorpay)
             .FirstOrDefaultAsync();
            if (apiConfig == null) return new PaymentGatewayConfig();
            return apiConfig!;
        }
    }
}