import { jest, describe, expect, beforeEach, test } from "@jest/globals";

// ===== Mock all dependencies (ESM style) =====
jest.unstable_mockModule("../../repositories/mysql/userRepository.js", () => ({
  default: {
    findById: jest.fn(),
    update: jest.fn(),
    findRidesByDriver: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/mysql/vehicleRepository.js", () => ({
  default: {
    findById: jest.fn(),
    update: jest.fn(),
    getByDriverId: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/mongodb/ratingRepository.js", () => ({
  default: {
    getAverageRatingByDriver: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/mongodb/paymentRepository.js", () => ({
  default: {
    findPaymentsByDriver: jest.fn(),
  },
}));

jest.unstable_mockModule("../../services/vehicleService.js", () => ({
  default: {
    createVehicle: jest.fn(),
    setVehicleStatus: jest.fn(),
    getVehiclesForDriver: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/postgres/walletRepository.js", () => ({
  default: {
    findByUser: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/postgres/walletTransactionRepository.js", () => ({
  default: {
    create: jest.fn(),
  },
}));

jest.unstable_mockModule("../../services/paymentService.js", () => ({
  default: {
    withdrawMoney: jest.fn(),
  },
}));

// ===== Import after mocks =====
const driverService = (await import("../../services/driverService.js")).default;
const userRepository = (await import("../../repositories/mysql/userRepository.js")).default;
const vehicleRepository = (await import("../../repositories/mysql/vehicleRepository.js")).default;
const RatingRepository = (await import("../../repositories/mongodb/ratingRepository.js")).default;
const PaymentRepository = (await import("../../repositories/mongodb/paymentRepository.js")).default;
const vehicleService = (await import("../../services/vehicleService.js")).default;
const walletRepository = (await import("../../repositories/postgres/walletRepository.js")).default;
const walletTransactionRepository = (await import("../../repositories/postgres/walletTransactionRepository.js")).default;
const paymentService = (await import("../../services/paymentService.js")).default;

// ===== Test Suite =====
describe("DriverService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== Profile =====
  test("getProfile → returns driver if found", async () => {
    userRepository.findById.mockResolvedValue({ user_id: 1, full_name: "Shriya" });

    const driver = await driverService.getProfile(1);

    expect(driver).toEqual({ user_id: 1, full_name: "Shriya" });
    expect(userRepository.findById).toHaveBeenCalledWith(1);
  });

  test("getProfile → throws if not found", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(driverService.getProfile(1)).rejects.toThrow("Driver not found");
  });

  test("updateProfile → updates valid fields", async () => {
    userRepository.update.mockResolvedValue({ user_id: 1, full_name: "Updated" });

    const updated = await driverService.updateProfile(1, { full_name: "Updated" });

    expect(updated).toEqual({ user_id: 1, full_name: "Updated" });
    expect(userRepository.update).toHaveBeenCalledWith(1, { full_name: "Updated" });
  });

  test("updateProfile → rejects invalid phone/email", async () => {
    await expect(driverService.updateProfile(1, { phone: "123" }))
      .rejects.toThrow("Phone number must be 10 digits");

    await expect(driverService.updateProfile(1, { email: "invalid@" }))
      .rejects.toThrow("Invalid email format");
  });

  // ===== Ride History =====
  test("getRideHistory → returns rides", async () => {
    userRepository.findRidesByDriver.mockResolvedValue([{ ride_id: 10 }]);

    const rides = await driverService.getRideHistory(1);

    expect(rides).toEqual([{ ride_id: 10 }]);
  });

  // ===== Ratings =====
  test("getAverageRating → returns avg", async () => {
    RatingRepository.getAverageRatingByDriver.mockResolvedValue({ averageRating: 4.5, totalRatings: 10 });

    const result = await driverService.getAverageRating(1);

    expect(result).toEqual({ averageRating: 4.5, totalRatings: 10 });
  });

  // ===== Payment History =====
  test("getPaymentHistory → returns history", async () => {
    PaymentRepository.findPaymentsByDriver.mockResolvedValue([{ amount: 100 }]);

    const history = await driverService.getPaymentHistory(1);

    expect(history).toEqual([{ amount: 100 }]);
  });

  // ===== Vehicle =====
  test("addVehicle → validates and creates", async () => {
    vehicleService.createVehicle.mockResolvedValue({ vehicle_id: 1, model: "Honda" });

    const vehicle = await driverService.addVehicle(1, { model: "Honda", plate_no: "GJ01AB1234" });

    expect(vehicle).toEqual({ vehicle_id: 1, model: "Honda" });
    expect(vehicleService.createVehicle).toHaveBeenCalledWith(1, { model: "Honda", plate_no: "GJ01AB1234" });
  });

  test("updateVehicle → updates status", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 1 });
    vehicleService.setVehicleStatus.mockResolvedValue({ vehicle_id: 1, vehicle_status: "active" });

    const result = await driverService.updateVehicle(1, 1, { vehicle_status: "active" });

    expect(result).toEqual({ vehicle_id: 1, vehicle_status: "active" });
    expect(vehicleService.setVehicleStatus).toHaveBeenCalledWith(1, 1, "active");
  });

  test("deleteVehicle → prevents deleting last vehicle", async () => {
    vehicleRepository.getByDriverId.mockResolvedValue([{ vehicle_id: 1 }]);

    await expect(driverService.deleteVehicle(1, 1)).rejects.toThrow("At least one vehicle must remain");
  });

  // ===== Status =====
  test("updateStatus → only yes/no allowed", async () => {
    userRepository.update.mockResolvedValue({ user_id: 1, is_live_currently: "yes" });

    const result = await driverService.updateStatus(1, "yes");

    expect(result).toEqual({ user_id: 1, is_live_currently: "yes" });
    expect(userRepository.update).toHaveBeenCalledWith(1, { is_live_currently: "yes" });

    await expect(driverService.updateStatus(1, "maybe"))
      .rejects.toThrow("Invalid status. Must be 'yes' or 'no' ");
  });

  // ===== Wallet Withdraw =====
  test("withdrawMoney → success case", async () => {
    walletRepository.findByUser.mockResolvedValue({ wallet_id: 1, balance: 500 });
    walletTransactionRepository.create.mockResolvedValue({ txn_id: 123, status: "pending" });
    paymentService.withdrawMoney.mockResolvedValue({ success: true });

    const result = await driverService.withdrawMoney(1, 200);

    expect(result.txn).toEqual({ txn_id: 123, status: "pending" });
    expect(result.result).toEqual({ success: true });
    expect(paymentService.withdrawMoney).toHaveBeenCalledWith({ user_id: 1, amount: 200 });
  });

  test("withdrawMoney → insufficient balance", async () => {
    walletRepository.findByUser.mockResolvedValue({ balance: 100 });

    await expect(driverService.withdrawMoney(1, 200)).rejects.toThrow("Insufficient wallet balance");
  });
});
