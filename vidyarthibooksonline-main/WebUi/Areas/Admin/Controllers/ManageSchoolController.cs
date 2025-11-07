using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Admin.Controllers
{
    public class ManageSchoolController : BaseAdminController
    {
        private readonly IFilesUploadService _filesUploadService;
        public ManageSchoolController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!, IFilesUploadService filesUploadService = null)
            : base(unitOfWork, userManager)
        {
            _filesUploadService = filesUploadService;
        }

        [Route("get-all-schools")]
        public async Task<IActionResult> Index()
        {
            var schools = await _unitOfWork.Schools.GetAllAsync();
            var schoolDtos = schools.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(schoolDtos);
        }

        [Route("upsert-school")]
        public async Task<IActionResult> Upsert(int id)
        {
            if (id == 0)
                return View(new SchoolDto());

            var school = await _unitOfWork.Schools.GetFirstOrDefaultAsync(s => s.Id == id);
            if (school == null)
                return NotFound();

            return View(DtoToEntityMapper.MapToDto(school));
        }

        [HttpPost]
        public async Task<JsonResult> SaveSchool(SchoolDto model, IFormFile file)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                              .Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = "Validation failed.", errors });
            }

            try
            {
                string schoolImage = null!;
                if(file != null && file.Length > 0)
                {
                    schoolImage = await _filesUploadService.UploadImageAsync(file);
                }
                if (model.Id == 0)
                {
                    var newSchool = DtoToEntityMapper.MapToEntity(model);
                    newSchool.SchoolLogo = schoolImage;
                    await _unitOfWork.Schools.AddAsync(newSchool);
                }
                else
                {
                   
                    var updatedSchool = DtoToEntityMapper.MapToEntity(model);
                    updatedSchool.SchoolLogo = schoolImage ?? model.SchoolLogo;
                    updatedSchool.UpdateAt = DateTime.Now;
                    await  _unitOfWork.Schools.UpdateAsync(updatedSchool);
                }

                await _unitOfWork.SaveAsync();
                return Json(new { success = true, message = "School saved successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error saving school.", error = ex.Message });
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<JsonResult> Delete(int id)
        {
            try
            {
                var school = await _unitOfWork.Schools.GetFirstOrDefaultAsync(s => s.Id == id);
                if (school == null)
                    return Json(new { success = false, message = "School not found." });

                await _unitOfWork.Schools.RemoveAsync(school);
                await _unitOfWork.SaveAsync();

                return Json(new { success = true, message = "School deleted successfully.",redirectUrl=Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error deleting school.", error = ex.Message });
            }
        }
    }
}
