using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Admin.Controllers
{
    [Area(SD.AppArea.Admin)]
    [Authorize(policy: SD.RolePolicy.Admin)]
    public class BaseAdminController : Controller
    {
        protected readonly IUnitOfWork _unitOfWork;
        protected readonly UserManager<AppUser> _userManager;

        public BaseAdminController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }
    }
}
