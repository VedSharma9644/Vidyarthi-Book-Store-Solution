using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebUi.Areas.Admin.Controllers
{

    public class ManageCouponController : BaseAdminController
    {
        public ManageCouponController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!) : base(unitOfWork, userManager) { }

        [Route("manage-coupon")]
        public async Task<IActionResult> Index()
        {
            var coupons = await _unitOfWork.Coupons.GetAllAsync();
            var couponDtos = coupons.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(couponDtos);
        }

        [Route("upsert-coupon")]
        public async Task<IActionResult> Upsert(int id)
        {
            if (id == 0)
                return View(new CouponDto());

            var coupon = await _unitOfWork.Coupons.GetFirstOrDefaultAsync(s => s.Id == id);
            if (coupon == null)
                return NotFound();

            return View(DtoToEntityMapper.MapToDto(coupon));
        }

        [HttpPost]
        public async Task<JsonResult> SaveCoupon(CouponDto model)
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
                    var newCoupon = DtoToEntityMapper.MapToEntity(model);
                    await _unitOfWork.Coupons.AddAsync(newCoupon);
                }
                else
                {
                  

                    var updatedCoupon = DtoToEntityMapper.MapToEntity(model);
                    await  _unitOfWork.Coupons.UpdateAsync(updatedCoupon);
                }

                await _unitOfWork.SaveAsync();
                return Json(new { success = true, message = "Coupon saved successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error occurred while saving coupon.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<JsonResult> Delete(int id)
        {
            try
            {
                var coupon = await _unitOfWork.Coupons.GetFirstOrDefaultAsync(s => s.Id == id);
                if (coupon == null)
                    return Json(new { success = false, message = "Coupon not found." });

                await _unitOfWork.Coupons.RemoveAsync(coupon);
                await _unitOfWork.SaveAsync();

                return Json(new { success = true, message = "Coupon deleted successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error occurred while deleting coupon.", error = ex.Message });
            }
        }
    }
}
