using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Coupon : BaseEntities
    {
        public string Code { get; set; }
        public string Description { get; set; }
        public decimal DiscountAmount { get; set; }
        public string DiscountType { get; set; } // "Percentage" or "FixedAmount"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
        public decimal? MinimumPurchaseAmount { get; set; }

        // Relationships
        public ICollection<Order> Orders { get; set; }
    }
}
