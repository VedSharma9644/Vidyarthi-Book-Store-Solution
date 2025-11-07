
using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs
{
    public class LoginDTOs
    {
        [Required(ErrorMessage = "Mobile Number or Email is required")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [StringLength(50, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 50 characters")]
        public string? Password { get; set; }

        [Display(Name = "Remember me?")]
        public bool RememberMe { get; set; }
    }
}
