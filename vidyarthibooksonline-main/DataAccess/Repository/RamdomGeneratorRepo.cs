using DataAccess.Data;
using DataAccess.Repository.Interface;


namespace DataAccess.Repository
{
    public class RandomNumberGeneratorRepo : IRandomNumber
    {
        private static readonly Random random = new Random();
        private readonly AppDbContext _context;

        public RandomNumberGeneratorRepo(AppDbContext context)
        {
            _context = context;
        }

        public string GenerateUniqueRandomNumberAsync(int length)
        {
            string randomNumber;
            do
            {
                randomNumber = GenerateRandomNumber(length);
            } while (_context.Users.Any(u => u.UserName == randomNumber));

            return randomNumber;
        }

        private string GenerateRandomNumber(int length)
        {
            char[] digits = new char[length];
            for (int i = 0; i < digits.Length; i++)
            {
                digits[i] = (char)('0' + random.Next(10)); // Add random digit
            }

            return new string(digits);
        }
    }
}