// // Raksha & Harshit
// // backend/node/test/services/adminService.test.js
// import { jest } from "@jest/globals";
// import { ValidationError } from "../../utils/appError.js";

// // ------------------- Import Service -------------------
// const adminServiceModule = await import("../../services/adminService.js");
// const adminService = adminServiceModule.default;

// // ------------------- Tests -------------------
// describe("AdminService - loginAdmin", () => {
//   beforeAll(() => {
//     // Mock environment variables
//     process.env.ADMIN_EMAIL = "admin@example.com";
//     process.env.ADMIN_PASSWORD = "securepassword";
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should return a token when credentials are correct", async () => {
//     const result = await adminService.loginAdmin({
//       email: "admin@example.com",
//       password: "securepassword",
//     });

//     expect(result).toHaveProperty("token");
//     expect(typeof result.token).toBe("string");
//   });

//   it("should throw ValidationError when email is wrong", async () => {
//     await expect(
//       adminService.loginAdmin({ email: "wrong@example.com", password: "securepassword" })
//     ).rejects.toThrow(ValidationError);
//   });

//   it("should throw ValidationError when password is wrong", async () => {
//     await expect(
//       adminService.loginAdmin({ email: "admin@example.com", password: "wrongpass" })
//     ).rejects.toThrow(ValidationError);
//   });
// });
