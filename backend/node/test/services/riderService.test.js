// backend/node/test/services/riderService.test.js
import { jest } from "@jest/globals";
// import nodemailer from "nodemailer"; 
import { NotFoundError, ValidationError } from "../../utils/appError.js";

// ------------------- Mock modules -------------------

// ------------------- Nodemailer Mock -------------------
const sendMailMock = jest.fn().mockResolvedValue(true);
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

jest.unstable_mockModule("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: createTransportMock,
  },
}));

// Dynamically import nodemailer *after* mock
const nodemailerModule = await import("nodemailer");
const nodemailer = nodemailerModule.default;
jest.unstable_mockModule("../../repositories/mongodb/complaintRepository.js", () => ({
  __esModule: true,
  default: {
    createComplaint: jest.fn(),
    findComplaintsByRider: jest.fn(),
  },
}));

// later, dynamically import it:
const complaintRepositoryModule = await import("../../repositories/mongodb/complaintRepository.js");
const complaintRepository = complaintRepositoryModule.default;

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
  __esModule: true,
  registerComplaint: jest.fn(),
  getComplaints: jest.fn(),
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

  // ---------------- 4. Share Ride Status ----------------
describe("shareRideStatus (mocked)", () => {
  it("should send email when ride exists", async () => {
    rideRepository.findById.mockResolvedValue({
      ride_id: 1,
      driver_id: 123,
      vehicle_id: null,
    });

    userRepository.findById.mockResolvedValue({ user_id: 123, name: "Driver A" });

    const result = await riderService.shareRideStatus(
      1, // riderId
      1, // rideId
      "skharshit@hotmail.com"
    );

    expect(result).toEqual({
      success: true,
      message: "Ride status shared via email.",
    });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
  });

  it("should throw NotFoundError if ride not found", async () => {
    rideRepository.findById.mockResolvedValue(null);

    await expect(
      riderService.shareRideStatus(1, 999, "friend@example.com")
    ).rejects.toThrow(NotFoundError);
  });
});

// ---------------- 5. SOS Alert ----------------
describe("sendSOS (mocked)", () => {
  it("should send SOS email when rider and ride exist", async () => {
    userRepository.findById.mockResolvedValue({ 
      user_id: 1, 
      full_name: "Rider One" 
    });

    rideRepository.getLatestRideByRider.mockResolvedValue({
      ride_id: 101,
      pickup_loc: "Station Road",
      drop_loc: "Airport",
      driver_id: 123,
    });

    userRepository.findById.mockResolvedValueOnce({ // for rider
      user_id: 1, full_name: "Rider One"
    }).mockResolvedValueOnce({ // for driver
      user_id: 123, full_name: "Driver A", phone: "9999999999", email: "driver@example.com"
    });

    const result = await riderService.sendSOS(
      1, 
      "emergency@example.com",
      "Custom SOS message"
    );

    expect(result).toEqual({
      success: true,
      message: "SOS alert sent successfully",
    });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "emergency@example.com",
        subject: expect.stringContaining("SOS"),
      })
    );
  });

  it("should throw NotFoundError if rider not found", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      riderService.sendSOS(999, "emergency@example.com")
    ).rejects.toThrow(NotFoundError);
  });

  it("should still send SOS if no active ride found", async () => {
    userRepository.findById.mockResolvedValue({
      user_id: 1,
      full_name: "Rider One",
    });

    rideRepository.getLatestRideByRider.mockResolvedValue(null);

    const result = await riderService.sendSOS(
      1,
      "emergency@example.com"
    );

    expect(result).toEqual({
      success: true,
      message: "SOS alert sent successfully",
    });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
  });

  it("should throw error if nodemailer fails", async () => {
    userRepository.findById.mockResolvedValue({ user_id: 1, full_name: "Rider One" });
    rideRepository.getLatestRideByRider.mockResolvedValue(null);

    // Force sendMail to fail
    nodemailer.createTransport().sendMail.mockRejectedValue(
      new Error("SMTP failure")
    );

    await expect(
      riderService.sendSOS(1, "emergency@example.com")
    ).rejects.toThrow("Failed to send SOS email");
  });
});
});
