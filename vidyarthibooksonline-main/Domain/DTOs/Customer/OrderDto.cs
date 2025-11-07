using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class OrderDto
    {
        public int Id { get; set; }

        public string? OrderNumber { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Range(0, double.MaxValue)]
        public decimal OrderTotal { get; set; }

        [Range(0, double.MaxValue)]
        public decimal DiscountAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal TaxAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal ShippingAmount { get; set; }

        [Range(0, double.MaxValue)]
        public decimal FinalAmount { get; set; }

       
        public string? OrderStatus { get; set; }

     
        public string? PaymentStatus { get; set; }

        [Required(ErrorMessage = "Please select a payment method.")]
        public string? PaymentMethod { get; set; }

        // Shipping Details
        [Required(ErrorMessage = "Shipping name is required.")]
        [StringLength(100)]
        public string? ShippingName { get; set; }

        [Required(ErrorMessage = "Shipping phone is required.")]
        [Phone(ErrorMessage = "Invalid phone number.")]
        public string? ShippingPhone { get; set; }

        [Required(ErrorMessage = "Shipping address is required.")]
        [StringLength(200)]
        public string? ShippingAddress { get; set; }

        [Required(ErrorMessage = "City is required.")]
        public string? ShippingCity { get; set; }
        [Required(ErrorMessage = "State is required.")]

        public string? ShippingState { get; set; }

        [Required(ErrorMessage = "Postal code is required.")]
        public string? ShippingPostalCode { get; set; }

        public string? ShippingCountry { get; set; } = "India";

        [Required(ErrorMessage = "Alternate phone number is required.")]
        public string? AlternatePhone { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        public string? Email { get; set; }

        public string? UserId { get; set; }

        public int? CouponId { get; set; }

        public List<OrderItemDto>? OrderItems { get; set; } = new();
    }
}
