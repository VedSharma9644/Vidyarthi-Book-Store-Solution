using Domain.DTOs.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface IDashboardRepo
    {
        Task<AdminDashboardDto> GetAdminDashboard();
    }
}
