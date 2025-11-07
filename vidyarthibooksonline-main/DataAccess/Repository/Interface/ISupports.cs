using Domain.DTOs;
using Domain.Entities.Shared;

namespace DataAccess.Repository.Interface
{
    public interface ISupports : IBaseRepo<Ticket>
	{
		Task<IEnumerable<Ticket>> GetAll(string userId = null!);
		Task<TicketDTOs> ViewTickets(Guid id);
		Task<bool> AddTicketMessage(TicketMessage ticketMessage, Guid ticketId, string userId = null!);
		Task<TicketDTOs> AddNewTicket(TicketDTOs ticketDTO, string userId = null!);
		Task<bool> DeleteTickets(Guid id);
		Task<bool> CloseTickets(Guid id);
	}
}
