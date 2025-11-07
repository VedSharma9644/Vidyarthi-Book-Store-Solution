using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Shared
{
    public class ApiTokenInfo
    {
        [Key]
        public int Id { get; set; }
        public string? AuthToken { get; set; }
        public DateTime Expiration { get; set; }
    }
}
