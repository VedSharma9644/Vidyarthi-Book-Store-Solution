using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.PaymentGateway
{
    public class PaymentSuccessDto
    {
        public string razorpayPaymentId { get; set; }
        public string razorpayOrderId { get; set; }
        public string razorpaySignature { get; set; }
    }
}
