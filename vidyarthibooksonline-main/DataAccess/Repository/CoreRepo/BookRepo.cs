using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;


namespace DataAccess.Repository.CoreRepo
{
    public class BookRepo : BaseRepo<Book>, IBookRepo
    {
        private readonly AppDbContext _context;

        public BookRepo(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<Book>> GetAllFiterBooks(string filter)
        {
            var books = await _context.Books
                .Where(b => b.Title!.Contains(filter))
                .ToListAsync();
             return books;
        }

        public async Task<List<Book>> GetBestSellerBooks(int count)
        {
            var data = await _context.Books.Take(count).ToListAsync();
            return data;
        }
    }
}
