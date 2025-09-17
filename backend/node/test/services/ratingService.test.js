// Raksha & Harshit
// backend/node/test/services/ratingService.test.js
import { jest } from "@jest/globals";
import { ValidationError } from "../../utils/appError.js";

// ------------------- Mock rating repository -------------------
jest.unstable_mockModule("../../repositories/mongodb/ratingRepository.js", () => ({
  addRiderToDriverRating: jest.fn(),
  getRiderToDriverRating: jest.fn(),
  updateRiderToDriverRating: jest.fn(),
  deleteRiderToDriverRating: jest.fn(),
  addDriverToRiderRating: jest.fn(),
  getDriverToRiderRating: jest.fn(),
  updateDriverToRiderRating: jest.fn(),
  deleteDriverToRiderRating: jest.fn(),
}));

// ------------------- Dynamic imports -------------------
const ratingRepository = await import("../../repositories/mongodb/ratingRepository.js");
const ratingServiceModule = await import("../../services/ratingService.js");
const ratingService = ratingServiceModule.default;

// ------------------- Tests -------------------
describe("RatingService (via ratingService)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------- Rider → Driver ----------
  describe("rateDriver", () => {
    it("should add rating if valid", async () => {
      const mockRating = { r_to_d: { rate: 5, comment: "Great driver" } };
      ratingRepository.addRiderToDriverRating.mockResolvedValue(mockRating);

      const result = await ratingService.rateDriver(1, 10, 2, 5, "Great driver");

      expect(result).toEqual(mockRating);
      expect(ratingRepository.addRiderToDriverRating)
        .toHaveBeenCalledWith(10, 1, 2, 5, "Great driver");
    });

    it("should throw ValidationError if invalid rate", async () => {
      await expect(ratingService.rateDriver(1, 10, 2, 0, "bad"))
        .rejects.toThrow(ValidationError);
    });
  });

  describe("getDriverRating", () => {
    it("should return rating", async () => {
      const mockRating = { r_to_d: { rate: 4 } };
      ratingRepository.getRiderToDriverRating.mockResolvedValue(mockRating);

      const result = await ratingService.getDriverRating(10, 1);

      expect(result).toEqual(mockRating);
      expect(ratingRepository.getRiderToDriverRating)
        .toHaveBeenCalledWith(10, 1);
    });
  });

  describe("updateDriverRating", () => {
    it("should update rating if valid", async () => {
      const mockRating = { r_to_d: { rate: 5, comment: "Updated" } };
      ratingRepository.updateRiderToDriverRating.mockResolvedValue(mockRating);

      const result = await ratingService.updateDriverRating(1, 10, { rate: 5, comment: "Updated" });

      expect(result).toEqual(mockRating);
      expect(ratingRepository.updateRiderToDriverRating)
        .toHaveBeenCalledWith(10, 1, 5, "Updated");
    });

    it("should throw ValidationError if rate invalid", async () => {
      await expect(
        ratingService.updateDriverRating(1, 10, { rate: 10, comment: "bad" })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteDriverRating", () => {
    it("should delete rating", async () => {
      ratingRepository.deleteRiderToDriverRating.mockResolvedValue(true);

      const result = await ratingService.deleteDriverRating(10, 1);

      expect(result).toBe(true);
      expect(ratingRepository.deleteRiderToDriverRating)
        .toHaveBeenCalledWith(10, 1);
    });
  });

  // ---------- Driver → Rider ----------
  describe("rateRider", () => {
    it("should add rating if valid", async () => {
      const mockRating = { d_to_r: { rate: 4, comment: "Good rider" } };
      ratingRepository.addDriverToRiderRating.mockResolvedValue(mockRating);

      const result = await ratingService.rateRider(2, 10, 1, 4, "Good rider");

      expect(result).toEqual(mockRating);
      expect(ratingRepository.addDriverToRiderRating)
        .toHaveBeenCalledWith(10, 2, 1, 4, "Good rider");
    });

    it("should throw ValidationError if invalid rate", async () => {
      await expect(ratingService.rateRider(2, 10, 1, 6, "oops"))
        .rejects.toThrow(ValidationError);
    });
  });

  describe("getRiderRating", () => {
    it("should return rating", async () => {
      const mockRating = { d_to_r: { rate: 3 } };
      ratingRepository.getDriverToRiderRating.mockResolvedValue(mockRating);

      const result = await ratingService.getRiderRating(10, 2);

      expect(result).toEqual(mockRating);
      expect(ratingRepository.getDriverToRiderRating)
        .toHaveBeenCalledWith(10, 2);
    });
  });

  describe("updateRiderRating", () => {
    it("should update rating if valid", async () => {
      const mockRating = { d_to_r: { rate: 5, comment: "Updated rider" } };
      ratingRepository.updateDriverToRiderRating.mockResolvedValue(mockRating);

      const result = await ratingService.updateRiderRating(2, 10, { rate: 5, comment: "Updated rider" });

      expect(result).toEqual(mockRating);
      expect(ratingRepository.updateDriverToRiderRating)
        .toHaveBeenCalledWith(2, 10, { rate: 5, comment: "Updated rider" });
    });

    it("should throw ValidationError if rate invalid", async () => {
      await expect(
        ratingService.updateRiderRating(2, 10, { rate: 0, comment: "bad" })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteRiderRating", () => {
    it("should delete rating", async () => {
      ratingRepository.deleteDriverToRiderRating.mockResolvedValue(true);

      const result = await ratingService.deleteRiderRating(10, 2);

      expect(result).toBe(true);
      expect(ratingRepository.deleteDriverToRiderRating)
        .toHaveBeenCalledWith(10, 2);
    });
  });
});
