using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface IOrderRepo : IBaseRepo<Order>
    {
        // Order retrieval
        Task<IEnumerable<Order>> GetOrdersByUserAsync(string userId);
        Task<IEnumerable<Order>> GetAllOrder();
        Task<Order?> GetOrderWithItemsAsync(int orderId);
        Task<IEnumerable<Order>> GetPendingOrdersAsync();
        Task<IEnumerable<Order>> GetCompletedOrdersAsync();
        Task<IEnumerable<Order>> GetOrdersByStatusAsync(string status);

        // Order management
        Task<Order> CreateOrderAsync(Order order, IEnumerable<OrderItem> items);
        Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus);
        Task<bool> UpdatePaymentStatusAsync(int orderId, string newStatus);

        // Analytics

        Task CreateShiprocketOrderAsync(Order shiprocketOrder);
        Task<decimal> GetTotalSalesAsync();
        Task<int> GetOrderCountByStatusAsync(string status);
    }
}