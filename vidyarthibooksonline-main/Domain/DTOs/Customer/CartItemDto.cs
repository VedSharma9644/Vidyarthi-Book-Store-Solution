using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class CartItemDto
    {
        public int Id { get; set; }
        public int Quantity { get; set; }
        public int CartId { get; set; }
        public int BookId { get; set; }
    }
}
