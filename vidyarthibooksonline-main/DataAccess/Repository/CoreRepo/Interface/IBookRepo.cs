using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface IBookRepo : IBaseRepo<Book>
    {
        Task<List<Book>> GetBestSellerBooks(int count);
        Task<List<Book>> GetAllFiterBooks(string filter);
    }
}
