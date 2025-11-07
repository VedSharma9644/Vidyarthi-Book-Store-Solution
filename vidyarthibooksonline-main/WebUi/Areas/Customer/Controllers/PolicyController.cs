using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace WebUi.Areas.Customer.Controllers
{
    public class PolicyController : BaseCustomerController
    {
        public PolicyController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, IMemoryCache cache = null!) : base(unitOfWork, userManager, cache)
        {
        }

        [Route("return-policy.html")]
        public IActionResult ReturnsPolicy()
        {
            return View();
        }

        [Route("privacy-policy.html")]
        public IActionResult PrivacyPolicy()
        {
            return View();
        }

        [Route("terms-and-conditions.html")]
        public IActionResult TermsAndConditions()
        {
            return View();
        }

        [Route("shipping-policy.html")]
        public IActionResult ShippingPolicy()
        {
            return View();
        }

        [Route("faqs.html")]
        public IActionResult FAQs()
        {
            return View();
        }

        [Route("refund-policy.html")]
        public IActionResult RefundPolicy()
        {
            return View();
        }

        [Route("cancellation-policy.html")]
        public IActionResult CancellationPolicy()
        {
            return View();
        }

        [Route("grievance-redressal.html")]
        public IActionResult GrievanceRedressal()
        {
            return View();
        }

        [Route("legal-notice.html")]
        public IActionResult LegalNotice()
        {
            return View();
        }
    }
}
