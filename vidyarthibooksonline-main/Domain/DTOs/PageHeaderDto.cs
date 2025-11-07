using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public class PageHeaderDto
    {
        public string Title { get; set; }
        public List<Breadcrumb> Breadcrumbs { get; set; }
    }

    public class Breadcrumb
    {
        public string Text { get; set; }
        public string Url { get; set; }
        public bool IsActive { get; set; }
    }
}
