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
    public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
    {
        public void Configure(EntityTypeBuilder<Coupon> builder)
        {
            builder.ToTable("Coupons");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.DiscountAmount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();
            builder.Property(m =>m.MinimumPurchaseAmount).HasColumnType("decimal(18,2)");

            builder.Property(c => c.DiscountType)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(c => c.IsActive)
                .HasDefaultValue(true);

            // Relationships
            builder.HasMany(c => c.Orders)
                .WithOne(o => o.Coupon)
                .HasForeignKey(o => o.CouponId);
        }
    }
}
