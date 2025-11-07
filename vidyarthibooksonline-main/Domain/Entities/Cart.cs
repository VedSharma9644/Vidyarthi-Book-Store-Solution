using Domain.Entities.Shared;


namespace Domain.Entities
{
    public class Cart : BaseEntities
    {
     
        // Relationships
        public string UserId { get; set; }
        public AppUser User { get; set; }
        public decimal ShippingCost { get; set; } = 0;
        public ICollection<CartItem> CartItems { get; set; }
    }
}
