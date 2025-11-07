using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.DTOs;
using MailKit.Search;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1;
using System.Linq.Expressions;

namespace DataAccess.Repository
{
    public class BaseRepo<T> : IBaseRepo<T> where T : class
    {
        private readonly AppDbContext _db;
        internal DbSet<T> dbSet;
        public BaseRepo(AppDbContext db)
        {
            _db = db;
            this.dbSet = _db.Set<T>();
        }
        public async Task AddAsync(T entity)
        {
            await dbSet.AddAsync(entity);
            await _db.SaveChangesAsync();
        }

        public async Task UpdateAsync(T entity)
        {
            dbSet.Attach(entity);  // Attach the entity to the context if it's not tracked
            _db.Entry(entity).State = EntityState.Modified;  // Mark it as modified
            await _db.SaveChangesAsync();  // Save the changes to the database
        }

        public async Task<IEnumerable<T>> GetAllAsync(
                    Expression<Func<T, bool>>? filter = null,
                    Func<IQueryable<T>, IQueryable<T>>? include = null,
                     Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
        {
            IQueryable<T> query = _db.Set<T>();

            // Apply the include condition if provided
            if (include != null)
            {
                query = include(query);
            }

            // Apply the filter condition if provided
            if (filter != null)
            {
                query = query.Where(filter);
            }

            // Apply the orderBy if provided
            if (orderBy != null)
            {
                query = orderBy(query);
            }

            return await query.ToListAsync();
        }


        public async Task<T> GetFirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
        {
            IQueryable<T> query = dbSet;
            query = query.Where(predicate);
            return await query.FirstOrDefaultAsync();
        }

        public async Task RemoveAsync(T entity)
        {
            dbSet.Remove(entity);
            await _db.SaveChangesAsync();
        }

        public async Task RemoveRangeAsync(IEnumerable<T> entity)
        {
            dbSet.RemoveRange(entity);
            await _db.SaveChangesAsync();
        }
        public async Task<IEnumerable<T>> PaginationList(int pageNumber, int pageSize, params Expression<Func<T, object>>[] includes)
        {
            int itemsToSkip = (pageNumber - 1) * pageSize;

            // Get the DbSet for the specified type T
            var dbSet = _db.Set<T>();

            // Query the database to retrieve the entities
            IQueryable<T> query = dbSet;

            // Apply includes
            if (includes != null)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            // Execute the query
            var entities = await query
                .Skip(itemsToSkip)
                .Take(pageSize)
                .ToListAsync();

            return entities;
        }

        public async Task<int> CountAsync()
        {
            return await dbSet.CountAsync();
        }

        public async Task<IEnumerable<T>> GetWithIncludeAllAsync(params Expression<Func<T, object>>[] includes)
        {
            // Get the DbSet for the specified type T
            var dbSet = _db.Set<T>();
            // Query the database to retrieve the entities
            IQueryable<T> query = dbSet;
            // Apply includes
            if (includes != null)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }
            var entities = await query
               .ToListAsync();

            return entities;
        }

        public async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, Expression<Func<T, bool>> where, params string[] includes)
        {
            IQueryable<T> query = _db.Set<T>();

            if (where != null)
            {
                query = query.Where(where);
            }

            foreach (var include in includes)
            {
                query = query.Include(include);
            }

            return await query.FirstOrDefaultAsync(predicate);
        }

        public async Task<(IEnumerable<T> Data, int TotalRecords)> GetPaginatedDataAsync(
            PaginationParamsDto paginationParams,
            Expression<Func<T, bool>> searchExpression = null!,
            params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = dbSet;

            // Include related entities if specified
            foreach (var include in includes)
            {
                query = query.Include(include);
            }

            // Apply search expression if provided
            if (searchExpression != null)
            {
                query = query.Where(searchExpression);
            }

            if (!string.IsNullOrEmpty(paginationParams.SearchQuery))
            {
                // If SearchQuery is provided, construct dynamic search conditions
                string searchQuery = paginationParams.SearchQuery.ToLower();

                query = query.Where(x =>
                    EF.Property<string>(x, "UserName").ToLower().Contains(searchQuery) ||
                    EF.Property<string>(x, "Email").ToLower().Contains(searchQuery) ||
                    EF.Property<string>(x, "SponsorName").ToLower().Contains(searchQuery)

                );
            }

            if (DateTime.TryParse(paginationParams.SearchQuery, out DateTime searchDate))
            {
                query = query.Where(x => EF.Property<DateTime>(x, "CreatedAt").Date == searchDate.Date);
            }


            // Apply optional UserId filter
            if (!string.IsNullOrEmpty(paginationParams.UserId))
            {
                query = query.Where(x => EF.Property<string>(x, "UserId") == paginationParams.UserId);
            }

            // Apply optional TransType filter
            if (!string.IsNullOrEmpty(paginationParams.TransType))
            {
                query = query.Where(x => EF.Property<string>(x, "TransType") == paginationParams.TransType);
            }

            // Apply sorting
            query = paginationParams.SortOrder.ToLower() == "asc"
                ? query.OrderBy(x => EF.Property<object>(x, paginationParams.SortColumn))
                : query.OrderByDescending(x => EF.Property<object>(x, paginationParams.SortColumn));

            // Count total records before pagination
            var totalRecords = await query.CountAsync();

            // Apply pagination
            var paginatedData = await query
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToListAsync();

            return (paginatedData, totalRecords);
        }

        public async Task<T?> GetEntityAsync(
                    Expression<Func<T, bool>> predicate,
                    params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _db.Set<T>();

            // Apply each include
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            // Apply the predicate
            return await query.FirstOrDefaultAsync(predicate);
        }
        public async Task<T?> GetAsync(
               Expression<Func<T, bool>>? filter = null,
               params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _db.Set<T>();

            // Apply filtering if a filter is provided
            if (filter != null)
                query = query.Where(filter);

            // Apply eager loading
            query = includes.Aggregate(query, (current, include) => current.Include(include));

            // Return the first or default value
            return await query.FirstOrDefaultAsync();
        }

    }
}