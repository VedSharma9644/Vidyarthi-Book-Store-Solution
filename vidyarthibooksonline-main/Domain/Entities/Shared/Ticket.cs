
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Domain.Entities.Shared
{
    public class Ticket
    {
        [Key]
        public Guid Id { get; set; }
		[Required(ErrorMessage = "Title is required")]
		[MaxLength(255, ErrorMessage = "Chars should be less than 255")]
		[DataType(DataType.Text)]
		public string? Tital { get; set; }
		public bool Status { get; set; }
        public bool IsTicketOpen { get; set; }
        public DateTime CreatedAt { get; set; }
		public string? AppUserId { get; set; }
		[ForeignKey("AppUserId")]
		public AppUser? AppUser { get; set; }
		public List<TicketMessage>? TicketMessage { get; set; }

    }
}
