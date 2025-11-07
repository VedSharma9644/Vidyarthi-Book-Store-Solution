
using Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs
{
    public class RegisterDTOs
    {

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid Email Address")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Mobile Number is required")]
        [MinLength(10, ErrorMessage = "Mobile Number must be at least 10 characters long")]
        public string? MobileNumber { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "Confirm Password is required")]
        [Compare("Password", ErrorMessage = "Password and Confirm Password do not match")]
        public string? ConfirmPassword { get; set; }

        [Required(ErrorMessage = "Mobile OTP is required")]
        public string? MobileOtp { get; set; }

    }
}
