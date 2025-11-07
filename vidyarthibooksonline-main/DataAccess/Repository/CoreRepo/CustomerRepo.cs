using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.DTOs;
using Domain.Entities;
using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class CustomerRepo : BaseRepo<AppUser>, ICustomerRepo
    {
        private readonly AppDbContext _db;

        public CustomerRepo(AppDbContext db) : base(db)
        {
            _db = db;
        }

        public Task<List<AppUser>> GetAllCustomers()
        {
            var data = _db.Users
                .Where(x => x.RoleName != SD.UserRoles.Admin)
                .AsNoTracking()
                .ToListAsync();
                return data;
        }

        public async Task SaveOtpAsync(string email, string otp)
        {
            var exist = await _db.MembersOtps.FirstOrDefaultAsync(x => x.MobileNumber == email);
            if (exist != null)
            {
                exist.OTP = otp;
                exist.ExpiryDateTime = DateTime.Now.AddMinutes(5);
                _db.MembersOtps.Update(exist);
                await _db.SaveChangesAsync();
            }
            else
            {
                var model = new MembersOtp
                {
                    MobileNumber = email,
                    OTP = otp
                };
                _db.MembersOtps.Add(model);
                await _db.SaveChangesAsync();
            }
        }
    }
}
