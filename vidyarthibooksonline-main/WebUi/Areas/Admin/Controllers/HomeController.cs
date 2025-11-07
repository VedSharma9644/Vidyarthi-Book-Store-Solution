using DataAccess.Data;
using DataAccess.Repository;
using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using WebUi.Areas.Admin.Controllers;

namespace estentick.Areas.Admin.Controllers
{
	
	public class HomeController : BaseAdminController
	{
        public HomeController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager)
        {
        }

        [Route(SD.RedirectUrl.Admin)]
		public async Task<IActionResult> Index()
		{
            var data = await _unitOfWork.Dashboard.GetAdminDashboard();

            return View(data);
		}

       

    }
}
