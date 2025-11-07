using Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class GradeDto
    {
        public int Id { get; set; }
        public int SchoolId { get; set; }
        [Required(ErrorMessage = "Grade Name is required")]
        public string? Name { get; set; } // e.g. "Grade 1", "Class 1"
        public School? School { get ; set; }
        public List<School>? GetSchools {  get; set; }
    }
}
