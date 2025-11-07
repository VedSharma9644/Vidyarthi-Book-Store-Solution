using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.PaymentGateway
{
    public class PaymentDto
    {
        public decimal OrderAmount { get; set; }
        public string ApiClientKey { get; set; }
        public string OrderReceipt { get; set; }
    }
}
