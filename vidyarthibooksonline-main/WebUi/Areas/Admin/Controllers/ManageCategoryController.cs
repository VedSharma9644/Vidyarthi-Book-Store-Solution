using DataAccess.Mapping;
using DataAccess.Repository.CoreRepo;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace WebUi.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ManageCategoryController : BaseAdminController
    {
        public ManageCategoryController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!)
            : base(unitOfWork, userManager) { }

        [Route("get-all-categories")]
        public async Task<IActionResult> Index()
        {
            var categories = await _unitOfWork.Categories.GetAllAsync();
            var categoryDtos = categories.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(categoryDtos); // Still returning View for main listing
        }

        [Route("upsert-category")]
        public async Task<IActionResult> Upsert(int id = 0)
        {
            var grades = await _unitOfWork.Standards.GetAllAsync(include: s => s.Include(s => s.School)); // Fetch all grades

            if (id == 0)
            {
                // New category
                return View(new CategoryDto
                {
                    Grades = grades.ToList()
                });
            }

            var category = await _unitOfWork.Categories.GetFirstOrDefaultAsync(x => x.Id == id);
            if (category == null)
                return NotFound();

            var categoryDto = DtoToEntityMapper.MapToDto(category);
            categoryDto.Grades = grades.ToList();

            return View(categoryDto);
        }

        [HttpPost]
        public async Task<JsonResult> SaveCategory(CategoryDto model)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                              .Select(e => e.ErrorMessage)
                                              .ToList();
                return Json(new { success = false, message = "Validation failed.", errors });
            }

            try
            {
                if (model.Id == 0)
                {
                    var newCategory = DtoToEntityMapper.MapToEntity(model);
                    await _unitOfWork.Categories.AddAsync(newCategory);
                }
                else
                {
                   
                    var updatedCategory = DtoToEntityMapper.MapToEntity(model);
                    await _unitOfWork.Categories.UpdateAsync(updatedCategory);
                }

                await _unitOfWork.SaveAsync();
                return Json(new { success = true, message = "Category saved successfully.", redirectUrl=Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error saving category.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<JsonResult> Delete(int id)
        {
            try
            {
                var category = await _unitOfWork.Categories.GetFirstOrDefaultAsync(x => x.Id == id);
                if (category == null)
                    return Json(new { success = false, message = "Category not found." });

                await _unitOfWork.Categories.RemoveAsync(category);
                await _unitOfWork.SaveAsync();

                return Json(new { success = true, message = "Category deleted successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error deleting category.", error = ex.Message });
            }
        }
    }
}
