using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Shared
{
    public class ShippingProviderConfig : BaseEntities
    {
        public string? UserId { get; set; } // 0 for admin, otherwise vendor-specific
        public string? ProviderName { get; set; } // e.g., Shiprocket, DHL, FedEx
        public string? ApiKey { get; set; }
        public string? SecretKey { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastUpdated { get; set; }

        //navigation properties
        public AppUser? AppUser { get; set; }

    }
}
