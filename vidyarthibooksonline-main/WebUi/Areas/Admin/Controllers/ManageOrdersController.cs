using DataAccess.Data;
using DataAccess.Extensions.Helper;
using DataAccess.Repository.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;

namespace WebUi.Areas.Admin.Controllers
{
    public class ManageOrdersController : BaseAdminController
    {
        private readonly AppDbContext _context;
        public ManageOrdersController(IUnitOfWork unitOfWork,
                                      UserManager<AppUser> userManager = null!,
                                      AppDbContext context = null!)
                                     : base(unitOfWork, userManager)
        {
            _context = context;
        }

        [Route("get-all-orders")]
        public async Task<IActionResult> Index()
        {
            var orders = await _unitOfWork.Orders.GetAllOrder();

            return View(orders);
        }

        [Route("get-order-details")]
        public async Task<IActionResult> OrderDetails(int orderId)
        {
            var order = await _unitOfWork.Orders.GetOrderWithItemsAsync(orderId);

            if (order == null)
                return NotFound();

            return View(order);
        }

        [HttpPost]
        [Route("update-order-status")]
        public async Task<IActionResult> UpdateOrderStatus(int orderId, string newStatus)
        {
            var order = await _unitOfWork.Orders.GetFirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
                return Json(new { success = false, message = "Order not found" });

            order.OrderStatus = newStatus;
            await _unitOfWork.SaveAsync();

            return Json(new { success = true, message = "Order status updated successfully",redirectUrl=Url.Action(nameof(OrderDetails), new { orderId }) });
        }

        //Create Shiprocket order
        [HttpPost]
        [Route("create-shiprocket-order")]
        public async Task<IActionResult> CreateShiprocketOrder(int orderId)
        {
            var order = await _unitOfWork.Orders.GetFirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
                return Json(new { success = false, message = "Order not found" });

            await _unitOfWork.Orders.CreateShiprocketOrderAsync(order);
            
            return Json(new { success = true, message = "Order  updated successfully", redirectUrl = Url.Action(nameof(OrderDetails), new { orderId }) });
        }

        //Generate invoice
        [Route("orders/generate-invoice")]
        public async Task<IActionResult> GenerateInvoice(int orderId)
        {
            var order = await _unitOfWork.Orders.GetOrderWithItemsAsync(orderId);

            if (order == null)
                return NotFound();

            var document = new InvoiceDocument(order);
            var pdfBytes = document.GeneratePdf();

            return File(pdfBytes, "application/pdf", $"Invoice_Order_{order.OrderNumber}.pdf");
        }

        // Integrate shiprocket api


    }
}
