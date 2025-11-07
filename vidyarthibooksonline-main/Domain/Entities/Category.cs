using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class Category : BaseEntities
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int GradeId { get; set; }
        // Relationships
        public Grade? Grade { get; set; }
        public ICollection<Book> Books { get; set; } = new List<Book>();

    }
}
