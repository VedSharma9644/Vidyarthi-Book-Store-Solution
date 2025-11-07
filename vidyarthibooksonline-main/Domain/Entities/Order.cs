using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Order : BaseEntities
    {
        public string? OrderNumber { get; set; }
        public DateTime OrderDate { get; set; }=DateTime.UtcNow.AddHours(5).AddMinutes(30);
        public decimal OrderTotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ShippingAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string? OrderStatus { get; set; } // Pending, Processing, Completed, Cancelled
        public string? PaymentStatus { get; set; } // Pending, Paid, Refunded
        public string? PaymentTransactionId { get; set; } // Payment gateway transaction ID
        public string? PaymentOrderId { get; set; } // Payment gateway order ID
        public string? PaymentMethod { get; set; }

        // Shipping information
        public string? ShippingName { get; set; }
        public string? ShippingPhone { get; set; }
        public string? AlternetPhone { get; set; }
        public string? ShippingEmail { get; set; }
        public string? ShippingAddress { get; set; }
        public string? ShippingCity { get; set; }
        public string? ShippingState { get; set; }
        public string? ShippingPostalCode { get; set; }
        public string? ShippingCountry { get; set; }

        // Relationships
        public string? UserId { get; set; }
        public AppUser? User { get; set; }

        public int? CouponId { get; set; }
        public Coupon? Coupon { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
