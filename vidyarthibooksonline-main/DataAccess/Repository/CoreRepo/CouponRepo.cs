using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class CouponRepo : BaseRepo<Coupon>, ICouponRepo
    {
        private readonly AppDbContext _context;

        public CouponRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

        
    }
}