using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class AdminDashboardDto
    {
        // Summary Metrics
        public string? AdminName { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalBooks { get; set; }
        public int TotalCustomers { get; set; }
        public int NewBooksAdded { get; set; }
        public int NewCustomersToday { get; set; }
        public decimal RevenueChangePercentage { get; set; }
        public int OrderChangePercentage { get; set; }

        // Top Selling Books
        public List<BookSalesDto> TopSellingBooks { get; set; } = new();

        // Recent Orders
        public List<RecentOrderDto> RecentOrders { get; set; } = new();

        // Chart Data
        public Dictionary<string, int> SalesByCategory { get; set; } = new();
        public Dictionary<string, int> OrderStatusCounts { get; set; } = new();
        public Dictionary<string, decimal> MonthlySales { get; set; } = new();
    }
}
