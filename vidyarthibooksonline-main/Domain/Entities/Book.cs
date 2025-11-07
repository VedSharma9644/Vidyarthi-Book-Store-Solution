using Domain.Entities.Shared;


namespace Domain.Entities
{
    public class Book : BaseEntities
    {
        public string? Title { get; set; }
        public string? Author { get; set; }
        public string? Publisher { get; set; }
        public string? ISBN { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int StockQuantity { get; set; }
        public string? CoverImageUrl { get; set; }

        public string? BookType { get; set; }
        public DateTime PublicationDate { get; set; }
        public bool IsFeatured { get; set; }

        // Relationships
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    }
}
