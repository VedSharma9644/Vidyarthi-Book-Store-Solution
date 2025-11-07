using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.DTOs.Customer;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Threading.Tasks;

namespace WebUi.Areas.Customer.Controllers
{
    public class HomeController : BaseCustomerController
    {
        private readonly ISmsService smsService;
        public HomeController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, IMemoryCache cache, ISmsService smsService = null) : base(unitOfWork, userManager, cache)
        {
            this.smsService = smsService;
        }

        public IActionResult Index()
        {
            return View();
        }

        [Route("about-us.html")]
        public IActionResult AboutUs ()
        {
            return View();
        }

        [Route("contact-us.html")]
        public IActionResult ContactUs()
        {
            return View();
        }

        [HttpGet("api/home-data")]
        public async Task<JsonResult> GetHomeData()
        {
            const string booksCacheKey = "home_best_seller_books";
            const string slidersCacheKey = "home_slider_banners";

            List<BookDto> books;
            List<SlideBannerDto> sliders;

            // Try to get from cache
            if (!_cache.TryGetValue(booksCacheKey, out books!))
            {
                var bookEntities = await _unitOfWork.Books.GetBestSellerBooks(6);
                books = bookEntities.Select(DtoToEntityMapper.MapToDto).ToList();

                // Cache books for 10 minutes
                _cache.Set(booksCacheKey, books, TimeSpan.FromMinutes(10));
            }

            if (!_cache.TryGetValue(slidersCacheKey, out sliders!))
            {
                var sliderEntities = await _unitOfWork.Sliders.GetAllAsync();
                sliders = sliderEntities.Select(DtoToEntityMapper.MapToDto).ToList();

                // Cache sliders for 10 minutes
                _cache.Set(slidersCacheKey, sliders, TimeSpan.FromMinutes(10));
            }

            var homeDto = new HomeDto
            {
                Books = books!,
                Slider = sliders!
            };

            return Json(homeDto);
        }

        //sms api test
        [HttpGet]
        public async Task<IActionResult> SendOtpVia2Factor()
        {
            var phoneNumber = "+919892247704";
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return BadRequest("Phone number is required.");

            var result = await smsService.SendOtp2fAsync(phoneNumber);

            if (result)
                return Ok(new { message = "OTP sent successfully via 2Factor.in" });

            return StatusCode(500, new { message = "Failed to send OTP" });
        }
    }
}
