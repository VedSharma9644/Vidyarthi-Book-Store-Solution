using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebUi.Areas.Admin.Controllers
{
   
    public class EmailConfigurationController : BaseAdminController
    {
        public EmailConfigurationController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager)
        {
        }

        // GET: /ad/email-config
        [Route("ad/email-config")]
        public async Task<IActionResult> Index()
        {
            var data = await _unitOfWork.ConfigureEmailProvider.GetAllAsync();
                 
            return View(data);
        }

        // GET: /ad/add-email-config
        [Route("upsert-email-config")]
        public async Task<IActionResult> AddEmailConfig(int id)
        {
            SmtpSetting setting = new SmtpSetting();
            if (id == 0)
            {
                return View(setting); // Show empty form for adding new config
            }
            else
            {
                setting = await _unitOfWork.ConfigureEmailProvider.GetFirstOrDefaultAsync(x => x.Id == id);
                return View(setting); // Edit form with existing config
            }
        }

        // POST: /ad/save-email-config
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveEmailConfig(SmtpSetting model)
        {
            try
            {
                if (model.Id == 0) // New configuration
                {
                    await _unitOfWork.ConfigureEmailProvider.AddAsync(model);
                    return Json(new { success = true, message = "Email configuration has been saved successfully" });
                }
                else // Existing configuration
                {
                    await _unitOfWork.ConfigureEmailProvider.UpdateAsync(model);
                    return Json(new { success = true, message = "Email configuration has been updated successfully" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error while saving email configuration", error = ex.Message });
            }
        }

        // POST: /ad/delete-email-config
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteEmailConfig(int id)
        {
            try
            {
                var entity = await _unitOfWork.ConfigureEmailProvider.GetFirstOrDefaultAsync(x => x.Id == id);
                if (entity != null)
                {
                    await _unitOfWork.ConfigureEmailProvider.RemoveAsync(entity);
                    return Json(new { success = true, message = "Email configuration deleted successfully." });
                }
                return Json(new { success = false, message = "Configuration not found." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error while deleting email configuration", error = ex.Message });
            }
        }
    }
}
