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
    public class BookConfiguration : IEntityTypeConfiguration<Book>
    {
        public void Configure(EntityTypeBuilder<Book> builder)
        {
            builder.ToTable("Books");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(b => b.Author)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(b => b.Publisher)
                .HasMaxLength(100);

            builder.Property(b => b.ISBN)
                .HasMaxLength(20);

            builder.Property(b => b.Description)
                .HasMaxLength(2000);

            builder.Property(b => b.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(b => b.DiscountPrice)
                .HasColumnType("decimal(18,2)");

            builder.Property(b => b.StockQuantity)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(b => b.CoverImageUrl)
                .HasMaxLength(500);

            builder.Property(b => b.BookType)
                .HasMaxLength(50);

            builder.Property(b => b.IsFeatured)
                .HasDefaultValue(false);

            // Relationships
            builder.HasOne(b => b.Category)
                .WithMany(c => c.Books)
                .HasForeignKey(b => b.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

           
        }
    }
}
