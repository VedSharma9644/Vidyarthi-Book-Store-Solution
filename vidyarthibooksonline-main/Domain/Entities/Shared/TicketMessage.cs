
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Entities.Shared
{
	public class TicketMessage
	{
		[Key]
        public Guid Id { get; set; }
		[Required(ErrorMessage = "Message is required")]
		[MaxLength(2000, ErrorMessage = "Chars should be less than 2000")]
		[DataType(DataType.Text)]
		public string? Message { get; set; }
		public DateTime RegisterDateTime { get; set; }
        public bool Status { get; set; }        
		public Guid? TicketId { get; set; }
		[ForeignKey("TicketId")]
		public Ticket? Ticket { get; set; }
		public string? AppUserId { get; set; }
		[ForeignKey("AppUserId")]
		public AppUser? AppUser { get; set; }
	}
}
