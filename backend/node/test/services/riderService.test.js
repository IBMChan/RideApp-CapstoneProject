// backend/node/test/services/riderService.test.js
import { jest } from "@jest/globals";
import { NotFoundError, ValidationError } from "../../utils/appError.js";

// ------------------- Mock modules -------------------
jest.unstable_mockModule("../../repositories/mysql/ridesRepository.js", () => ({
  default: {
    getRidesByRider: jest.fn(),
    findById: jest.fn(),
    getRideById: jest.fn(),
    getLatestRideByRider: jest.fn(),
  },
}));

jest.unstable_mockModule("../../repositories/mysql/userRepository.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    updateUser: jest.fn(),
  },
  findUserById: jest.fn(),
}));

jest.unstable_mockModule("../../repositories/postgres/saveLocRepository.js", () => ({
  findLocationsByUser: jest.fn(),
  findLocationByLabel: jest.fn(),
  createLocation: jest.fn(),
  deleteLocation: jest.fn(),
}));

jest.unstable_mockModule("../../repositories/mongodb/complaintRepository.js", () => ({
  createComplaint: jest.fn(),
  findComplaintsByRider: jest.fn(),
}));

jest.unstable_mockModule("../../repositories/mongodb/lostItemRepository.js", () => ({
  findLostItemsByRide: jest.fn(),
  reportLostItem: jest.fn(),
}));

// ------------------- Dynamic imports -------------------
const rideRepositoryModule = await import("../../repositories/mysql/ridesRepository.js");
const rideRepository = rideRepositoryModule.default;

const userRepositoryModule = await import("../../repositories/mysql/userRepository.js");
const userRepository = userRepositoryModule.default;
const { findUserById } = userRepositoryModule;

const savedLocRepository = await import("../../repositories/postgres/saveLocRepository.js");
const complaintRepository = await import("../../repositories/mongodb/complaintRepository.js");
const lostItemRepository = await import("../../repositories/mongodb/lostItemRepository.js");

// Import service AFTER mocks
const riderServiceModule = await import("../../services/riderService.js");
const riderService = riderServiceModule.default;

// ------------------- Tests -------------------
describe("RiderService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- 1. Ride history ----------------
  describe("getRideHistory", () => {
    it("should return rides if found", async () => {
      const mockRides = [{ ride_id: 1 }, { ride_id: 2 }];
      rideRepository.getRidesByRider.mockResolvedValue(mockRides);

      const result = await riderService.getRideHistory(1);

      expect(result).toEqual(mockRides);
      expect(rideRepository.getRidesByRider).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundError if no rides found", async () => {
      rideRepository.getRidesByRider.mockResolvedValue([]);

      await expect(riderService.getRideHistory(1))
        .rejects.toThrow(NotFoundError);
    });
  });

  // ---------------- 2. Profile ----------------
  describe("getProfile", () => {
    it("should return user profile if found", async () => {
      const mockUser = { user_id: 1, full_name: "Rider One" };
      findUserById.mockResolvedValue(mockUser);

      const result = await riderService.getProfile(1);

      expect(result).toEqual(mockUser);
      expect(findUserById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundError if user not found", async () => {
      findUserById.mockResolvedValue(null);

      await expect(riderService.getProfile(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProfile", () => {
    it("should update and return user if found", async () => {
      const mockUser = { user_id: 1, full_name: "Old" };
      const updates = { full_name: "New" };

      findUserById.mockResolvedValue(mockUser);
      userRepository.updateUser.mockResolvedValue({ ...mockUser, ...updates });

      const result = await riderService.updateProfile(1, updates);

      expect(result.full_name).toBe("New");
      expect(userRepository.updateUser).toHaveBeenCalledWith(1, updates);
    });

    it("should throw NotFoundError if user not found", async () => {
      findUserById.mockResolvedValue(null);

      await expect(riderService.updateProfile(999, {}))
        .rejects.toThrow(NotFoundError);
    });
  });

  // ---------------- 3. Saved Locations ----------------
  describe("getSavedLocations", () => {
    it("should return saved locations", async () => {
      const mockLocs = [{ id: 1, label: "Home" }];
      savedLocRepository.findLocationsByUser.mockResolvedValue(mockLocs);

      const result = await riderService.getSavedLocations(1);

      expect(result).toEqual(mockLocs);
    });

    it("should throw NotFoundError if none found", async () => {
      savedLocRepository.findLocationsByUser.mockResolvedValue([]);

      await expect(riderService.getSavedLocations(1))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe("addSavedLocation", () => {
    it("should add location if valid", async () => {
      const locationData = { label: "Home", address: "123 St", latitude: 10, longitude: 20 };
      savedLocRepository.findLocationByLabel.mockResolvedValue(null);
      savedLocRepository.createLocation.mockResolvedValue({ id: 1, ...locationData });

      const result = await riderService.addSavedLocation(1, locationData);

      expect(result).toHaveProperty("id");
      expect(savedLocRepository.createLocation).toHaveBeenCalledWith(1, locationData);
    });

    it("should throw ValidationError if missing fields", async () => {
      const invalidData = { label: "Home" };

      await expect(riderService.addSavedLocation(1, invalidData))
        .rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if label already exists", async () => {
      const data = { label: "Home", address: "123 St", latitude: 10, longitude: 20 };
      savedLocRepository.findLocationByLabel.mockResolvedValue({ id: 1, label: "Home" });

      await expect(riderService.addSavedLocation(1, data))
        .rejects.toThrow(ValidationError);
    });
  });

  describe("deleteSavedLocation", () => {
    it("should return true if deleted", async () => {
      savedLocRepository.deleteLocation.mockResolvedValue(true);

      const result = await riderService.deleteSavedLocation(1, 100);

      expect(result).toBe(true);
    });

    it("should throw NotFoundError if not deleted", async () => {
      savedLocRepository.deleteLocation.mockResolvedValue(false);

      await expect(riderService.deleteSavedLocation(1, 100))
        .rejects.toThrow(NotFoundError);
    });
  });
});
