
using Microsoft.AspNetCore.Identity;


namespace Domain.Entities.Shared
{
    public class AppUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? SchoolName { get; set; }
        public string? ClassStandard { get; set; } // e.g., "Class 10"
        public string RoleName { get; set; } = string.Empty;
        // Address fields
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        // Relationships
        public ICollection<Order> Orders { get; set; }= new List<Order>();
        public Cart Cart { get; set; }
       
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
