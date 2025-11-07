using DataAccess.Data;
using Domain.DTOs.Customer;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace WebUi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        public BooksController(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet("get-all-books")]
        public async Task<IActionResult> GetAllBooks(
    int offset = 0,
    int limit = 8,
    string? category = null,
    string? price = null,
    string? sort = null)
        {
            const string cacheKey = "all_books";
            List<Book>? books;

            if (!_cache.TryGetValue(cacheKey, out books))
            {
                books = await _context.Books
                    .Include(b => b.Category)
                    .ToListAsync();

                _cache.Set(cacheKey, books, TimeSpan.FromMinutes(15));
            }

            var query = books!.AsQueryable();

            if (!string.IsNullOrEmpty(category))
                query = query.Where(b => b.Category != null && b.Category.Name == category);

            if (!string.IsNullOrEmpty(price))
            {
                query = price switch
                {
                    "under-50" => query.Where(b => b.Price < 50),
                    "50-100" => query.Where(b => b.Price >= 50 && b.Price <= 100),
                    "100-plus" => query.Where(b => b.Price > 100),
                    _ => query
                };
            }

            query = sort switch
            {
                "price-asc" => query.OrderBy(b => b.Price),
                "price-desc" => query.OrderByDescending(b => b.Price),
                "newest" => query.OrderByDescending(b => b.PublicationDate),
                _ => query
            };

            var pagedBooks = query
                .Skip(offset)
                .Take(limit)
                .Select(b => new BookListDto
                {
                    Id = b.Id,
                    Title = b.Title!,
                    Price = b.Price,
                    CategoryName = b.Category!.Name
                })
                .ToList();

            return Ok(new { data = pagedBooks });
        }


        [HttpGet("get-all-generalbooks")]
        public async Task<IActionResult> GetAllGeneralBooks()
        {
            const string cacheKey = "general_books";

            if (!_cache.TryGetValue(cacheKey, out List<Book>? books))
            {
                books = await _context.Books
                    .Where(b => b.Title!.Contains("General"))
                    .ToListAsync();

                // Set cache with 15 minutes absolute expiration
                _cache.Set(cacheKey, books, TimeSpan.FromMinutes(15));
            }

            return Ok(books);
        }
    }
}
