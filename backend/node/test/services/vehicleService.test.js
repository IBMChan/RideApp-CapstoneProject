// vehicleService.test.js
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// --- Mock dependencies BEFORE importing service ---

await jest.unstable_mockModule("../../repositories/mysql/vehicleRepository.js", () => ({
  default: {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getByDriverId: jest.fn(),
    deactivateAllExcept: jest.fn(),
  },
}));

await jest.unstable_mockModule("../../repositories/mysql/userRepository.js", () => ({
  default: {
    isDriver: jest.fn(),
  },
}));

await jest.unstable_mockModule("../../config/sqlConfig.js", () => ({
  default: {
    transaction: jest.fn(),
  },
}));

// --- Import after mocks are registered ---
const vehicleRepository = (await import("../../repositories/mysql/vehicleRepository.js")).default;
const userRepository = (await import("../../repositories/mysql/userRepository.js")).default;
const sequelize = (await import("../../config/sqlConfig.js")).default;
const vehicleService = (await import("../../services/vehicleService.js")).default;

// --- Tests ---
describe("VehicleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== createVehicle =====
  test("createVehicle → creates when driver valid", async () => {
    userRepository.isDriver.mockResolvedValue(true);
    vehicleRepository.create.mockResolvedValue({ vehicle_id: 1, model: "Honda" });

    const v = await vehicleService.createVehicle(1, { model: "Honda" });

    expect(v).toEqual({ vehicle_id: 1, model: "Honda" });
    expect(userRepository.isDriver).toHaveBeenCalledWith(1);
    expect(vehicleRepository.create).toHaveBeenCalledWith(1, { model: "Honda" });
  });

  test("createVehicle → throws if not driver", async () => {
    userRepository.isDriver.mockResolvedValue(false);

    await expect(vehicleService.createVehicle(1, { model: "Honda" }))
      .rejects.toThrow("Only drivers can create vehicles");
  });

  // ===== updateVehicle =====
  test("updateVehicle → simple update when not activating", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 1 });
    vehicleRepository.update.mockResolvedValue({ vehicle_id: 1, color: "red" });

    const result = await vehicleService.updateVehicle(1, 1, { color: "red" });

    expect(result).toEqual({ vehicle_id: 1, color: "red" });
    expect(vehicleRepository.update).toHaveBeenCalledWith(1, { color: "red" });
  });

  test("updateVehicle → activates and deactivates others", async () => {
    const commit = jest.fn();
    const rollback = jest.fn();
    sequelize.transaction.mockResolvedValue({ commit, rollback });

    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 1 });
    vehicleRepository.update.mockResolvedValue({ vehicle_id: 1, vehicle_status: "active" });

    const result = await vehicleService.updateVehicle(1, 1, { vehicle_status: "active" });

    expect(result).toEqual({ vehicle_id: 1, vehicle_status: "active" });
    expect(vehicleRepository.deactivateAllExcept).toHaveBeenCalledWith(1, 1, { transaction: expect.any(Object) });
    expect(commit).toHaveBeenCalled();
  });

  test("updateVehicle → throws if not owner", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 2 });

    await expect(vehicleService.updateVehicle(1, 1, { color: "red" }))
      .rejects.toThrow("Not authorized to update this vehicle");
  });

  // ===== setVehicleStatus =====
  test("setVehicleStatus → rejects invalid status", async () => {
    await expect(vehicleService.setVehicleStatus(1, 1, "maybe"))
      .rejects.toThrow("Invalid status");
  });

  // ===== getVehiclesForDriver =====
  test("getVehiclesForDriver → returns list", async () => {
    vehicleRepository.getByDriverId.mockResolvedValue([{ vehicle_id: 1 }]);

    const result = await vehicleService.getVehiclesForDriver(1);

    expect(result).toEqual([{ vehicle_id: 1 }]);
  });

  // ===== getVehicleById =====
  test("getVehicleById → returns vehicle", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1 });

    const result = await vehicleService.getVehicleById(1);

    expect(result).toEqual({ vehicle_id: 1 });
  });

  test("getVehicleById → throws if not found", async () => {
    vehicleRepository.findById.mockResolvedValue(null);

    await expect(vehicleService.getVehicleById(1))
      .rejects.toThrow("Vehicle not found");
  });

  // ===== deleteVehicle =====
  test("deleteVehicle → deletes if owner", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 1 });
    vehicleRepository.delete.mockResolvedValue({ success: true });

    const result = await vehicleService.deleteVehicle(1, 1);

    expect(result).toEqual({ success: true });
    expect(vehicleRepository.delete).toHaveBeenCalledWith(1);
  });

  test("deleteVehicle → throws if not owner", async () => {
    vehicleRepository.findById.mockResolvedValue({ vehicle_id: 1, driver_id: 2 });

    await expect(vehicleService.deleteVehicle(1, 1))
      .rejects.toThrow("Not authorized");
  });
});
