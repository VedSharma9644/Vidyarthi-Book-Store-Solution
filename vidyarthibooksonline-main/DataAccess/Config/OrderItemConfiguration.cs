using Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;


namespace DataAccess.Config
{
    public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
    {
        public void Configure(EntityTypeBuilder<OrderItem> builder)
        {
            builder.ToTable("OrderItems");

            builder.HasKey(oi => oi.Id);

            builder.Property(oi => oi.Quantity)
                .IsRequired();

            builder.Property(oi => oi.UnitPrice)
                .HasColumnType("decimal(18,2)");

            builder.Property(oi => oi.TotalPrice)
                .HasColumnType("decimal(18,2)");
             builder.Property(oi => oi.DiscountAmount)
                .HasColumnType("decimal(18,2)");


            // Relationships
            builder.HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(oi => oi.Book)
                .WithMany(b => b.OrderItems)
                .HasForeignKey(oi => oi.BookId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
