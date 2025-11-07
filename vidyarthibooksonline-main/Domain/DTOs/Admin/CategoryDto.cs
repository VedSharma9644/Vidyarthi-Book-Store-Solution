using Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace Domain.DTOs.Admin
{
    public class CategoryDto
    {
        public int Id { get; set; }
        [Required(ErrorMessage ="Category Name is Required")]
        public string? Name { get; set; }
        public string? Description { get; set; }

        [Required(ErrorMessage = "Grade is Required")]
        public int GradeId { get; set; }
        public List<Grade>? Grades { get; set; }
      
    }
}
