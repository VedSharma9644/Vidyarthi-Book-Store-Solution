using Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Config
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("Orders");

            builder.HasKey(o => o.Id);

            builder.Property(o => o.OrderNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(o => o.OrderTotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();
            builder.Property(s => s.DiscountAmount).HasColumnType("decimal(18,2)");
            builder.Property(s => s.FinalAmount).HasColumnType("decimal(18,2)");
            builder.Property(s => s.ShippingAmount).HasColumnType("decimal(18,2)");
            builder.Property(s => s.TaxAmount).HasColumnType("decimal(18,2)");
            builder.Property(o => o.OrderStatus)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(o => o.PaymentStatus)
                .IsRequired()
                .HasMaxLength(50);

            // Shipping information
            builder.Property(o => o.ShippingName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(o => o.ShippingPhone)
                .IsRequired()
                .HasMaxLength(20);

            // Relationships
            builder.HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(o => o.Coupon)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CouponId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId);
        }
    }
}
