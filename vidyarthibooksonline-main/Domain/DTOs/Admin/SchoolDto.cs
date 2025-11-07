using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class SchoolDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "School name is required.")]
        [StringLength(200, ErrorMessage = "School name cannot exceed 200 characters.")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Branch name is required.")]
        [StringLength(100, ErrorMessage = "Branch name cannot exceed 100 characters.")]
        public string BranchName { get; set; }

        [Required(ErrorMessage = "School code is required.")]
        [StringLength(20, ErrorMessage = "Code cannot exceed 20 characters.")]
        public string Code { get; set; }

        [Required(ErrorMessage = "Board is required.")]
        [StringLength(50, ErrorMessage = "Board cannot exceed 50 characters.")]
        public string Board { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        [StringLength(300, ErrorMessage = "Address cannot exceed 300 characters.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "City is required.")]
        [StringLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
        public string City { get; set; }

        [Required(ErrorMessage = "State is required.")]
        [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
        public string State { get; set; }

        [Phone(ErrorMessage = "Phone number is not valid.")]
        public string PhoneNumber { get; set; }

        [EmailAddress(ErrorMessage = "Email address is not valid.")]
        public string Email { get; set; }

        [Url(ErrorMessage = "School logo URL is not valid.")]
        public string? SchoolLogo { get; set; }
    }
}
