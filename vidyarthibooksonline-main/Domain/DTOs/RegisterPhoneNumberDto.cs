using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Domain.DTOs
{
    public class RegisterPhoneNumberDto
    {
        
        public string Mobile { get; set; }
        public string Otp { get; set; }
    }
}
