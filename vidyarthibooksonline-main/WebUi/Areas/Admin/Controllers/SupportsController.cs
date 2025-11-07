using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace estentick.Areas.Admin.Controllers
{
	[Area("Admin")]
	[Authorize(policy: "AdminOnly")]
	public class SupportsController : Controller
	{
        private readonly IUnitOfWork _unitOfWork;
		private readonly UserManager<AppUser> _userManager;

		public SupportsController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager)
        {
            _unitOfWork = unitOfWork;
			_userManager = userManager;
		}

        [Route("admin/tickets-list")]
        public async Task<IActionResult> Index()
        {
            
            var data = await _unitOfWork.SupportsTicket.GetAll(null!);
            return View(data);
        }

        [Route("admin/views-tickets")]
        public async Task<IActionResult> ViewTickets(Guid id)
        {
            var data = await _unitOfWork.SupportsTicket.ViewTickets(id);
            return View(data);
        }

        [HttpPost]
        [Route("admin/add-message")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReplyOnTickets(TicketDTOs dTOs)
        {
            var ticketId = dTOs.Ticket!.Id;
            var loginUser = await _userManager.GetUserAsync(User);
            var result = await _unitOfWork.SupportsTicket.AddTicketMessage(dTOs.TicketMessage!, ticketId, loginUser!.Id);
            if (result)
            {
                TempData["success"] = "Message Added Successfully";
                return RedirectToAction("ViewTickets", new { id = ticketId });
            }
            else
            {
                TempData["error"] = "Something went wrong";
                return RedirectToAction("ViewTickets", new { id = ticketId });
            }
        }

        [HttpPost]
        [Route("admin/closetickets")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CloseTicket(Guid id)
        {
            try
            {
                bool result = await _unitOfWork.SupportsTicket.CloseTickets(id);
                if (result)
                {
                    TempData["success"] = "Ticket has been closed successfully";
                    return RedirectToAction(nameof(Index));
                }
            }
            catch (Exception)
            {
                TempData["error"] = "error while colosing ticket please try again later";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [Route("admin/deletetickets")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteTicket(Guid id)
        {
            try
            {
                bool result = await _unitOfWork.SupportsTicket.DeleteTickets(id);
                if (result)
                {
                    TempData["success"] = "Ticket has been Deleted successfully";
                    return RedirectToAction(nameof(Index));
                }
            }
            catch (Exception)
            {
                TempData["error"] = "error while deleting ticket please try again later";
            }
            return RedirectToAction(nameof(Index));
        }
    }
}
