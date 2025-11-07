using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.ShippingProvider.Shiprocket
{
    public class ServiceabilityRequest
    {
        public int pickup_postcode { get; set; }
        public int delivery_postcode { get; set; }
        public int order_id { get; set; }
        public bool cod { get; set; }
    }
}
