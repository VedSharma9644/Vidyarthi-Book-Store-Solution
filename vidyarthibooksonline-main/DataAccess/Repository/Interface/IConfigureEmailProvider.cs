

using Domain.Entities.Shared;

namespace DataAccess.Repository.Interface
{
	public interface IConfigureEmailProvider : IBaseRepo<SmtpSetting>
	{
		Task UpdateAsync(SmtpSetting setting);
		Task UpdateStatusAsync(int id ,bool status);
	}
}
