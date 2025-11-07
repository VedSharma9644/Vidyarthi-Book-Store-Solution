using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class CartDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public decimal ShippingCost { get; set; }
        public List<CartItemDto> CartItems { get; set; } = new();
    }
}
