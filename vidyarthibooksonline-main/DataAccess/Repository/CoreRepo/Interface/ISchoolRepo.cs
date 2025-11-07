using DataAccess.Repository.Interface;
using Domain.DTOs.Customer;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo.Interface
{
    public interface ISchoolRepo : IBaseRepo<School>
    {
        Task<List<SchoolSearchDto>> GetSchools(string search);
    }
}
