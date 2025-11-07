using DataAccess.Data;
using DataAccess.Repository.Interface;
using Domain.DTOs;
using Domain.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Win32;



namespace DataAccess.Repository
{
    public class AccountRepo : IAccountRepo
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEmailSenderService _emailSender;

        public AccountRepo (AppDbContext db,
                            UserManager<AppUser> userManager,
                            RoleManager<IdentityRole> roleManager,
                            SignInManager<AppUser> signInManager,
                            IUnitOfWork unitOfWork,
                            IEmailSenderService emailSender)
                            {
                                _db = db;
                                _userManager = userManager;
                                _roleManager = roleManager;
                               _signInManager = signInManager;
                               _unitOfWork = unitOfWork;
                               _emailSender = emailSender;
                            }

        
        public async Task<ServiceResponses> CreateAsync(RegisterDTOs register)
        {
            try
            {
                // Check if any users exist in the system
                bool isFirstUser = !_db.Users.Any();
                string roleName = isFirstUser ? SD.UserRoles.Admin : SD.UserRoles.Customer;

                var memberId = _unitOfWork.RandomNumberGenerator.GenerateUniqueRandomNumberAsync(6);
               
                var user = new AppUser
                {
                    Email = register.Email,
                    UserName = register.MobileNumber,
                    RoleName = roleName,
                    PhoneNumber=register.MobileNumber,
                };
               
                //verify if user already exists
                var existingUser = await _userManager.FindByEmailAsync(register.Email!);
                if (existingUser != null)
                {
                    return new ServiceResponses(false, "User already registered.");
                }

                // Check if the mobile number is already registered
                var existingMobileUser = await _userManager.FindByNameAsync(register.MobileNumber!);
                if (existingMobileUser != null)
                {
                    return new ServiceResponses(false, "Mobile number is already registered.");
                }

                // velidate mobile otp
                var isValidMobileOtp = await VerifyMobileOtpAsync(register.MobileNumber!, register.MobileOtp!);
                if (!isValidMobileOtp)
                {
                    return new ServiceResponses(false, "Invalid mobile OTP.");
                }
                var result = await _userManager.CreateAsync(user, register.Password!);
                if (!result.Succeeded) return new ServiceResponses(false, "failed to register user");
                if (result.Succeeded)
                {
                  

                    // Create the role if it doesn't exist
                    var roleExists = await _roleManager.RoleExistsAsync(roleName);
                    if (!roleExists)
                    {
                        await _roleManager.CreateAsync(new IdentityRole(roleName));
                    }
                    // Assign the user to the role
                    await _userManager.AddToRoleAsync(user, roleName);
                    user.PhoneNumberConfirmed = true;

                    return new ServiceResponses(true,"Register success",user.Id, user.Id,user);
                   
                }
                else
                {
                    throw new Exception("Failed to create user");
                }
            }
            catch (Exception)
            {
                throw;
            }
           
        }

        public async Task<ServiceResponses> LoginWithPhoneNumberAsync(RegisterPhoneNumberDto model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Mobile) || string.IsNullOrWhiteSpace(model.Otp))
                    return new ServiceResponses(false, "Mobile number and OTP are required.");

                var phoneNumber = $"+91{model.Mobile.Trim()}";

                var otpEntry = await _db.MembersOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == phoneNumber && o.OTP == model.Otp);

                if (otpEntry == null)
                    return new ServiceResponses(false, "Invalid OTP.");

                var user = await _userManager.FindByNameAsync(model.Mobile);
                if (user == null)
                    return new ServiceResponses(false, "User not found.");

                // Attempt sign-in using mobile as password (as per your design)
                var result = await _signInManager.PasswordSignInAsync(user, model.Mobile, false, false);
                if (!result.Succeeded)
                    return new ServiceResponses(false, "Login failed. Please check your credentials.");

                // Confirm phone number if not already confirmed
                if (!user.PhoneNumberConfirmed)
                {
                    user.PhoneNumberConfirmed = true;
                    await _userManager.UpdateAsync(user);
                }

                // Remove OTP after successful login
                _db.MembersOtps.Remove(otpEntry);
                await _db.SaveChangesAsync();

                return new ServiceResponses(true, "Login successful");
            }
            catch (Exception ex)
            {
                return new ServiceResponses(false, $"Exception occurred: {ex.Message}");
            }
        }

        public async Task<ServiceResponses> RegisterWithPhoneNumberAsync(RegisterPhoneNumberDto model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(model.Mobile) 
                    || string.IsNullOrWhiteSpace(model.Otp)
                    || string.IsNullOrWhiteSpace(model.Mobile))
                    return new ServiceResponses(false, "Mobile, OTP, and Password are required.");

                // Determine role based on whether this is the first user
                bool isFirstUser = !_db.Users.Any();
                string roleName = isFirstUser ? SD.UserRoles.Admin : SD.UserRoles.Customer;

                var phoneNumber = $"+91{model.Mobile.Trim()}";

                var otpEntry = await _db.MembersOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == phoneNumber && o.OTP == model.Otp);

                if (otpEntry == null)
                    return new ServiceResponses(false, "Invalid OTP.");


                // Check if user already exists
                var existingUser = await _userManager.FindByNameAsync(model.Mobile);
                if (existingUser != null)
                    return new ServiceResponses(false, "User already registered.");

                var user = new AppUser
                {
                    UserName = model.Mobile,
                    PhoneNumber = model.Mobile,
                    PhoneNumberConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, model.Mobile!);
                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                    return new ServiceResponses(false, "User creation failed: " + errors);
                }

                // Create the role if it doesn't exist
                if (!await _roleManager.RoleExistsAsync(roleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(roleName));
                }

                // Assign user to role
                await _userManager.AddToRoleAsync(user, roleName);

                // Clean up OTP
                _db.MembersOtps.Remove(otpEntry);
                await _db.SaveChangesAsync();

                return new ServiceResponses(true, "Registration successful.");
            }
            catch (Exception ex)
            {
                return new ServiceResponses(false, $"Exception occurred: {ex.Message}");
            }

        }
        public async Task<ServiceResponses> SignInAsync(LoginDTOs login)
        {
            try
            {
                // Try finding the user by email
                var user = await _userManager.FindByEmailAsync(login.Email!);

                // If not found by email, try username
                if (user == null)
                {
                    user = await _userManager.FindByNameAsync(login.Email!);
                }

                // Still not found
                if (user == null)
                {
                    return new ServiceResponses(false, "User not found");
                }

                // Now use the correct username from the user object for password sign-in
                var result = await _signInManager.PasswordSignInAsync(user.UserName!, login.Password!, login.RememberMe, false);

                if (result.Succeeded)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var role = roles.FirstOrDefault();

                    if (role != null)
                    {
                        return new ServiceResponses(true, "Login success", role, null!, user);
                    }
                    else
                    {
                        return new ServiceResponses(false, "User has no role assigned");
                    }
                }
                else
                {
                    return new ServiceResponses(false, "Invalid credentials");
                }
            }
            catch (Exception ex)
            {
                throw new Exception("An error occurred during sign-in", ex);
            }
        }
        public async Task<ServiceResponses> SignOutAsync()
        {
            try
            {
                await _signInManager.SignOutAsync();
                return new ServiceResponses(true, "Logout success");
            }
            catch (Exception ex)
            {
                // Log the exception or perform any necessary error handling
                return new ServiceResponses(false, "Error occurred during logout: " + ex.Message);
            }
        }
        public async Task<ServiceResponses> UpdatePasswordAsync(string userId, PasswordChangeDTOs model)
        {
            if (model == null)
            {
                return new ServiceResponses(false, "Model is null");
            }

            // Get the user from UserManager using the provided user ID or username
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new ServiceResponses(false, "User not found");
            }

            // Change the user's password using UserManager
            var changePasswordResult = await _userManager.ChangePasswordAsync(user, model.OldPassword!, model.NewPassword!);

            // Check if the password change operation was successful
            if (changePasswordResult.Succeeded)
            {
                return new ServiceResponses(true, "Password updated successfully");
            }
            else
            {
                // Password change failed, return error messages
                var errorMessage = string.Join(", ", changePasswordResult.Errors.Select(e => e.Description));
                return new ServiceResponses(false, errorMessage);
            }
        }


        private async Task<bool> VerifyMobileOtpAsync(string mobileNumber, string otp)
        {
            try
            {
                var phoneNumber = $"+91{mobileNumber.Trim()}";
                var findOtp = await _db.MembersOtps
                    .FirstOrDefaultAsync(o => o.MobileNumber == phoneNumber && o.OTP == otp);
        
                if (findOtp == null) return false;
        
                // Remove the OTP entry after successful verification
                _db.MembersOtps.Remove(findOtp);
                await _db.SaveChangesAsync();
        
                return true;
            }
            catch (Exception)
            {
                throw;
            }
        }

    }
}
