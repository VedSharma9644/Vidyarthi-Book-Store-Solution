using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class CartItemRepo : BaseRepo<CartItem>, ICartItemRepo
    {
        private readonly AppDbContext _context;

        public CartItemRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<CartItem?> GetCartItemWithBookAsync(int cartItemId)
        {
            return await _context.CartItems
                .Include(ci => ci.Book)
                .FirstOrDefaultAsync(ci => ci.Id == cartItemId);
        }

        public async Task UpdateQuantityAsync(int cartItemId, int newQuantity)
        {
            var cartItem = await _context.CartItems.FindAsync(cartItemId);
            if (cartItem != null)
            {
                cartItem.Quantity = newQuantity;
                _context.CartItems.Update(cartItem);
                await _context.SaveChangesAsync();
            }
        }
    }
}