using Domain.DTOs.PaymentGateway;
using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Services.PyamentService.Interface
{
    public interface IRazorpayService
    {
        Task<CreateOrderDtos> CreateOrder(CreateOrderDtos model);
        Task<PaymentSuccessDto> VerifyPayment(PaymentSuccessDto model);
    }
}
