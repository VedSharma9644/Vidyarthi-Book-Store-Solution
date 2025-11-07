using Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DataAccess.Extensions.Helper
{
    public class InvoiceDocument : IDocument
    {
        private readonly Order _order;

        public InvoiceDocument(Order order)
        {
            _order = order;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            // Download logo image bytes once (do this outside Compose if possible)
            var logoBytes = DownloadImage("https://vidyarthibooksonline.com/images/logo.png");
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(12));

                // Header with logo left and order date right
                page.Header()
                    .Row(row =>
                    {
                        row.ConstantColumn(100).Height(50).Image(logoBytes, ImageScaling.FitHeight);
                        row.RelativeColumn().AlignCenter().Text($"Invoice - Order #{_order.OrderNumber}")
                            .SemiBold().FontSize(22).FontColor(Colors.Blue.Medium);
                        row.ConstantColumn(100).AlignRight().Text($"Date: {_order.OrderDate:dd MMM yyyy}")
                            .FontSize(12).FontColor(Colors.Grey.Darken1);
                    });

                page.Content()
                    .Column(col =>
                    {
                        col.Spacing(10);

                        col.Item().PaddingTop(15).Text($"Customer: {_order.ShippingName}");

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);   // #
                                columns.RelativeColumn();     // Product
                                columns.ConstantColumn(50);   // Qty
                                columns.ConstantColumn(80);   // Price
                                columns.ConstantColumn(80);   // Total
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(CellStyleHeader).Text("#");
                                header.Cell().Element(CellStyleHeader).Text("Product");
                                header.Cell().Element(CellStyleHeader).AlignCenter().Text("Qty");
                                header.Cell().Element(CellStyleHeader).AlignRight().Text("Price");
                                header.Cell().Element(CellStyleHeader).AlignRight().Text("Total");
                            });

                            int i = 1;
                            foreach (var item in _order.OrderItems)
                            {
                                table.Cell().Element(CellStyleBody).Text(i++.ToString());
                                table.Cell().Element(CellStyleBody).Text(txt => txt.Span(item.Book.Title).WrapAnywhere());
                                table.Cell().Element(CellStyleBody).AlignCenter().Text(item.Quantity.ToString());
                                table.Cell().Element(CellStyleBody).AlignRight().Text(item.UnitPrice.ToString("c", new System.Globalization.CultureInfo("en-IN")));
                                table.Cell().Element(CellStyleBody).AlignRight().Text((item.Quantity * item.UnitPrice).ToString("c", new System.Globalization.CultureInfo("en-IN")));
                            }

                            IContainer CellStyleHeader(IContainer container) =>
                                container.Padding(5).Background(Colors.Grey.Lighten2).BorderBottom(1).BorderColor(Colors.Grey.Medium);

                            IContainer CellStyleBody(IContainer container) =>
                                container.Padding(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                        });

                        // Total with authorized signatory line below
                        // Modified section for total and shipping address
                        col.Item().PaddingTop(40)
                            .Row(row =>
                            {
                                // Shipping address on the left
                                row.RelativeColumn().PaddingRight(20)
                                    .Text(text =>
                                    {
                                        text.Line("Shipping Address:").SemiBold();
                                        text.Line(_order.ShippingAddress);
                                        text.Line($"{_order.ShippingCity} - {_order.ShippingPostalCode}");
                                    });

                                // Total and signatory on the right
                                row.ConstantColumn(200)
                                    .Column(c =>
                                    {
                                        c.Item().AlignRight()
                                            .Text($"Order Total: {_order.FinalAmount.ToString("c", new System.Globalization.CultureInfo("en-IN"))}")
                                            .SemiBold();

                                        c.Item().PaddingTop(30).LineHorizontal(1).LineColor(Colors.Grey.Darken1);

                                        c.Item().Text("Authorized Signatory").Italic().FontSize(10).AlignCenter();
                                    });
                            });
                    });

                page.Footer()
                    .AlignCenter()
                    .Column(col =>
                    {
                        col.Spacing(5);
                        col.Item().Text("Thank you for your purchase!").Italic();
                        col.Item().Text("Visit us at https://vidyarthibooksonline.com/")
                            .FontSize(10).FontColor(Colors.Grey.Medium);
                    });
            });
        }

        // Helper method to download image bytes from URL
        private static byte[] DownloadImage(string url)
        {
            using var httpClient = new HttpClient();
            var imageBytes = httpClient.GetByteArrayAsync(url).Result; // or use async if you want
            return imageBytes;
        }
    }
}
