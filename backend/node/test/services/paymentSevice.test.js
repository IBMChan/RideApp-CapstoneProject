// paymentService.test.js
import { jest } from "@jest/globals";
import AppError from "../../utils/appError.js";

// ESM-style dynamic import after mocking
let PaymentService;
let PaymentRepoMock;
let WalletRepositoryMock;
let walletServiceMock;
let RideRepositoryMock;

beforeAll(async () => {
  // 1️⃣ Mock dependencies
  PaymentRepoMock = {
    create: jest.fn(),
    findByRide: jest.fn(),
    updateByRideId: jest.fn(),
  };

  WalletRepositoryMock = {
    findByUser: jest.fn(),
  };

  walletServiceMock = {
    walletDebit: jest.fn(),
    walletCredit: jest.fn(),
  };

  RideRepositoryMock = {
    findById: jest.fn(),
  };

  // 2️⃣ Apply mocks using unstable_mockModule
  jest.unstable_mockModule("../../repositories/mongodb/paymentRepository.js", () => ({
    default: PaymentRepoMock,
  }));
  jest.unstable_mockModule("../../repositories/postgres/walletRepository.js", () => ({
    default: WalletRepositoryMock,
  }));
  jest.unstable_mockModule("../../services/walletService.js", () => ({
    default: walletServiceMock,
  }));
  jest.unstable_mockModule("../../repositories/mysql/ridesRepository.js", () => ({
    default: RideRepositoryMock,
  }));

  // 3️⃣ Import the service after mocks
  PaymentService = (await import("../../services/paymentService.js")).default;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("PaymentService - initiateRidePayment", () => {
  const rider_id = 101;
  const driver_id = 202;
  const ride_id = 1;

  it("should throw error if ride not found", async () => {
    RideRepositoryMock.findById.mockResolvedValue(null);

    await expect(PaymentService.initiateRidePayment(ride_id, "wallet", "1234", rider_id))
      .rejects
      .toThrow(AppError);

    expect(RideRepositoryMock.findById).toHaveBeenCalledWith(ride_id);
  });

  it("should throw error if ride is not completed", async () => {
    RideRepositoryMock.findById.mockResolvedValue({ ride_id, status: "ongoing", driver_id });

    await expect(PaymentService.initiateRidePayment(ride_id, "wallet", "1234", rider_id))
      .rejects
      .toThrow("Payment allowed only after ride completion");
  });

  it("should throw error if wallet pin invalid", async () => {
    RideRepositoryMock.findById.mockResolvedValue({ ride_id, status: "completed", driver_id });
    WalletRepositoryMock.findByUser.mockResolvedValue({ wallet_id: 1, pin: "0000", balance: 500 });
    PaymentRepoMock.findByRide.mockResolvedValue(null);

    await expect(PaymentService.initiateRidePayment(ride_id, "wallet", "1234", rider_id))
      .rejects
      .toThrow("Invalid wallet pin");
  });

  it("should process wallet payment successfully", async () => {
    const fare = 300;
    RideRepositoryMock.findById.mockResolvedValue({ ride_id, status: "completed", driver_id, fare });
    WalletRepositoryMock.findByUser.mockResolvedValue({ wallet_id: 1, pin: "1234", balance: 500 });
    walletServiceMock.walletDebit.mockResolvedValue({ success: true });
    walletServiceMock.walletCredit.mockResolvedValue({ success: true });
    PaymentRepoMock.findByRide.mockResolvedValue(null);
    PaymentRepoMock.create.mockResolvedValue({ ride_id, fare, mode: "wallet", status: "success" });

    const result = await PaymentService.initiateRidePayment(ride_id, "wallet", "1234", rider_id);

    expect(walletServiceMock.walletDebit).toHaveBeenCalledWith(rider_id, fare, ride_id);
    expect(walletServiceMock.walletCredit).toHaveBeenCalledWith(driver_id, fare);
    expect(PaymentRepoMock.create).toHaveBeenCalledWith({
      ride_id,
      fare,
      mode: "wallet",
      status: "success",
      paidAt: expect.any(Date),
    });
    expect(result.message).toBe("Wallet payment successful");
  });

  it("should initiate cash payment successfully", async () => {
    const fare = 200;
    RideRepositoryMock.findById.mockResolvedValue({ ride_id, status: "completed", driver_id, fare });
    PaymentRepoMock.findByRide.mockResolvedValue(null);
    PaymentRepoMock.create.mockResolvedValue({ ride_id, fare, mode: "cash", status: "pending" });

    const result = await PaymentService.initiateRidePayment(ride_id, "cash", null, rider_id);

    expect(PaymentRepoMock.create).toHaveBeenCalledWith({
      ride_id,
      fare,
      mode: "cash",
      status: "pending",
    });
    expect(result.message).toBe("Cash payment initiated, to be confirmed by driver.");
  });
});
