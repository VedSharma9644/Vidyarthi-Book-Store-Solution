
using System.ComponentModel.DataAnnotations;


namespace Domain.Entities.Shared
{
	public class SmtpSetting : BaseEntities
	{
        [Required(ErrorMessage = "Email Provider is required")]
        public string? EmailProviderName { get; set; }
        [Required(ErrorMessage = "from name is required")]
        public string? FromName { get; set; }
        [Required(ErrorMessage = "from address is required")]
        public string? FromAddress { get; set; }
        [Required(ErrorMessage = "Smtm server is required")]
        public string? SmtpServer { get; set; }
        [Required(ErrorMessage = "Smtp port is required")]
        public int SmtpPort { get; set; }
		public bool UseSmtpAuthentication { get; set; }=false;
        [Required(ErrorMessage = "Smtp username is required")]
        public string? SmtpUsername { get; set; }
        [Required(ErrorMessage = "Smtp password is required")]
        public string? SmtpPassword { get; set; }
		public bool EnableSsl { get; set; }=false;
        public bool IsActive { get; set; } = false;
	}
}
