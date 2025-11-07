using DataAccess.Data;
using DataAccess.Repository.Interface;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using System.Security.Authentication;


namespace DataAccess.Repository
{
    public class EmailSenderService : IEmailSenderService
    {
		private readonly AppDbContext _db;

		public EmailSenderService(AppDbContext db)
		{
			_db = db;
		}

		public async Task SendEmailAsync(string recipientEmail, string subject, string body, List<string>? ccEmails = null, List<string>? bccEmails = null)
		{
			// Retrieve SMTP settings from the database
			var smtpSettings = await _db.SmtpSettings
										.Where(x => x.IsActive)
										.OrderBy(x => x.Id) // or any other ordering criteria you want
										.FirstOrDefaultAsync();

			if (smtpSettings == null)
			{
				throw new Exception("SMTP settings not found in the database.");
			}

			var message = new MimeMessage();
			message.From.Add(new MailboxAddress(smtpSettings.FromName, smtpSettings.FromAddress));
			message.To.Add(new MailboxAddress("", recipientEmail));
			message.Subject = subject;

			var bodyBuilder = new BodyBuilder();
			bodyBuilder.HtmlBody = body; // Set the body as HTML

			message.Body = bodyBuilder.ToMessageBody();

			// Add CC email addresses
			if (ccEmails != null)
			{
				foreach (var ccEmail in ccEmails)
				{
					var ccAddress = new MailboxAddress("", ccEmail);
					message.Cc.Add(ccAddress);
				}
			}

			// Add BCC email addresses
			if (bccEmails != null)
			{
				foreach (var bccEmail in bccEmails)
				{
					var bccAddress = new MailboxAddress("", bccEmail); 
					message.Bcc.Add(bccAddress);
				}
			}

			using (var client = new SmtpClient())
			{
				await client.ConnectAsync(smtpSettings.SmtpServer, smtpSettings.SmtpPort, SecureSocketOptions.Auto);

				if (smtpSettings.UseSmtpAuthentication)
				{
					await client.AuthenticateAsync(smtpSettings.SmtpUsername, smtpSettings.SmtpPassword);
				}

				if (smtpSettings.EnableSsl)
				{
					client.SslProtocols = SslProtocols.Tls12;
				}

				await client.SendAsync(message);
				await client.DisconnectAsync(true);
			}
		}
	}
}
