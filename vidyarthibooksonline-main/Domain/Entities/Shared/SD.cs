using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Shared
{
    public static class SD
    {
        // Order Status Constants
        public static class OrderStatus
        {
            public const string Pending = "Pending";
            public const string Processing = "Processing";
            public const string Shipped = "Shipped";
            public const string Delivered = "Delivered";
            public const string Cancelled = "Cancelled";
            public const string Refunded = "Refunded";
           
        }

        // Payment Status Constants
        public static class PaymentStatus
        {
            public const string Pending = "Pending";
            public const string Paid = "Paid";
            public const string Failed = "Failed";
            public const string Refunded = "Refunded";
            public const string PartiallyRefunded = "Partially Refunded";
        }

        // Payment Method Constants
        public static class PaymentMethod
        {
            public const string CashOnDelivery = "Cash On Delivery";
            public const string CreditCard = "Credit Card";
            public const string DebitCard = "Debit Card";
            public const string NetBanking = "Net Banking";
            public const string UPI = "UPI";
            public const string Wallet = "Wallet";
        }

        // User Roles
        public static class UserRoles
        {
            public const string Admin = "Admin";
            public const string Customer = "Customer";
            public const string SchoolAdmin = "SchoolAdmin"; // For bulk school orders
            public const string ContentManager = "ContentManager"; // Manages book listings
            public const string SuperAdmin = "SuperAdmin";
        }

        public static class RedirectUrl
        {
            public const string Admin = "/admin-dashboard";
            public const string Customer = "/";
        }

        // App Area
        public static class AppArea
        {
            public const string Admin = "Admin";
            public const string Customer = "Customer";
            public const string Auth = "Auth";
           
        }

        // User Roles
        public static class RolePolicy
        {
            public const string Admin = "AdminOnly";
            public const string Customer = "CustomerOnly";
        }

        // Book Status
        public static class BookStatus
        {
            public const string Available = "Available";
            public const string OutOfStock = "Out of Stock";
            public const string Discontinued = "Discontinued";
            public const string PreOrder = "Pre-Order";
        }

        // Review Status
        public static class ReviewStatus
        {
            public const string Pending = "Pending";
            public const string Approved = "Approved";
            public const string Rejected = "Rejected";
        }

        // Discount Types
        public static class DiscountType
        {
            public const string Percentage = "Percentage";
            public const string FixedAmount = "Fixed Amount";
            public const string FreeShipping = "Free Shipping";
        }

        // Shipping Types
        public static class ShippingType
        {
            public const string Standard = "Standard";
            public const string Express = "Express";
            public const string SchoolDelivery = "School Delivery"; // Bulk delivery to schools
        }

        // School Types (for potential school accounts)
        public static class SchoolType
        {
            public const string Government = "Government";
            public const string Private = "Private";
            public const string International = "International";
            public const string CBSE = "CBSE";
            public const string ICSE = "ICSE";
            public const string StateBoard = "State Board";
        }

        // Standard/Class Names (1-12)
        public static class Standard
        {
            public const string Class1 = "Class 1";
            public const string Class2 = "Class 2";
            // ... up to Class 12
            public const string Class12 = "Class 12";
        }

        // Common Status
        public static class Status
        {
            public const string Active = "Active";
            public const string Inactive = "Inactive";
            public const string Draft = "Draft";
            public const string Published = "Published";
            public const string Pending = "Pending";
            public const string Approved = "Approved";
            public const string Rejected = "Rejected";
            public const string Completed = "Completed";
            public const string Cancelled = "Cancelled";
            public const string Failed = "Failed";
            public const string PendingPayment = "Pending Payment";
            public const string Processing = "Processing";
            public const string Shipped = "Shipped";
            public const string Delivered = "Delivered";
            public const string Refunded = "Refunded";
        }

        // Supported payment Gateway
        public static class PaymentGateways
        {
            public const string Razorpay = "Razorpay";
            public const string Stripe = "Stripe";
            public const string PhonePe = "Phonepe";
            public const string CashFree = "Cashfree";
            public const string Paypal = "Paypal";
        }

        //return policy types
        public static class ReturnPolicyTypes
        {
            public const string Exchange = "Exchange";
            public const string Refund = "Refund";
        }

        //return days types
        public static class ReturnDaysTypes
        {
            public const string TwoDays = "2 Days";
            public const string ThreeDays = "3 Days";
            public const string FiveDays = "5 Days";
            public const string SevenDays = "7 Days";
            public const string OneWeeks = "1 Weeks";
            public const string OneMonths = "1 Months";
        }


        //supported shipping providers
        public static class ShippingProviders
        {
            public const string ShipRocket = "Shiprocket";
            public const string DHL = "DHL";
            public const string UPS = "UPS";
            public const string FedEx = "FedEx";
            public const string USPS = "USPS";
            public const string IndiaPost = "Indiapost";
        }

        //Supported currencies
        public static class Currencies
        {
            public const string INR = "INR";
            public const string USD = "USD";
            public const string EUR = "EUR";
            public const string GBP = "GBP";
            public const string JPY = "JPY";
            public const string CNY = "CNY";
        }

    }
}