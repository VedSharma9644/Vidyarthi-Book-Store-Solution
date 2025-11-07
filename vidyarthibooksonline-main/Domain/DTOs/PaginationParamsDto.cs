using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public class PaginationParamsDto
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SearchQuery { get; set; } = string.Empty;
        public string SortColumn { get; set; } = "Id"; // Default sort by Id
        public string SortOrder { get; set; } = "asc"; // Default ascending sort                                         

        // Optional parameters for filtering by UserId and Transaction Type
        public string? UserId { get; set; } // Optional UserId
        public string? TransType { get; set; } // Optional Transaction Type
        public int EntityId { get; set; }
    }
}
