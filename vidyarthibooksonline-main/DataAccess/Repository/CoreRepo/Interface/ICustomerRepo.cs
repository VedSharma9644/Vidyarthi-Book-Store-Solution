using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface ICustomerRepo : IBaseRepo<AppUser>
    {
        Task SaveOtpAsync(string email, string otp);

        Task<List<AppUser>> GetAllCustomers();
    }
}
