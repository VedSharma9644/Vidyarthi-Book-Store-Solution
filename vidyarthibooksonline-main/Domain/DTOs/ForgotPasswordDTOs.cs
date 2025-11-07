using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public class ForgotPasswordDTOs
    {

        [Required(ErrorMessage = "Mobile number is required")]
        [Phone(ErrorMessage = "Invalid mobile number")]
        [StringLength(10, MinimumLength = 10, ErrorMessage = "Mobile number must be exactly 10 digits")]
        [Display(Name = "Mobile Number")]
        public string? MobileNumber { get; set; }
    }
}
