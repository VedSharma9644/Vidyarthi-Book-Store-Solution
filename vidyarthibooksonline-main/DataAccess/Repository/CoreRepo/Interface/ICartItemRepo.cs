using DataAccess.Repository.Interface;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface ICartItemRepo : IBaseRepo<CartItem>
    {
        Task<CartItem?> GetCartItemWithBookAsync(int cartItemId);
        Task UpdateQuantityAsync(int cartItemId, int newQuantity);
    }
}
