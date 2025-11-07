using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebUi.Areas.Admin.Controllers
{
    public class ManageGradeController : BaseAdminController
    {
        public ManageGradeController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager) { }

        [Route("get-all-grades")]
        public async Task<IActionResult> Index()
        {
            var grades = await _unitOfWork.Standards.GetAllAsync(include: s => s.Include(s => s.School));
            var gradeDtos = grades.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(gradeDtos);
        }

        [Route("upsert-grade")]
        public async Task<IActionResult> Upsert(int id = 0)
        {
            var schools = await _unitOfWork.Schools.GetAllAsync(); // Get all schools

            if (id == 0)
            {
                // Create mode
                return View(new GradeDto
                {
                    GetSchools = schools.ToList()
                });
            }

            var grade = await _unitOfWork.Standards.GetFirstOrDefaultAsync(s => s.Id == id);
            if (grade == null)
                return NotFound();

            var gradeDto = DtoToEntityMapper.MapToDto(grade);
            gradeDto.GetSchools = schools.ToList();

            return View(gradeDto);
        }

        [HttpPost]
        public async Task<JsonResult> SaveGrade(GradeDto model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return Json(new { success = false, message = "Validation failed.", errors });
            }

            try
            {
                if (model.Id == 0)
                {
                    var newGrade = DtoToEntityMapper.MapToEntity(model);
                    await _unitOfWork.Standards.AddAsync(newGrade);
                }
                else
                {
                    var existing = await _unitOfWork.Standards.GetFirstOrDefaultAsync(s => s.Id == model.Id);
                    if (existing == null)
                        return Json(new { success = false, message = "Grade not found." });

                    var updated = DtoToEntityMapper.MapToEntity(model);
                    await _unitOfWork.Standards.UpdateAsync(updated);
                }

                await _unitOfWork.SaveAsync();
                return Json(new { success = true, message = "Grade saved successfully." , redirectUrl=Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error occurred.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<JsonResult> Delete(int id)
        {
            try
            {
                var grade = await _unitOfWork.Standards.GetFirstOrDefaultAsync(s => s.Id == id);
                if (grade == null)
                    return Json(new { success = false, message = "Grade not found." });

               await _unitOfWork.Standards.RemoveAsync(grade);
                await _unitOfWork.SaveAsync();

                return Json(new { success = true, message = "Grade deleted successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error deleting grade.", error = ex.Message });
            }
        }
    }
}
