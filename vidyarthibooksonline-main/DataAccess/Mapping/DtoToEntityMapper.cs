using Domain.DTOs.Admin;
using Domain.DTOs.Customer;
using Domain.Entities;
using static Dapper.SqlMapper;


namespace DataAccess.Mapping
{
    public static class DtoToEntityMapper
    {
        // Book Mappings
        public static Book MapToEntity(BookDto dto)
        {
            return new Book
            {
                Id = dto.Id,
                Title = dto.Title,
                Author = dto.Author,
                Publisher = dto.Publisher,
                ISBN = dto.ISBN,
                Description = dto.Description,
                Price = dto.Price,
                DiscountPrice = dto.DiscountPrice,
                StockQuantity = dto.StockQuantity,
                CoverImageUrl = dto.CoverImageUrl,
              
                BookType = dto.BookType,
                CategoryId = dto.CategoryId,
                Category = dto.Category
            };
        }

        public static BookDto MapToDto(Book entity)
        {
            return new BookDto
            {
                Id = entity.Id,
                Title = entity.Title!,
                Author = entity.Author!,
                Publisher = entity.Publisher!,
                ISBN = entity.ISBN!,
                Description = entity.Description!,
                Price = entity.Price,
                DiscountPrice = entity.DiscountPrice,
                StockQuantity = entity.StockQuantity,
                CoverImageUrl = entity.CoverImageUrl,
              
                BookType = entity.BookType!,
                CategoryId = entity.CategoryId,
                Category = entity.Category,
                // New: Populate SchoolName and Branch from navigation properties
                SchoolName = entity.Category?.Grade?.School?.Name,
                SchoolBranch = entity.Category?.Grade?.School?.BranchName
            };
        }
        public static List<BookDto> MapToDtoList(List<Book> entities)
        {
            return entities.Select(MapToDto).ToList();
        }

        public static List<Book> MapToEntityList(List<BookDto> dtos)
        {
            return dtos.Select(MapToEntity).ToList();
        }
        // Coupon Mappings
        public static Coupon MapToEntity(CouponDto dto)
        {
            return new Coupon
            {
                Id = dto.Id,
                Code = dto.Code,
                Description = dto.Description,
                DiscountAmount = dto.DiscountAmount,
                DiscountType = dto.DiscountType,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                UsedCount = dto.UsedCount,
                IsActive = dto.IsActive,
                MinimumPurchaseAmount = dto.MinimumPurchaseAmount
            };
        }

        public static CouponDto MapToDto(Coupon entity)
        {
            return new CouponDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Description = entity.Description,
                DiscountAmount = entity.DiscountAmount,
                DiscountType = entity.DiscountType,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate,
                UsageLimit = entity.UsageLimit,
                UsedCount = entity.UsedCount,
                IsActive = entity.IsActive,
                MinimumPurchaseAmount = entity.MinimumPurchaseAmount
            };
        }
        // School Mappings
        public static School MapToEntity(SchoolDto dto)
        {
            return new School
            {
                Id = dto.Id,
                Name = dto.Name,
                BranchName = dto.BranchName,
                Code = dto.Code,
                Board = dto.Board,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                SchoolLogo = dto.SchoolLogo
            };
        }

        public static SchoolDto MapToDto(School entity)
        {
            return new SchoolDto
            {
                Id = entity.Id,
                Name = entity.Name!,
                BranchName = entity.BranchName!,
                Code = entity.Code!,
                Board = entity.Board!,
                Address = entity.Address!,
                City = entity.City!,
                State = entity.State!,
                PhoneNumber = entity.PhoneNumber!,
                Email = entity.Email!,
                SchoolLogo = entity.SchoolLogo
            };
        }

        // Cart
        public static Cart MapToEntity(CartDto dto) => new()
        {
            Id = dto.Id,
            UserId = dto.UserId,
            CartItems = dto.CartItems.Select(MapToEntity).ToList()
        };

        public static CartDto MapToDto(Cart entity) => new()
        {
            Id = entity.Id,
            UserId = entity.UserId,
            CartItems = entity.CartItems?.Select(MapToDto).ToList()!
        };
        // CartItem
        public static CartItem MapToEntity(CartItemDto dto) => new()
        {
            Id = dto.Id,
            Quantity = dto.Quantity,
            CartId = dto.CartId,
            BookId = dto.BookId
        };

        public static CartItemDto MapToDto(CartItem entity) => new()
        {
            Id = entity.Id,
            Quantity = entity.Quantity,
            CartId = entity.CartId,
            BookId = entity.BookId
        };
        // Category
        public static Category MapToEntity(CategoryDto dto) => new()
        {
            Id = dto.Id,
            Name = dto.Name,
            Description = dto.Description,
            GradeId = dto.GradeId
        };

        public static CategoryDto MapToDto(Category entity) => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            GradeId = entity.GradeId
        };

        // Grade
        public static GradeDto MapToDto(Grade entity) => new()
        {
            Id = entity.Id,
            Name = entity.Name,
            SchoolId = entity.SchoolId,
            School = entity.School! // Assuming navigation property is loaded via Include
        };

        public static Grade MapToEntity(GradeDto dto) => new()
        {
            Id = dto.Id,
            Name = dto.Name,
            SchoolId = dto.SchoolId,
            School = dto.School // Optional, EF usually uses SchoolId only
        };


        // Order
        public static Order MapToEntity(OrderDto dto) => new()
        {
            Id = dto.Id,
            OrderNumber = dto.OrderNumber,
            OrderDate = dto.OrderDate,
            OrderTotal = dto.OrderTotal,
            DiscountAmount = dto.DiscountAmount,
            TaxAmount = dto.TaxAmount,
            ShippingAmount = dto.ShippingAmount,
            FinalAmount = dto.FinalAmount,
            OrderStatus = dto.OrderStatus,
            PaymentStatus = dto.PaymentStatus,
            PaymentMethod = dto.PaymentMethod,
            ShippingName = dto.ShippingName,
            ShippingPhone = dto.ShippingPhone,
            ShippingAddress = dto.ShippingAddress,
            ShippingCity = dto.ShippingCity,
            ShippingState = dto.ShippingState,
            ShippingPostalCode = dto.ShippingPostalCode,
            ShippingCountry = dto.ShippingCountry,
            UserId = dto.UserId,
            CouponId = dto.CouponId,
            OrderItems = dto.OrderItems.Select(MapToEntity).ToList()
        };

        public static OrderDto MapToDto(Order entity) => new()
        {
            Id = entity.Id,
            OrderNumber = entity.OrderNumber,
            OrderDate = entity.OrderDate,
            OrderTotal = entity.OrderTotal,
            DiscountAmount = entity.DiscountAmount,
            TaxAmount = entity.TaxAmount,
            ShippingAmount = entity.ShippingAmount,
            FinalAmount = entity.FinalAmount,
            OrderStatus = entity.OrderStatus,
            PaymentStatus = entity.PaymentStatus,
            PaymentMethod = entity.PaymentMethod,
            ShippingName = entity.ShippingName,
            ShippingPhone = entity.ShippingPhone,
            ShippingAddress = entity.ShippingAddress,
            ShippingCity = entity.ShippingCity,
            ShippingState = entity.ShippingState,
            ShippingPostalCode = entity.ShippingPostalCode,
            ShippingCountry = entity.ShippingCountry,
            UserId = entity.UserId,
            CouponId = entity.CouponId,
            OrderItems = entity.OrderItems?.Select(MapToDto).ToList()!
        };

        // OrderItem
        public static OrderItem MapToEntity(OrderItemDto dto) => new()
        {
            Id = dto.Id,
            OrderId = dto.OrderId,
            BookId = dto.BookId,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice
        };

        public static OrderItemDto MapToDto(OrderItem entity) => new()
        {
            Id = entity.Id,
            OrderId = entity.OrderId,
            BookId = entity.BookId,
            Quantity = entity.Quantity,
            UnitPrice = entity.UnitPrice
        };

        // SlideBanner Mapping

        public static SlideBanner MapToEntity(SlideBannerDto dto) => new()
        {
            Id = dto.Id,
            Title = dto.Title,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            RedirectUrl = dto.RedirectUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate
        };
        public static SlideBannerDto MapToDto(SlideBanner entity)
        {
            return new SlideBannerDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                ImageUrl = entity.ImageUrl,
                RedirectUrl = entity.RedirectUrl,
                DisplayOrder = entity.DisplayOrder,
                IsActive = entity.IsActive,
                StartDate = entity.StartDate,
                EndDate = entity.EndDate
            };
        }

        
    }
}
