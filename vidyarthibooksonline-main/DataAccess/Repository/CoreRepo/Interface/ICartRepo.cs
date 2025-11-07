using DataAccess.Repository.Interface;
using Domain.Entities;
using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface ICartRepo : IBaseRepo<Cart>
    {
        Task<Cart?> GetCartWithItemsAsync(string userId);
        Task<int> GetCartItemCountAsync(string userId);
        Task<decimal> CalculateCartTotalAsync(string userId);
        Task ClearCartAsync(string userId);

        Task<PaymentGatewayConfig> GetPaymentApiSettings();
    }
}
