using Domain.DTOs;
using System.Linq.Expressions;

namespace DataAccess.Repository.Interface
{
    public interface IBaseRepo<T> where T : class
    {
        Task<T> GetFirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
        Task<IEnumerable<T>> GetAllAsync(Expression<Func<T, bool>>? filter = null,
                                          Func<IQueryable<T>, IQueryable<T>>? include = null,
                                          Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
        Task<IEnumerable<T>> GetWithIncludeAllAsync(params Expression<Func<T, object>>[] includes);
        Task AddAsync(T entity);
        Task RemoveAsync(T entity);
        Task RemoveRangeAsync(IEnumerable<T> entity);
        Task<IEnumerable<T>> PaginationList(int pageNumber, int pageSize, params Expression<Func<T, object>>[] includes);
        Task<int> CountAsync();
        Task<T> FirstOrDefaultAsync(
                        Expression<Func<T, bool>> predicate,
                        Expression<Func<T, bool>> where,
                        params string[] includes);
        // New method for handling pagination, search, and sorting
        Task<(IEnumerable<T> Data, int TotalRecords)> GetPaginatedDataAsync(
            PaginationParamsDto paginationParams,
            Expression<Func<T, bool>> searchExpression = null!,
            params Expression<Func<T, object>>[] includes);
        Task UpdateAsync(T entity);  // Add this method for updating the entity

        Task<T?> GetEntityAsync(
        Expression<Func<T, bool>> predicate,
        params Expression<Func<T, object>>[] includes);

        // Get a single entity
        Task<T?> GetAsync(
            Expression<Func<T, bool>>? filter = null,
            params Expression<Func<T, object>>[] includes);
    }
}
