using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.DTOs.ShippingProvider.Shiprocket
{
    public class OrderRequest
    {
        public string order_id { get; set; }

        // Using DateTime to ensure valid date formatting
        public string order_date { get; set; }

        public string pickup_location { get; set; }
        public int channel_id { get; set; }  // Optional field with default value
        public string comment { get; set; }

        // Billing Information
        public string billing_customer_name { get; set; }
        public string billing_last_name { get; set; }
        public string billing_address { get; set; }
        public string billing_address_2 { get; set; }
        public string billing_city { get; set; }
        public string billing_pincode { get; set; }
        public string billing_state { get; set; }
        public string billing_country { get; set; }
        public string billing_email { get; set; }
        public string billing_phone { get; set; }

        // Shipping Information
        public bool shipping_is_billing { get; set; }
        public string shipping_customer_name { get; set; } = string.Empty; // Optional field
        public string shipping_last_name { get; set; } = string.Empty;    // Optional field
        public string shipping_address { get; set; } = string.Empty;     // Optional field
        public string shipping_address_2 { get; set; } = string.Empty;    // Optional field
        public string shipping_city { get; set; } = string.Empty;        // Optional field
        public string shipping_pincode { get; set; }      // Optional field
        public string shipping_country { get; set; } = string.Empty;     // Optional field
        public string shipping_state { get; set; } = string.Empty;       // Optional field
        public string shipping_email { get; set; } = string.Empty;       // Optional field
        public string shipping_phone { get; set; }       // Optional field

        // Order Items
        public List<OrderItemApi> order_items { get; set; }

        public string payment_method { get; set; }
        public int shipping_charges { get; set; }
        public int giftwrap_charges { get; set; }
        public int transaction_charges { get; set; }
        public int total_discount { get; set; }
        public int sub_total { get; set; }

        // Package Dimensions
        public float length { get; set; }
        public float breadth { get; set; }
        public float height { get; set; }
        public float weight { get; set; }
    }

    public class OrderItemApi
    {
        public string? name { get; set; }
        public string sku { get; set; }
        public int units { get; set; }

        public int selling_price { get; set; }
        public int discount { get; set; }  // Nullable, since discount may be absent
        public int tax { get; set; }      // Nullable, since tax may be absent
        public int hsn { get; set; }
    }
}
