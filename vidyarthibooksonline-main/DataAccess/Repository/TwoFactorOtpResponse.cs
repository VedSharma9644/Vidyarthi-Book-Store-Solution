using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository
{
    public class TwoFactorOtpResponse
    {
        public string Status { get; set; }
        public string Details { get; set; } // This is usually the session ID
    }
}
