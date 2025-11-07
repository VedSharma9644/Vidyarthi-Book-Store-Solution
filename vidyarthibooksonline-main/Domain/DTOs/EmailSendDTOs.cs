
using System.ComponentModel.DataAnnotations;


namespace Domain.DTOs
{
	public class EmailSendDTOs
	{
		[Required(ErrorMessage = "Recipient email address is required.")]
		public string? ToEmail { get; set; }

		public string? ToCc { get; set; }

		public string? ToBcc { get; set; }

		[Required(ErrorMessage = "Email subject is required.")]
		public string? Subject { get; set; }

		[Required(ErrorMessage = "Email message body is required.")]
		public string? Message { get; set; }
	}
}
