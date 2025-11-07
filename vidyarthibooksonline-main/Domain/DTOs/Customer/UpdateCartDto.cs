using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class UpdateCartDto
    {
        public int ItemId { get; set; }
        public int Quantity { get; set; }
    }
}
