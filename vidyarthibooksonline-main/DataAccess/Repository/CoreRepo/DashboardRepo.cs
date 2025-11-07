using Dapper;
using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.Data.SqlClient; // or your database provider
using System.Data;

public class DashboardRepo : IDashboardRepo
{
    private readonly IDbConnection _db;
    private readonly AppDbContext _context; // Keep for complex queries if needed

    public DashboardRepo(AppDbContext context, IDbConnection db)
    {
        _context = context;
        _db = db;
    }

    public async Task<AdminDashboardDto> GetAdminDashboard()
    {
        var dashboardData = new AdminDashboardDto();
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var lastMonthStart = monthStart.AddMonths(-1);
        var lastMonthEnd = monthStart.AddDays(-1);
        var sixMonthsAgo = today.AddMonths(-6);
        var adminName = _context.Users.Where(u => u.RoleName ==SD.UserRoles.Admin).FirstOrDefault()?.FirstName ?? "Admin";
        // Summary Metrics (using Dapper)
        var summaryQuery = @"
            SELECT 
                (SELECT COUNT(*) FROM Orders) AS TotalOrders,
                (SELECT ISNULL(SUM(OrderTotal), 0) FROM Orders) AS TotalRevenue,
                (SELECT COUNT(*) FROM Books) AS TotalBooks,
                (SELECT COUNT(*) FROM Members where RoleName != 'Admin') AS TotalCustomers,
                (SELECT COUNT(*) FROM Books WHERE CreatedAt >= @MonthStart) AS NewBooksAdded,
                (SELECT COUNT(*) FROM Members WHERE CreatedAt >= @Today AND RoleName != 'Admin') AS NewCustomersToday,
                (SELECT ISNULL(SUM(OrderTotal), 0) FROM Orders WHERE OrderDate >= @MonthStart) AS CurrentMonthRevenue,
                (SELECT ISNULL(SUM(OrderTotal), 0) FROM Orders WHERE OrderDate >= @LastMonthStart AND OrderDate <= @LastMonthEnd) AS LastMonthRevenue";

        var summary = await _db.QueryFirstAsync<dynamic>(summaryQuery, new
        {
            MonthStart = monthStart,
            Today = today,
            LastMonthStart = lastMonthStart,
            LastMonthEnd = lastMonthEnd
        });

        dashboardData.TotalOrders = summary.TotalOrders;
        dashboardData.TotalRevenue = summary.TotalRevenue;
        dashboardData.TotalBooks = summary.TotalBooks;
        dashboardData.TotalCustomers = summary.TotalCustomers;
        dashboardData.NewBooksAdded = summary.NewBooksAdded;
        dashboardData.NewCustomersToday = summary.NewCustomersToday;
        dashboardData.AdminName = adminName;
        // Calculate percentage changes
        dashboardData.RevenueChangePercentage = summary.LastMonthRevenue > 0 ?
            (summary.CurrentMonthRevenue - summary.LastMonthRevenue) / summary.LastMonthRevenue * 100 : 100;

        // Top Selling Books (last 30 days) - Dapper
        var topBooksQuery = @"
            SELECT TOP 5
                b.Id AS BookId,
                b.Title,
                c.Name AS Category,
                SUM(oi.Quantity) AS SoldCount,
                SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue
            FROM OrderItems oi
            JOIN Books b ON oi.BookId = b.Id
            JOIN Categories c ON b.CategoryId = c.Id
            JOIN Orders o ON oi.OrderId = o.Id
            WHERE o.OrderDate >= @ThirtyDaysAgo
            GROUP BY b.Id, b.Title, c.Name
            ORDER BY SoldCount DESC";

        dashboardData.TopSellingBooks = (await _db.QueryAsync<BookSalesDto>(topBooksQuery, new
        {
            ThirtyDaysAgo = today.AddDays(-30)
        })).ToList();

        // Recent Orders - Dapper
        var recentOrdersQuery = @"
            SELECT TOP 10
                o.Id AS OrderId,
                u.FirstName AS CustomerName,
                o.OrderDate,
                o.OrderTotal AS TotalAmount,
                o.OrderStatus AS Status
            FROM Orders o
            JOIN Members u ON o.UserId = u.Id
            ORDER BY o.OrderDate DESC";

        dashboardData.RecentOrders = (await _db.QueryAsync<RecentOrderDto>(recentOrdersQuery)).ToList();

        // Sales by Category - Dapper
        var salesByCategoryQuery = @"
            SELECT 
                c.Name AS CategoryName,
                SUM(oi.Quantity) AS TotalSold
            FROM OrderItems oi
            JOIN Books b ON oi.BookId = b.Id
            JOIN Categories c ON b.CategoryId = c.Id
            GROUP BY c.Name";

        var salesByCategory = await _db.QueryAsync(salesByCategoryQuery);
        dashboardData.SalesByCategory = salesByCategory
            .ToDictionary(
                row => (string)row.CategoryName,
                row => (int)row.TotalSold
            );

        // Order Status Counts - Dapper
        var orderStatusQuery = @"
            SELECT 
                OrderStatus AS Status,
                COUNT(*) AS Count
            FROM Orders
            GROUP BY OrderStatus";

        var orderStatusCounts = await _db.QueryAsync(orderStatusQuery);
        dashboardData.OrderStatusCounts = orderStatusCounts
            .ToDictionary(
                row => (string)row.Status,
                row => (int)row.Count
            );

        // Monthly Sales (last 6 months) - Dapper
        var monthlySalesQuery = @"
            SELECT 
                YEAR(OrderDate) AS Year,
                MONTH(OrderDate) AS Month,
                SUM(OrderTotal) AS Total
            FROM Orders
            WHERE OrderDate >= @SixMonthsAgo
            GROUP BY YEAR(OrderDate), MONTH(OrderDate)
            ORDER BY Year, Month";

        var monthlySalesData = await _db.QueryAsync(monthlySalesQuery, new
        {
            SixMonthsAgo = sixMonthsAgo
        });

        dashboardData.MonthlySales = monthlySalesData
            .Select(row => new
            {
                Key = new DateTime((int)row.Year, (int)row.Month, 1).ToString("MMM yyyy"),
                Value = (decimal)row.Total
            })
            .ToDictionary(x => x.Key, x => x.Value);

        return dashboardData;
    }
}