using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.DTOs.Customer;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Threading.Tasks;

namespace WebUi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SchoolController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMemoryCache _cache;
        private readonly AppDbContext _context;
        public SchoolController(IUnitOfWork unitOfWork, IMemoryCache cache = null!, AppDbContext context = null!)
        {
            _unitOfWork = unitOfWork;
            _cache = cache;
            _context = context;
        }

        /// <summary>
        /// Get all active schools
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSchools()
        {
            const string cacheKey = "all_active_schools";

            if (!_cache.TryGetValue(cacheKey, out IEnumerable<School>? schools))
            {
                schools = await _unitOfWork.Schools.GetAllAsync();

                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(30));

                _cache.Set(cacheKey, schools, cacheEntryOptions);
            }

            
            return Ok(schools);
        }

        /// <summary>
        /// Search schools by name, branch or code
        /// </summary>
        /// <param name="search">Search term</param>
        [HttpGet("search")]
        public async Task<IActionResult> SearchSchools([FromQuery] string? search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                var allResults = await _unitOfWork.Schools.GetAllAsync();
                return Ok(allResults);
            }

            if (search.Length > 3)
            {
                var filteredResults = await _unitOfWork.Schools.GetSchools(search);
                return Ok(filteredResults);
            }

            // Optional fallback for short search terms
            var results = await _unitOfWork.Schools.GetAllAsync();
            return Ok(results);
        }

        /// <summary>
        /// Get school by ID
        /// </summary>
        /// <param name="id">School ID</param>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSchool(int id)
        {
            var school = await _unitOfWork.Schools.GetFirstOrDefaultAsync(s => s.Id == id);
            if (school == null)
            {
                return NotFound();
            }
            return Ok(school);
        }

        /// <summary>
        /// Create a new school
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateSchool([FromBody] School school)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _unitOfWork.Schools.AddAsync(school);
            await _unitOfWork.SaveAsync();
            _cache.Remove("all_active_schools");
            return CreatedAtAction(nameof(GetSchool), new { id = school.Id }, school);
        }

        /// <summary>
        /// Update existing school
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSchool(int id, [FromBody] School school)
        {
            if (id != school.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await  _unitOfWork.Schools.UpdateAsync(school);
            await _unitOfWork.SaveAsync();
            _cache.Remove("all_active_schools");
            return NoContent();
        }

        /// <summary>
        /// Delete a school (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchool(int id)
        {
            var school = await _unitOfWork.Schools.GetFirstOrDefaultAsync(s => s.Id == id);
            if (school == null)
            {
                return NotFound();
            }

            school.IsActive = false; // Soft delete
            await _unitOfWork.Schools.UpdateAsync(school);
            await _unitOfWork.SaveAsync();
            _cache.Remove("all_active_schools");
            return NoContent();
        }

        [HttpGet("validate-code")]
        public async Task<IActionResult> ValidateSchoolCode(int id, string code)
        {
            var school = await _context.Schools.FindAsync(id);
            if (school == null || school.Code != code)
                return Ok(new { isValid = false });

            return Ok(new { isValid = true });
        }

    }
}