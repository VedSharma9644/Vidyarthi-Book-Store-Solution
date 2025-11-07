

namespace DataAccess.Repository.Interface
{
    public interface IEmailSenderService
    {
        Task SendEmailAsync(string recipientEmail, string subject, string body, List<string> ccEmails = null!, List<string> bccEmails = null!);
    }
}
