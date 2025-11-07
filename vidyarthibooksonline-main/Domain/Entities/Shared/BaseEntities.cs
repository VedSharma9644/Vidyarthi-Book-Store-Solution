
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities.Shared
{
    public class BaseEntities
    {
        [Key]
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));
        public DateTime? UpdateAt {  get; set; }
    }
}
