using Domain.Entities.Shared;


namespace Domain.Entities
{
	public class MembersOtp : BaseEntities
    {
        public string? MobileNumber { get; set; }
		public string? OTP { get; set; }
		public DateTime ExpiryDateTime { get; set; }
        public MembersOtp()
        {
            ExpiryDateTime = DateTime.Now.AddMinutes(5);
        }
    }
}
