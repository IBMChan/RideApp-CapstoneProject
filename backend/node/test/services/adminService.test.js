// Raksha & Harshit

import dotenv from "dotenv";
dotenv.config();

import { jest } from "@jest/globals";
import { ValidationError } from "../../utils/appError.js";
// import ridesRepository from '../repositories/mysql/ridesRepository.js';

// ------------------- Mock repositories -------------------
jest.unstable_mockModule("../../repositories/mongodb/paymentRepository.js", () => ({
  default: {
    create: jest.fn(),
    findByRide: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateByPaymentId: jest.fn(),
    updateByRideId: jest.fn(),
    findPaymentsByDriver: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/mysql/userRepository.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findAll: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  findUserById: jest.fn(),
}));

jest.unstable_mockModule("../../repositories/mysql/ridesRepository.js", () => ({
  default: {
    getRidesByRider: jest.fn(),
    findById: jest.fn(),
    getRideById: jest.fn(),
    getLatestRideByRider: jest.fn(),
    getAllRides: jest.fn(),
    deleteRide: jest.fn(),
  },
}));

// ------------------- Dynamic imports -------------------
const paymentRepositoryModule = await import("../../repositories/mongodb/paymentRepository.js");
const paymentRepository = paymentRepositoryModule.default;

const userRepositoryModule = await import("../../repositories/mysql/userRepository.js");
const userRepository = userRepositoryModule.default;

const ridesRepositoryModule = await import("../../repositories/mysql/ridesRepository.js");
const ridesRepository = ridesRepositoryModule.default;

// Import admin service AFTER mocks
const adminServiceModule = await import("../../services/adminService.js");
const adminService = adminServiceModule.default;



// ------------------- Tests -------------------
describe("AdminService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Example: fetch all users
  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { user_id: 1, full_name: "User1" },
        { user_id: 2, full_name: "User2" },
      ];
      userRepository.findAll.mockResolvedValue(mockUsers);

      const result = await adminService.fetchUsers();

      expect(result).toEqual(mockUsers);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });

  // Example: fetch all rides
    describe("getAllRides", () => {
    it("should return all rides", async () => {
        const mockRides = [
        { ride_id: 101, rider_id: 1 },
        { ride_id: 102, rider_id: 2 },
        ];
        ridesRepository.getAllRides.mockResolvedValue(mockRides);

        const result = await adminService.fetchRides();  // ✅ use service
        expect(result).toEqual(mockRides);
        expect(ridesRepository.getAllRides).toHaveBeenCalled();
    });
    });

  // Example: fetch all payments
  describe("getAllPayments", () => {
    it("should return all payments", async () => {
      const mockPayments = [
        { payment_id: "p1", fare: 100 },
        { payment_id: "p2", fare: 200 },
      ];
      paymentRepository.findAll.mockResolvedValue(mockPayments);

      const result = await adminService.fetchPayments();

      expect(result).toEqual(mockPayments);
      expect(paymentRepository.findAll).toHaveBeenCalled();
    });
  });
});
