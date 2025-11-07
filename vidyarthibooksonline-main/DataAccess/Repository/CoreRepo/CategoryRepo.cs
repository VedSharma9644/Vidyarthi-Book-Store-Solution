using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.DTOs;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NBitcoin.Secp256k1;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class CategoryRepo : BaseRepo<Category>, ICategoryRepo
    {
        private readonly AppDbContext _context;

        public CategoryRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

       
    }
}

