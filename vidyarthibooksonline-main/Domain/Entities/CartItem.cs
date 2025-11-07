using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class CartItem : BaseEntities
    {
       
        public int Quantity { get; set; }

        // Relationships
        public int CartId { get; set; }
        public Cart Cart { get; set; }

        public int BookId { get; set; }
        public Book Book { get; set; }
    }
}
