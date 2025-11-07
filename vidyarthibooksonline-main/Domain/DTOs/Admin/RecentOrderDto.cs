using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class RecentOrderDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string StatusColor => Status switch
        {
            "Completed" => "success",
            "Processing" => "info",
            "Shipped" => "warning",
            "Cancelled" => "danger",
            _ => "secondary"
        };
    }
}
