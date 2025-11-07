using Domain.Entities.Shared;


namespace Domain.DTOs
{
    public class TicketDTOs
    {
        public Ticket? Ticket { get; set; }
        public TicketMessage? TicketMessage { get; set; }
        public List<Ticket>? Tickets { get; set; }
    }
}
