
using DataAccess.Data;
using DataAccess.Repository;
using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages;
using Nethereum.Contracts.Standards.ENS;
using System.Text.RegularExpressions;

namespace estentick.Areas.Auth.Controllers
{
    [Area("Auth")]
    public class AccountController : Controller
    {
        private readonly IAccountRepo _accountRepo;
        private readonly IEmailSenderService _emailSenderService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        public readonly AppDbContext _db;
        private readonly ISmsService _smsService;
        private readonly IEmailSenderService _emailSender;
        private readonly IUnitOfWork _unitOfWork;
        public AccountController(IAccountRepo accountRepo,
            IEmailSenderService emailSenderService,
            IWebHostEnvironment webHostEnvironment,
            UserManager<AppUser> userManager,
            AppDbContext db,
            IEmailSenderService emailSender,
            IUnitOfWork unitOfWork,
            ISmsService smsService,
            SignInManager<AppUser> signInManager = null!)
        {
            _accountRepo = accountRepo;
            _emailSenderService = emailSenderService;
            _webHostEnvironment = webHostEnvironment;
            _userManager = userManager;
            _db = db;
            _emailSender = emailSender;
            _unitOfWork = unitOfWork;
            _smsService = smsService;
            _signInManager = signInManager;
        }

        //[Route("login")]
        [Route("login")]
        public IActionResult Login()
        {
			
			return View();
        }

        //[Route("admin-login")]
        [Route("admin-login")]
        public IActionResult AdminLogin()
        {
			return View();
        }

        //[Route("register")]

        [Route("register")]
        public IActionResult Register()
        {
		   return View();
        }

        // [Route("forgot-password")]
        [Route("forgot-password")]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        //[Route("reset-password")]
        [Route("reset-password")]
        public ActionResult ResetPassword(string? mobileNumber)
        {
            ViewBag.MobileNumber = mobileNumber;
            return View();
        }

        //POST : login
        [HttpPost]
        public async Task< IActionResult> LoginUser(LoginDTOs model, string? returnUrl = null)
        {
            try
            {
                var response = await _accountRepo.SignInAsync(model);

                if (response.Flag)
                {
                    // Priority 1: Use returnUrl if valid
                    if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                    {
                        return Json(new { success = true, redirectUrl = returnUrl });
                    }

                    // Priority 2: Fall back to role-based redirects
                    string redirectUrl = response.Role switch
                    {
                        SD.UserRoles.Admin => Url.Action("Index", "Home", new { area = SD.AppArea.Admin})!,
                        SD.UserRoles.Customer => Url.Action("Index", "Home", new { area = SD.AppArea.Customer })!,
                        _ => "/" // Default
                    };

                    return Json(new { success = true, redirectUrl });
                }
                else
                {
                    return Json(new { success = false, message = response.Message });
                }
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "An error occurred." });
            }
        }

        //POST : register
        [HttpPost]
        public async Task<IActionResult> RegisterUser(RegisterDTOs model, string? returnUrl = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Password))
                {
                    return Json(new
                    {
                        success = false,
                        message = "All fields are required"
                    });
                }

                // Register the user (assuming CreateAsync handles creating AppUser)
                var response = await _accountRepo.CreateAsync(model);

                if (response.Flag)
                {
                    // Find user and sign in using SignInManager
                    var user = await _userManager.FindByEmailAsync(model.Email);
                    if (user != null)
                    {
                        await _signInManager.SignInAsync(user, isPersistent: true);
                    }

                    return Json(new
                    {
                        success = true,
                        message = response.Message,
                        redirectUrl = !string.IsNullOrEmpty(returnUrl) ? returnUrl : Url.Action("Index", "Home", new { area = SD.AppArea.Customer })
                    });
                }
                else
                {
                    return Json(new
                    {
                        success = false,
                        message = response.Message
                    });
                }
            }
            catch (Exception)
            {
                return Json(new
                {
                    success = false,
                    message = "Something went wrong, please try again later."
                });
            }

        }

        //POST : register via 2factor 
        [HttpPost("verify-and-register")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyAndRegister([FromBody] RegisterPhoneNumberDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Mobile) || string.IsNullOrWhiteSpace(model.Otp))
            {
                return BadRequest(new { success = false, message = "Mobile number and OTP are required." });
            }
            try
            {
                var res = await _accountRepo.RegisterWithPhoneNumberAsync(model);
                if (res.Flag)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Registration successful!",
                        redirectUrl = "/login"
                    });
                }
                else
                {
                  return BadRequest(new { success = false, message = res.Message });
                }
              
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Internal server error: {ex.Message}" });
            }
        }

        //POST: login via 2factor
        [HttpPost("login-with-2factorOtp")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendOtpVia2Factor([FromBody] RegisterPhoneNumberDto  model)
        {
            if (string.IsNullOrWhiteSpace(model.Mobile) || !Regex.IsMatch(model.Mobile, @"^\d{10}$"))
                return BadRequest("Valid 10-digit mobile number is required.");
            if(string.IsNullOrWhiteSpace(model.Otp) || !Regex.IsMatch(model.Otp, @"^\d{6}$"))
                return BadRequest("Valid 6-digit OTP is required.");

            try
            {
                var res = await _accountRepo.LoginWithPhoneNumberAsync(model);
                if (res.Flag)
                {
                    return Ok(new { success = true, message = "OTP sent successfully." });
                }
                else
                {
                    return BadRequest(new { success = false, message = res.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Internal server error: {ex.Message}" });
            }
        }

        //POST : forgot password
        [HttpPost]
        public async Task<IActionResult> ForgotUserPassword(ForgotPasswordDTOs model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.MobileNumber))
                    return Json(new { success = false, message = "Mobile number is required" });

                var phoneNumber = $"+91{model.MobileNumber}";

                // Generate 6-digit OTP
                var random = new Random();
                string otp = random.Next(100000, 999999).ToString();

                

                // Send OTP via SMS (assume SendOtp2fManualAsync exists)
                var sendResult = await _smsService.SendOtp2fAsync(phoneNumber, otp);

                if (!sendResult)
                    return Json(new { success = false, message = "Failed to send OTP. Please try again later." });

                // You might want to store phoneNumber in TempData or Session to verify in reset password step

                return Json(new
                {
                    success = true,
                    message = "OTP sent successfully",
                    redirectUrl = Url.Action("ResetPassword", new { mobileNumber = model.MobileNumber }) // Redirect to ResetPassword page where user enters OTP + new password
                });
            }
            catch (Exception)
            {
                return Json(new
                {
                    success = false,
                    message = "Something went wrong. Please try again later."
                });
            }
        }

        // POST: Verify OTP and reset password
        [HttpPost]
        public async Task<IActionResult> SaveResetPassword(ResetPasswordDto model)
        {
            if (!ModelState.IsValid)
               return Json(new { success = false, message = "Invalid OTP or new password." });

            var phoneNumber = $"+91{model.MobileNumber}";

            // Check OTP in DB
            var otpEntry = await _db.MembersOtps
                .Where(o => o.MobileNumber == phoneNumber && o.OTP == model.Otp)
                .FirstOrDefaultAsync();

            if (otpEntry == null || otpEntry.ExpiryDateTime < DateTime.Now)
            {
                ModelState.AddModelError("", "Invalid or expired OTP.");
                return Json(new { success = false, message = "Invalid or expired OTP." });
            }

            // Find user by phone number
            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == model.MobileNumber);
            if (user == null)
            {
                ModelState.AddModelError("", "User not found.");
                return Json(new { success = false, message = "User not found." });
            }

            // Reset password using UserManager
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetPassResult = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

            if (!resetPassResult.Succeeded)
            {
                foreach (var error in resetPassResult.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
               return Json(new { success = false, message = "Failed to reset password. Please try again later." });
            }

            // Remove OTP after success
            _db.MembersOtps.Remove(otpEntry);
            await _db.SaveChangesAsync();

            return Json(new { success = true, message = "Password reset successfully.",redirectUrl= Url.Action("Login") });
        }


        //POST : logout
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var response = await _accountRepo.SignOutAsync();

            if (response.Flag)
            {
                TempData["success"] = response.Message;
                return Json(new { success = true, message = response.Message,redirectUrl = Url.Action("Index", "Home" , new { area = "Customer" }) });
            }

            return Json(new { success = false, message = response.Message });
        }

    
        [HttpGet("send-otp-via-2factor")]
        public async Task<IActionResult> SendOtpVia2Factor([FromQuery] string mobile)
        {
            if (string.IsNullOrWhiteSpace(mobile) || !Regex.IsMatch(mobile, @"^\d{10}$"))
                return BadRequest("Valid 10-digit mobile number is required.");

            var phoneNumber = $"+91{mobile}";

            var result = await _smsService.SendOtp2fAsync(phoneNumber);

            if (result)
                return Ok(new { message = "OTP sent successfully via 2Factor.in" });

            return StatusCode(500, new { message = "Failed to send OTP" });
        }

        
    }
}
