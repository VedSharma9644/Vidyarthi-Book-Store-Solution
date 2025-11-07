using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Customer.Controllers
{
    public class ShopController : BaseCustomerController
    {
        public ShopController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager) : base(unitOfWork, userManager)
        {
        }

        [Route("shop.html")]
        public IActionResult Shop()
        {
            return View();
        }

        [Route("general-book.html")]
        public IActionResult GeneralBook()
        {
            return View();
        }
    }
}
