using DataAccess.Mapping;
using DataAccess.Repository;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;


namespace WebUi.Areas.Admin.Controllers
{
    public class SlidersController : BaseAdminController
    {
        private readonly IFilesUploadService _filesUpload;
        public SlidersController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!, IFilesUploadService filesUpload = null!)
            : base(unitOfWork, userManager)
        {
            _filesUpload = filesUpload;
        }

        [Route("manage-banners")]
        public async Task<IActionResult> Index()
        {
            var banners = await _unitOfWork.Sliders.GetAllAsync();
            var dtoList = banners.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(dtoList);
        }

        [Route("upsert-banner")]
        public async Task<IActionResult> Upsert(int id)
        {
            if (id == 0)
            {
                return View(new SlideBannerDto());
            }

            var entity = await _unitOfWork.Sliders.GetFirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            var dto = DtoToEntityMapper.MapToDto(entity);
            return View(dto);
        }

        [HttpPost]
        public async Task<IActionResult> SaveSlider(SlideBannerDto model, IFormFile? file)
        {
            try
            {
                if (!ModelState.IsValid)
                     return Json(new { success = false, message = "Model state is not valid." });

                SlideBanner entity;
               
                string coverImageUrl = null!;
                if (file != null && file.Length > 0)
                {
                    coverImageUrl = await _filesUpload.UploadImageAsync(file);
                }

                if (model.Id == 0)
                {
                    entity = DtoToEntityMapper.MapToEntity(model);

                    entity.ImageUrl = coverImageUrl;

                   await _unitOfWork.Sliders.AddAsync(entity);
                }
                else
                {
                    // Update fields using DTO
                    var updatedEntity = DtoToEntityMapper.MapToEntity(model);
                    updatedEntity.RedirectUrl = model.RedirectUrl!;
                    updatedEntity.ImageUrl = coverImageUrl ?? model.ImageUrl!;
                    
                    await _unitOfWork.Sliders.UpdateAsync(updatedEntity);
                }

                await _unitOfWork.SaveAsync();
                
                 return Json(new { success = true, message = "Banner saved successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
               return Json(new { success = false, message = "Error occurred while saving banner.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var banner = await _unitOfWork.Sliders.GetFirstOrDefaultAsync(x => x.Id == id);
                if (banner == null)
                    return NotFound();

                await _unitOfWork.Sliders.RemoveAsync(banner);
                await _unitOfWork.SaveAsync();


               return Json(new { success = true, message = "Banner deleted successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {

                  return Json(new { success = false, message = "Error occurred while deleting banner.", error = ex.Message });
            }
        }
    }
}
