using Domain.DTOs.Admin;


namespace Domain.DTOs.Customer
{
    public class HomeDto
    {
        public List<BookDto> Books { get; set; }
        public List<SlideBannerDto> Slider { get; set; }
    }
}
