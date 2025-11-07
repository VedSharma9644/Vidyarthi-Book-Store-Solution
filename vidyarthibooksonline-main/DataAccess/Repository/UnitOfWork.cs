using DataAccess.Data;
using DataAccess.Repository.CoreRepo;
using DataAccess.Repository.CoreRepo.Interface;
using DataAccess.Repository.Interface;
using DataAccess.Services.CourierService.Interface;
using Domain.Entities;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Data;
using System.IO;


namespace DataAccess.Repository
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _db;
        private readonly IDbConnection _dbConnenction;
        
        private readonly UserManager<AppUser> _userManager;
        private readonly ConcurrentDictionary<Type, object> _repositories = new();
        private readonly IShiprocketService _shiprocketService;
        private bool _disposed;

        public UnitOfWork(AppDbContext db, UserManager<AppUser> userManager, IDbConnection dbConnenction = null!, IShiprocketService shiprocketService = null!)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _dbConnenction = dbConnenction ?? throw new ArgumentNullException(nameof(db)); ;
            _shiprocketService = shiprocketService;
            
        }

        // Lazy initialization for repositories
        private IRandomNumber? _randomNumberGenerator;
        public IRandomNumber RandomNumberGenerator =>
            _randomNumberGenerator ??= new RandomNumberGeneratorRepo(_db);

        private ISupports? _supportsTicket;
        public ISupports SupportsTicket =>
            _supportsTicket ??= new SupportRepo(_db);

        private IConfigureEmailProvider? _configureEmailProvider;
        public IConfigureEmailProvider ConfigureEmailProvider =>
            _configureEmailProvider ??= new ConfigureEmailProviderRepo(_db);

        // New repositories (lazy initialization)
        private IBookRepo? _books;
        public IBookRepo Books => _books ??= new BookRepo(_db);

        private ICategoryRepo? _categories;
        public ICategoryRepo Categories => _categories ??= new CategoryRepo(_db);

        private IOrderRepo? _orders;
        public IOrderRepo Orders => _orders ??= new OrderRepo(_db, _shiprocketService);

      
        private ICouponRepo? _coupons;
        public ICouponRepo Coupons => _coupons ??= new CouponRepo(_db);

        private ICartRepo? _carts;
        public ICartRepo Carts => _carts ??= new CartRepo(_db);

        private ICartItemRepo? _cartItems;
        public ICartItemRepo CartItems => _cartItems ??= new CartItemRepo(_db);

      

        private IGradeRepo? _standards;
        public IGradeRepo Standards => _standards ??= new GradeRepo(_db);
        
        private ICustomerRepo? _customers;
        public ICustomerRepo Customers => _customers ??= new CustomerRepo(_db);

        private IDashboardRepo _dashboardRepo;
        public IDashboardRepo Dashboard => _dashboardRepo ??= new DashboardRepo(_db, _dbConnenction);

        private ISchoolRepo _schools;
        public ISchoolRepo Schools =>
            _schools ??= new SchoolRepo(_db);

        private ISliderRepo _sliders;
        public ISliderRepo Sliders =>
            _sliders ??= new SliderRepo(_db);



        // Generic Repository Access
        public IBaseRepo<T> GetRepository<T>() where T : class
        {
            return (IBaseRepo<T>)_repositories.GetOrAdd(typeof(T), _ =>
            {
                return new BaseRepo<T>(_db); // Ensure BaseRepo<T> is implemented correctly
            });
        }

        // Save changes to the database
        public async Task<int> SaveAsync()
        {
            return await _db.SaveChangesAsync();
        }

        // Dispose pattern
        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed && disposing)
            {
                _db.Dispose();
            }
            _disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }


    }
}
