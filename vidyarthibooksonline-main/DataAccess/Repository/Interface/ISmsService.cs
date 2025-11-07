
namespace DataAccess.Repository.Interface
{
	public interface ISmsService
	{
		Task<bool> SendOtpAsync(string phoneNumber, string otp);
		string GenerateOtp();

		

        Task<bool> SendOtp2fAsync(string phoneNumber, string templateName = "OTP1");
    }
}
