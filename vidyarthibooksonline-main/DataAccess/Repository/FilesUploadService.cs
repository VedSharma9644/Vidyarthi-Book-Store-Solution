using DataAccess.Repository.Interface;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;


namespace DataAccess.Repository
{
    public class FilesUploadService : IFilesUploadService
    {
        private readonly string _imageUploadDirectory;
        private readonly string[] _allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp" };
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5MB

        public FilesUploadService(string wwwrootPath)
        {
            _imageUploadDirectory = Path.Combine(wwwrootPath, "Uploads");

            if (!Directory.Exists(_imageUploadDirectory))
                Directory.CreateDirectory(_imageUploadDirectory);
        }

        public async Task<string> UploadImageAsync(IFormFile imageFile, int? width = null, int? height = null)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new ArgumentException("Invalid image file.");

            if (imageFile.Length > MaxFileSizeBytes)
                throw new ArgumentException("File size exceeds maximum limit of 5MB.");

            var extension = Path.GetExtension(imageFile.FileName).ToLower();
            if (!_allowedExtensions.Contains(extension))
                throw new ArgumentException("Unsupported file format.");

            string fileName = Guid.NewGuid() + ".webp";
            string filePath = Path.Combine(_imageUploadDirectory, fileName);

            using var image = await Image.LoadAsync(imageFile.OpenReadStream());

            // Resize if width or height is specified
            if (width.HasValue || height.HasValue)
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(width ?? image.Width, height ?? image.Height)
                }));
            }

            // Compress and save as WebP
            var encoder = new WebpEncoder
            {
                Quality = 75  // Adjust for compression quality (0–100)
            };

            await image.SaveAsync(filePath, encoder);

            // Return path in format "/uploads/filename.webp"
            return $"/Uploads/{fileName}";
        }

        public async Task<List<string>> UploadMultipleImagesAsync(List<IFormFile> imageFiles, int? width = null, int? height = null)
        {
            var uploadedImages = new List<string>();

            foreach (var file in imageFiles)
            {
                var path = await UploadImageAsync(file, width, height);
                uploadedImages.Add(path);
            }

            return uploadedImages;
        }
    }
}
