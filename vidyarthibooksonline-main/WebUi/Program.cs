using DataAccess.Data;
using DataAccess.Extensions;
using DataAccess.Extensions.Helper;
using DataAccess.Middleware;
using DataAccess.Repository;
using DataAccess.Repository.Interface;
using DataAccess.Services.CourierService;
using DataAccess.Services.CourierService.Interface;
using DataAccess.Services.PyamentService;
using DataAccess.Services.PyamentService.Interface;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;
using System.Data;
using System.Net.Http.Headers;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container
IConfiguration configuration = new ConfigurationBuilder()
	.SetBasePath(builder.Environment.ContentRootPath)
	.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
	.Build();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));



//Register dapper repository
builder.Services.AddScoped<IDbConnection>(_ =>
    new SqlConnection(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<AppUser, IdentityRole>(options => options.SignIn.RequireConfirmedAccount = false)
	.AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAccountRepo , AccountRepo>();
builder.Services.AddHttpClient<ISmsService, Fast2SmsService>();
builder.Services.AddScoped<IEmailSenderService, EmailSenderService>();
builder.Services.AddScoped<IRazorpayService, RazorpayServices>();
// 1??  Shiprocket named client
builder.Services.AddHttpClient("ShiprocketClient", client =>
{
    client.BaseAddress = new Uri("https://apiv2.shiprocket.in/v1/external/");
    client.DefaultRequestHeaders.Accept
          .Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

// 2??  Shiprocket service itself (scoped ? one per request)
builder.Services.AddScoped<IShiprocketService, ShiprocketService>();
// In Program.cs or Startup.cs
builder.Services.AddMemoryCache();

builder.Services.AddAuthorization(options =>
{
	options.AddPolicy(SD.RolePolicy.Admin, policy => policy.RequireRole(SD.UserRoles.Admin)); // Adjust role name to lowercase
	options.AddPolicy(SD.RolePolicy.Customer, policy => policy.RequireRole(SD.UserRoles.Customer)); // Adjust role name to lowercase
});
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.IsEssential = true; // Ensure the cookie is essential
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // Use Always in production with HTTPS
    options.Cookie.SameSite = SameSiteMode.Lax; // Allows authentication across site navigation
    options.Cookie.SameSite = SameSiteMode.Strict;           // Enforce strict SameSite policy
    options.ExpireTimeSpan = TimeSpan.FromDays(30); // Adjust the expiration time as needed
    options.Cookie.Path = "/"; // Adjust the cookie path if necessary
    options.LoginPath = "/login"; // Replace with your login URL
    options.SlidingExpiration = true;
    options.AccessDeniedPath = "/";

});

string wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
builder.Services.AddScoped<IFilesUploadService>(provider => new FilesUploadService(wwwrootPath));
QuestPDF.Settings.License = LicenseType.Community; // Replace with your license key

builder.Services.AddControllersWithViews()
    .AddRazorOptions(options =>
    {
        options.ViewLocationExpanders.Add(new CustomViewLocationExpander());
    }).AddRazorRuntimeCompilation();
builder.Services.AddRazorPages();
builder.Services.Configure<IdentityOptions>(options =>
{
	options.Password.RequireDigit = false;
	options.Password.RequireLowercase = false;
	options.Password.RequireUppercase = false;
	options.Password.RequireNonAlphanumeric = false;
	options.Password.RequiredLength = 4;
});

builder.Services.AddSession(options =>
{
	options.IdleTimeout = TimeSpan.FromDays(1); // Adjust the timeout as needed
});
builder.Services.AddHttpContextAccessor();

builder.Services.Configure<KestrelServerOptions>(options =>
{
	options.Limits.MaxRequestBodySize = long.MaxValue;
});
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseDeveloperExceptionPage();
}
else
{
	app.UseExceptionHandler("/error");
	app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseSession();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Custom middleware for role-based redirection (after authentication and authorization)
app.UseMiddleware<RedirectAuthenticatedMiddleware>();
app.MapControllerRoute(
  name: "default",
  pattern: "{area=Customer}/{controller=Home}/{action=Index}/{id?}");
app.MapRazorPages();
app.MapControllers();

app.Run();