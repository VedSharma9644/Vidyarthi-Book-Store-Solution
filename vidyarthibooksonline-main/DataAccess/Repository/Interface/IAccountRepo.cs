
using Domain.DTOs;

namespace DataAccess.Repository.Interface
{
    public interface IAccountRepo
    {
        Task<ServiceResponses> CreateAsync (RegisterDTOs register);
        Task<ServiceResponses> SignInAsync (LoginDTOs login);
        Task<ServiceResponses> LoginWithPhoneNumberAsync(RegisterPhoneNumberDto model);
        Task<ServiceResponses> UpdatePasswordAsync(string userId, PasswordChangeDTOs model);
        Task<ServiceResponses> RegisterWithPhoneNumberAsync(RegisterPhoneNumberDto model);
        Task<ServiceResponses> SignOutAsync();
    }
}
