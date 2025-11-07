using DataAccess.Data;
using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Customer;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace WebUi.Areas.Customer.Controllers
{
    public class SchoolZoneController : BaseCustomerController
    {
        private readonly AppDbContext _context;
        public SchoolZoneController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, AppDbContext context = null!) : base(unitOfWork, userManager)
        {
            _context = context;
        }


        [Route("school-zone.html")]
        public IActionResult Index()
        {
            return View();
        }

        [Route("school-langage-books.html")]
        public async Task<IActionResult> GetBooksByCategory(int categoryId)
        {
            var booksWithDetails = await _context.Books
                    .Where(x => x.CategoryId == categoryId)
                    .Include(b => b.Category) // Include Category
                        .ThenInclude(c => c!.Grade) // Then include Grade from Category
                        .ThenInclude(g => g!.School) // Then include School from Grade
                    .ToListAsync();

            // You might need to adjust your DTO mapping to include these new relationships
            var bookDtos = DtoToEntityMapper.MapToDtoList(booksWithDetails);
            
            return View(bookDtos);
        }

        
        [Route("school-search-result.html")]
        public async Task<IActionResult> SchoolSearchResult(int id)
        {
            var data = await _context.Schools
                 .Include(g =>g.Grades)
                 .ThenInclude(c =>c.Categories)
                 .FirstOrDefaultAsync(x => x.Id == id);
            var dto = new SchoolDetailsDto
            {
                Id = data!.Id,
                LogoSchool = data.SchoolLogo!,
                SchoolName = data.SchoolLogo!,
                GetAllGrade = data.Grades.ToList()
            };
            return View(dto);
        }
    }
}
