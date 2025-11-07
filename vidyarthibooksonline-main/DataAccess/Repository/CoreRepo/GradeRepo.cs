using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class GradeRepo : BaseRepo<Grade>, IGradeRepo
    {
        private readonly AppDbContext _context;

        public GradeRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

      
    }
}