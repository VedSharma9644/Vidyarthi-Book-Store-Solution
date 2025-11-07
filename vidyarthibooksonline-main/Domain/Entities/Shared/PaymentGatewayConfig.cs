using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Shared
{
    public class PaymentGatewayConfig : BaseEntities
    {
        public string? UserId { get; set; } // null or empty for global (admin-configured), otherwise vendor-specific
        public string? GatewayName { get; set; } // e.g., Razorpay, PhonePe
        public string? ApiKey { get; set; }
        public string? SecretKey { get; set; }
        public bool IsActive { get; set; }

        // navigation properties
        public AppUser? AppUser { get; set; }
    }
}
