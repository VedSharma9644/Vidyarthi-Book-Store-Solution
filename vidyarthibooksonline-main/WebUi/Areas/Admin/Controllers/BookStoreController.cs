using DataAccess.Mapping;
using DataAccess.Repository.Interface;
using Domain.DTOs.Admin;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;


namespace WebUi.Areas.Admin.Controllers
{

    public class BookStoreController : BaseAdminController
    {
        private readonly IFilesUploadService _filesUploadService;
        public BookStoreController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager = null!, IFilesUploadService filesUploadService = null)
            : base(unitOfWork, userManager)
        {
            _filesUploadService = filesUploadService;
        }

        [Route("get-all-books")]
        public async Task<IActionResult> Index()
        {
            var books = await _unitOfWork.Books.GetAllAsync();
            var bookDtos = books.Select(DtoToEntityMapper.MapToDto).ToList();
            return View(bookDtos);
        }

        [Route("upsert-book")]
        public async Task<IActionResult> Upsert(int id)
        {
            var categories = await _unitOfWork.Categories.GetAllAsync();

            if (id == 0)
            {
                // New book case
                var newBookDto = new BookDto
                {
                    GetCategories = categories.ToList()
                };
                return View(newBookDto);
            }

            var book = await _unitOfWork.Books.GetFirstOrDefaultAsync(s => s.Id == id);
            if (book == null)
                return NotFound();

            var bookDto = DtoToEntityMapper.MapToDto(book);
            bookDto.GetCategories = categories.ToList();

            return View(bookDto);
        }

        [HttpPost]
        public async Task<JsonResult> SaveBook(BookDto model, IFormFile? file)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                              .Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = "Validation failed.", errors });
            }

            try
            {
                string coverImageUrl = null!;
                if(file !=null && file.Length > 0)
                {
                    coverImageUrl = await _filesUploadService.UploadImageAsync(file);
                }
                if (model.Id == 0)
                {
                    var newBook = DtoToEntityMapper.MapToEntity(model);
                    newBook.CoverImageUrl = coverImageUrl; // Set the cover image URL
                    await _unitOfWork.Books.AddAsync(newBook);
                }
                else
                {
                    

                    var updatedBook = DtoToEntityMapper.MapToEntity(model);
                    updatedBook.CoverImageUrl = coverImageUrl ?? model.CoverImageUrl; // Preserve the old image if no new image is uploaded
                    await _unitOfWork.Books.UpdateAsync(updatedBook);
                }

                await _unitOfWork.SaveAsync();
                return Json(new { success = true, message = "Book saved successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error saving book.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<JsonResult> Delete(int id)
        {
            try
            {
                var book = await _unitOfWork.Books.GetFirstOrDefaultAsync(s => s.Id == id);
                if (book == null)
                    return Json(new { success = false, message = "Book not found." });

                await _unitOfWork.Books.RemoveAsync(book);
                await _unitOfWork.SaveAsync();

                return Json(new { success = true, message = "Book deleted successfully.", redirectUrl = Url.Action(nameof(Index)) });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error deleting book.", error = ex.Message });
            }
        }
    }
}
