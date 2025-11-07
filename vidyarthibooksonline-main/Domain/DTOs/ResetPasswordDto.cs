using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [StringLength(10, MinimumLength = 10)]
        public string MobileNumber { get; set; }

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string Otp { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; }
    }
}
