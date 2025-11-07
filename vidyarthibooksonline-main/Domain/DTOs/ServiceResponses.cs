using Domain.Entities.Shared;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public record class ServiceResponses(bool Flag, string Message = null!, string Role = null!, string UserId = null!, AppUser User = null!);
}
