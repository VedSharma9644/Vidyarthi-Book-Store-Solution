using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebUi.Areas.Admin.Controllers
{
    public class CustomersController : BaseAdminController
    {
        
        public CustomersController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager)
        {
        }


        [Route("all-customers")]
        public async Task<IActionResult> Index()
        {
            var data = await _unitOfWork.Customers.GetAllCustomers();
            return View(data);
        }
    }
}
