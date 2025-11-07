

using DataAccess.Repository.CoreRepo.Interface;

namespace DataAccess.Repository.Interface
{
    public interface IUnitOfWork : IDisposable
    {
        // Generic repository accessor
        IBaseRepo<T> GetRepository<T>() where T : class;

        // Specialized repositories
        IRandomNumber RandomNumberGenerator { get; }
        ISupports SupportsTicket { get; }
        IConfigureEmailProvider ConfigureEmailProvider { get; }

        // New repositories
        IBookRepo Books { get; }
        ICategoryRepo Categories { get; }
        IOrderRepo Orders { get; }
        ICouponRepo Coupons { get; }
        ICartRepo Carts { get; }
        ICartItemRepo CartItems { get; }
       
        IGradeRepo Standards { get; }
        ICustomerRepo Customers { get; }
        IDashboardRepo Dashboard { get; }
        ISchoolRepo Schools { get; }
        ISliderRepo Sliders { get; }
        // Save changes to the database
        Task<int> SaveAsync();
    }
}
