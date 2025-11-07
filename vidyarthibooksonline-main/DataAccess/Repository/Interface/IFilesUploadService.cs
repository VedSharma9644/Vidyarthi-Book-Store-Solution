

using Microsoft.AspNetCore.Http;

namespace DataAccess.Repository.Interface
{
    public interface IFilesUploadService
    {
        Task<string> UploadImageAsync(IFormFile imageFile, int? width = null, int? height = null);
        Task<List<string>> UploadMultipleImagesAsync(List<IFormFile> imageFiles, int? width = null, int? height = null);
    }

}
