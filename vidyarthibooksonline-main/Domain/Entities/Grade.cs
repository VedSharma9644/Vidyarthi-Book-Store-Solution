using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Grade : BaseEntities
    {
        public int SchoolId { get; set; }
        public string? Name { get; set; } // e.g. "Grade 1", "Class 1"
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public School? School { get; set; }
        public ICollection<Category> Categories { get; set; } = new HashSet<Category>(); // One-to-many>
  
    }
}
