using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities;

namespace DataAccess.Config
{
    public class GradeConfiguration : IEntityTypeConfiguration<Grade>
    {
        public void Configure(EntityTypeBuilder<Grade> builder)
        {
          
          
            builder.Property(g => g.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(g => g.DisplayOrder)
                .IsRequired();

            builder.Property(g => g.IsActive)
                .HasDefaultValue(true);

            // Relationship with School
            builder.HasOne(g => g.School)
                .WithMany(s => s.Grades)
                .HasForeignKey(g => g.SchoolId)
                .OnDelete(DeleteBehavior.Cascade);

          
        }
    }
}
