using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class SchoolDetailsDto
    {
        public int Id { get; set; }
        public string SchoolName { get; set; }
        public string LogoSchool { get; set; }
        public List<Grade> GetAllGrade  { get; set; }

    }
}
