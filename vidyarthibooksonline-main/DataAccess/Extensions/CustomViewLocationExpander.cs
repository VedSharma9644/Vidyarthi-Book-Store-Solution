using Microsoft.AspNetCore.Mvc.Razor;

namespace DataAccess.Extensions
{
    public class CustomViewLocationExpander : IViewLocationExpander
    {
        public void PopulateValues(ViewLocationExpanderContext context)
        {
            // No custom values needed
        }

        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            var customLocations = new[]
            {
                "/Views/Shared/Component/{0}.cshtml",          // Main Shared Component folder
                "/Areas/{2}/Views/Shared/{0}.cshtml",          // Shared folder in area views
                "/Areas/{2}/Views/{1}/{0}.cshtml",             // Area-specific views
                "/Views/{1}/{0}.cshtml"                        // Main views folder
            };

            return customLocations.Concat(viewLocations);
        }
    }
}
