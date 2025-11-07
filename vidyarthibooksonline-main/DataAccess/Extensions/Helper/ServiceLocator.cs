using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Extensions.Helper
{
    public static class ServiceLocator
    {
        public static IServiceProvider? Instance { get; private set; }

        public static void Init(IServiceProvider provider)
        {
            Instance = provider;
        }
    }
}
