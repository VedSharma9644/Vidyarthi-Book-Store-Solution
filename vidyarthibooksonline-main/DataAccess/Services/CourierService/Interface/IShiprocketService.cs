using Domain.DTOs.ShippingProvider.Shiprocket;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Services.CourierService.Interface
{
    public interface IShiprocketService
    {
        Task<string> GetAuthToken();
        Task<string> CheckServiceability(ServiceabilityRequest model);
        Task<string> CreateOrder(OrderRequest model);
    }
}
