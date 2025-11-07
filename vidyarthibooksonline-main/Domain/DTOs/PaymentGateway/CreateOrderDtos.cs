using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.PaymentGateway
{
    public class CreateOrderDtos
    {
        public string orderId {  get; set; }
        public decimal amount { get; set; }
        public string currency { get; set; }
        public string receipt { get; set; }
        public string status { get; set; }
        public DateTime createdAt { get; set; }
    }
}
