using Domain.Entities;
using System.ComponentModel.DataAnnotations;


namespace Domain.DTOs.Admin
{
    public class BookDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Title is required.")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
        public string? Title { get; set; }

        [Required(ErrorMessage = "Author is required.")]
        [StringLength(100, ErrorMessage = "Author cannot exceed 100 characters.")]
        public string? Author { get; set; }

        [StringLength(100, ErrorMessage = "Publisher name cannot exceed 100 characters.")]
        public string? Publisher { get; set; }

        [Required(ErrorMessage = "ISBN is required.")]
        [StringLength(20, ErrorMessage = "ISBN cannot exceed 20 characters.")]
        public string? ISBN { get; set; }

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
        public string? Description { get; set; }

        [Range(0, 99999, ErrorMessage = "Price must be between 0 and 99999.")]
        public decimal Price { get; set; }

        [Range(0, 99999, ErrorMessage = "Discount price must be between 0 and 99999.")]
        public decimal? DiscountPrice { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity must be 0 or more.")]
        public int StockQuantity { get; set; }

        [Required(ErrorMessage = "Book Type is required.")]
        [StringLength(50, ErrorMessage = "Book Type cannot exceed 50 characters.")]
        public string? BookType { get; set; }

        [Required(ErrorMessage = "Category ID is required.")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? SchoolName { get; set; }
        public string? SchoolBranch { get; set; }
        public List<Category> GetCategories { get; set; } = new List<Category>();
    }
}
