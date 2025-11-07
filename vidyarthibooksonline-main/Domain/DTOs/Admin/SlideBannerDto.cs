using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Admin
{
    public class SlideBannerDto
    {
        public int Id { get; set; }
        public string? Title { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; } = string.Empty;
        public string? RedirectUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
    }
}
