using DataAccess.Data;
using DataAccess.Repository.CoreRepo.Interface;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.CoreRepo
{
    public class SliderRepo : BaseRepo<SlideBanner>, ISliderRepo
    {
        public SliderRepo(AppDbContext context) : base(context)
        {
        }

    }
    
}
