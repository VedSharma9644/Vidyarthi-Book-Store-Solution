using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class School : BaseEntities
    {
        public string? Name { get; set; } // e.g. "Delhi Public School Nacharam"
        public string? BranchName { get; set; } // e.g. "Nacharam"
        public string? Code { get; set; } // e.g. "DPS-N"
        public string? Board { get; set; } // e.g. "IGCSE", "CBSE", "State Board"
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? SchoolLogo { get; set; }
        public bool IsActive { get; set; } = true;
        // Navigation properties
        public ICollection<Grade> Grades { get; set; } = new List<Grade>();
    }
}
