using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace WebUi.Areas.Customer.Controllers
{
    [Area(SD.AppArea.Customer)]

    public class BaseCustomerController : Controller
    {
        protected readonly IUnitOfWork _unitOfWork;
        protected readonly UserManager<AppUser> _userManager;
        protected readonly IMemoryCache _cache;
        public BaseCustomerController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, IMemoryCache cache = null!)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _cache = cache;
        }
    }
}
