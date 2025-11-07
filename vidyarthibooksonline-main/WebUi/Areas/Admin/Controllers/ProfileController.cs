using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Admin.Controllers
{
    public class ProfileController : BaseAdminController
    {
        public ProfileController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager)
        {
        }


        [Route("admin-update-password")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePassword(PasswordChangeDTOs model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { message="ModelState is not valid" });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Json("User not found");
            }

            // Verify current password
            var passwordCheck = await _userManager.CheckPasswordAsync(user, model.OldPassword!);
            if (!passwordCheck)
            {
                return Json(new {message= "Current password is incorrect" });
            }

            // Change password
            var result = await _userManager.ChangePasswordAsync(user, model.OldPassword!, model.NewPassword!);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                return Json(new {message = ModelState });
            }

            return Json(new { success=true, message = "Password updated successfully", redirectUrl = Url.Action("Index")});
        }
    }
}
