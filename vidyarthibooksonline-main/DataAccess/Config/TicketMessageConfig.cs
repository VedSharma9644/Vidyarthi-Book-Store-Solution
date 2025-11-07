using Domain.Entities.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace DataAccess.Config
{
    public class TicketMessageConfig : IEntityTypeConfiguration<TicketMessage>
    {
        public void Configure(EntityTypeBuilder<TicketMessage> builder)
        {
            // Configure the relationship with Ticket
            builder.HasOne(tm => tm.Ticket)
                .WithMany(t => t.TicketMessage)  // If Ticket has a collection of TicketMessages
                .HasForeignKey(tm => tm.TicketId)
                .OnDelete(DeleteBehavior.Cascade);  // Enable cascade delete if required

            // Configure the relationship with AppUser
            builder.HasOne(tm => tm.AppUser)
                .WithMany()  // If AppUser has no collection of TicketMessages
                .HasForeignKey(tm => tm.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);  // Enable cascade delete
        }
    }
}
