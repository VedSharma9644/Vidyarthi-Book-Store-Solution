using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.Customer
{
    public class PlaceOrderDto
    {
        [Required(ErrorMessage = "Please enter first name")]
        public string FirstName { get; set; }
        [Required(ErrorMessage = "Please enter last name")]
        public string LastName { get; set; }
        [Required(ErrorMessage = "Please enter email")]
        public string Email { get; set; }
        [Required(ErrorMessage = "Please enter phone number")]
        public string Phone { get; set; }
        [Required(ErrorMessage = "Please enter address")]
        public string Address { get; set; }
        [Required(ErrorMessage = "Please enter state")]
        public string State { get; set; }
        [Required(ErrorMessage = "Please enter city")]
        public string City { get; set; }

        [Required(ErrorMessage = "Please enter pincode")]
        public string Pincode { get; set; }
         
        public string PaymentMethod { get; set; }
    }
}
