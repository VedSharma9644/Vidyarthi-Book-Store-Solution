using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.Entities.Shared;


namespace DataAccess.Repository
{
	public class ConfigureEmailProviderRepo : BaseRepo<SmtpSetting>, IConfigureEmailProvider
	{
		private readonly AppDbContext _db;

		public ConfigureEmailProviderRepo(AppDbContext db) : base(db)
        {
			_db = db;
		}

		public async Task UpdateAsync(SmtpSetting setting)
		{
			_db.SmtpSettings.Update(setting);
			await _db.SaveChangesAsync();
		}

		public async Task UpdateStatusAsync(int id ,bool status)
		{
			var provider = await _db.SmtpSettings.FindAsync(id);
			if (provider != null)
			{
				provider.IsActive = status;
				await _db.SaveChangesAsync();
			}
			else
			{
				// Handle case where provider with the specified ID is not found
				throw new ArgumentException("Email provider not found.", nameof(id));
			}
		}
	}
}
