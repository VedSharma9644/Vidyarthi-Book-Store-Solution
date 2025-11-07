using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.DTOs.Customer;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;


namespace DataAccess.Repository.CoreRepo
{
    public class SchoolRepo : BaseRepo<School>, ISchoolRepo
    {
        private readonly AppDbContext _db;

        public SchoolRepo(AppDbContext db) : base(db)
        {
            _db = db;
        }

        public async Task<List<SchoolSearchDto>> GetSchools(string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return new List<SchoolSearchDto>();
            }

            var query = _db.Schools
                .Where(s => s.IsActive)
                .AsQueryable();

            // Search by name or branch name (case insensitive)
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(searchLower) ||
                (s.BranchName != null && s.BranchName.ToLower().Contains(searchLower)) ||
                s.Code.ToLower().Contains(searchLower));

            var results = await query
                .OrderBy(s => s.Name)
                .ThenBy(s => s.BranchName)
                .Take(20) // Limit results for performance
                .Select(s => new SchoolSearchDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    BranchName = s.BranchName
                })
                .ToListAsync();

            return results;
        }
    }
}