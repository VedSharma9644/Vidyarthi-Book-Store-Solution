using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Customer.Controllers
{
    public class CustomerAccountController : BaseCustomerController
    {
        public CustomerAccountController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager) : base(unitOfWork, userManager)
        {
        }

        [Route("my-account.html")]
        public IActionResult Index()
        {
            return View();
        }
    }
}
