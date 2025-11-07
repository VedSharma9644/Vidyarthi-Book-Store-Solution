using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class CouponDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Coupon code is required.")]
        [StringLength(20, ErrorMessage = "Code cannot exceed 20 characters.")]
        public string Code { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters.")]
        public string Description { get; set; }

        [Range(0, 100000, ErrorMessage = "Discount amount must be between 0 and 100000.")]
        public decimal DiscountAmount { get; set; }

        [Required(ErrorMessage = "Discount type is required.")]
        [RegularExpression("^(Percentage|FixedAmount)$", ErrorMessage = "Discount type must be 'Percentage' or 'FixedAmount'.")]
        public string DiscountType { get; set; }

        [Required(ErrorMessage = "Start date is required.")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End date is required.")]
        public DateTime EndDate { get; set; }

        [Range(1, 10000, ErrorMessage = "Usage limit must be between 1 and 10000.")]
        public int UsageLimit { get; set; }

        [Range(0, 10000, ErrorMessage = "Used count must be between 0 and 10000.")]
        public int UsedCount { get; set; }

        public bool IsActive { get; set; }

        [Range(0, 100000, ErrorMessage = "Minimum purchase amount must be between 0 and 100000.")]
        public decimal? MinimumPurchaseAmount { get; set; }
    }
}
