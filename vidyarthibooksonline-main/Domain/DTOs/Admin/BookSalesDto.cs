using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class BookSalesDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int SoldCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public string Category { get; set; } = string.Empty;
    }
}
