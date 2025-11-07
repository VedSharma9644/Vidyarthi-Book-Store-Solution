using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;


namespace DataAccess.Repository
{
	public class SupportRepo : BaseRepo<Ticket>, ISupports
	{
		private readonly AppDbContext _db;

		public SupportRepo(AppDbContext db) : base(db)
		{
			_db = db;
		}

		public async Task<TicketDTOs> AddNewTicket(TicketDTOs ticketDTO, string userId)
		{
			if (ticketDTO?.Ticket == null || ticketDTO.TicketMessage == null)
			{
				throw new ArgumentException("Ticket and TicketMessage cannot be null");
			}

			Ticket ticket = new Ticket
			{
				Tital = ticketDTO.Ticket.Tital,
				Status = true,
				IsTicketOpen = true,
				AppUserId = userId,
				CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"))
			};

			await _db.Tickets.AddAsync(ticket);
			await _db.SaveChangesAsync(); // Save changes to get the ticket ID

			TicketMessage ticketMessage = new TicketMessage
			{
				Message = ticketDTO.TicketMessage.Message,
				RegisterDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time")),
				Status = true,
				AppUserId = userId,
				TicketId = ticket.Id
			};

			await _db.TicketMessages.AddAsync(ticketMessage);
			await _db.SaveChangesAsync();

			return ticketDTO;
		}

		public async Task<bool> AddTicketMessage(TicketMessage ticketMessage, Guid ticketId, string userId)
		{
			if (ticketMessage == null)
			{
				throw new ArgumentException("TicketMessage cannot be null");
			}

			TicketMessage newMessage = new TicketMessage
			{
				TicketId = ticketId,
				Status = true,
				RegisterDateTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.FindSystemTimeZoneById("India Standard Time")),
				Message = ticketMessage.Message,
				AppUserId = userId
			};

			await _db.TicketMessages.AddAsync(newMessage);
			await _db.SaveChangesAsync();

			return true;
		}

        public async Task<bool> CloseTickets(Guid id)
        {
            var ticket = await _db.Tickets.FirstOrDefaultAsync(s => s.Id == id);
			if (ticket != null)
			{
				ticket.Status = false;
				ticket.IsTicketOpen = false;
				_db.Tickets.Update(ticket);
				await _db.SaveChangesAsync();
				return true;
			}
			else
			{
				return false;
			}
        }

        public async Task<bool> DeleteTickets(Guid id)
        {
            var ticket = await _db.Tickets.FirstOrDefaultAsync(s => s.Id == id);
            if (ticket != null)
            {
                _db.Tickets.Remove(ticket);
                var tickets = _db.TicketMessages.Where(s => s.TicketId == ticket.Id).ToList();
                _db.TicketMessages.RemoveRange(tickets);
                await _db.SaveChangesAsync();
				return true;
            }
			else
			{
				return false;
			}
        }

        public async Task<IEnumerable<Ticket>> GetAll(string userId)
		{
			return await _db.Tickets
				.Where(t => t.AppUserId == userId || t.AppUserId !=userId)
				.Include(t => t.AppUser)
				.Include(t => t.TicketMessage)
				.ToListAsync();
		}

		public async Task<TicketDTOs> ViewTickets(Guid id)
		{
			var ticket = await _db.Tickets
				.Include(t => t.AppUser)
				.Include(t => t.TicketMessage!)
				.ThenInclude(tm => tm.AppUser)
				.FirstOrDefaultAsync(t => t.Id == id);

			if (ticket == null)
			{
				throw new KeyNotFoundException("Ticket not found");
			}

			return new TicketDTOs
			{
				Ticket = ticket,
				TicketMessage = new TicketMessage()
			};
		}
	}
}
