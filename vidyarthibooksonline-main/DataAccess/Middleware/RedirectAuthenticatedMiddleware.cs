using Domain.Entities.Shared;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System.Linq;
using System.Threading.Tasks;

namespace DataAccess.Middleware
{
    public class RedirectAuthenticatedMiddleware
    {
        private readonly RequestDelegate _next;

        public RedirectAuthenticatedMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            // Skip middleware for API routes
            if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Check if the user is authenticated
            if (context.User.Identity?.IsAuthenticated == true)
            {
                // Validate security stamp
                var securityStampClaim = context.User.Claims
                    .FirstOrDefault(c => c.Type == "AspNet.Identity.SecurityStamp");

                if (string.IsNullOrEmpty(securityStampClaim?.Value))
                {
                    await context.SignOutAsync();
                    context.Response.Redirect("/login");
                    return;
                }

                // Handle redirects for authenticated users accessing the root/login page
                if (context.Request.Path.Equals("/") ||
                    context.Request.Path.Equals("/login", StringComparison.OrdinalIgnoreCase))
                {
                    var userRoles = context.User.Claims
                        .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                        .Select(c => c.Value)
                        .ToList();

                    // Get the most privileged role if multiple exist
                    var redirectPath = GetRedirectPath(userRoles);

                    // Prevent redirect loops
                    if (!context.Request.Path.Equals(redirectPath, StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.Redirect(redirectPath);
                        return;
                    }
                }
            }

            await _next(context);
        }

        private string GetRedirectPath(IEnumerable<string> roles)
        {
            // Order of checks matters - most privileged role first
            if (roles.Contains(SD.UserRoles.Admin))
                return SD.RedirectUrl.Admin;

            if (roles.Contains(SD.UserRoles.Customer))
                return SD.RedirectUrl.Customer;

            // Default fallback
            return "/";
        }
    }
}