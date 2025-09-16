// node/test/services/walletService.test.js
import { jest } from "@jest/globals";
import AppError from "../../utils/appError.js";

let WalletService;
let WalletRepositoryMock;
let WalletTransactionRepositoryMock;

beforeAll(async () => {
  // 1️⃣ Mock dependencies
  WalletRepositoryMock = {
    findByUser: jest.fn(),
    createForUserWithPin: jest.fn(),
    updatePin: jest.fn(),
    updateBalanceByUserId: jest.fn(),
  };

  WalletTransactionRepositoryMock = {
    findByWallet: jest.fn(),
    create: jest.fn(),
  };

  // 2️⃣ Apply mocks using unstable_mockModule
  jest.unstable_mockModule("../../repositories/postgres/walletRepository.js", () => ({
    default: WalletRepositoryMock,
  }));

  jest.unstable_mockModule("../../repositories/postgres/walletTransactionRepository.js", () => ({
    default: WalletTransactionRepositoryMock,
  }));

  // 3️⃣ Import the service after mocks
  WalletService = (await import("../../services/walletService.js")).default;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("WalletService", () => {
  const user_id = 1;
  const wallet = { wallet_id: 1, user_id, balance: 1000, pin: "1234" };
  const txn = { id: 1, wallet_id: 1, debit: 100, credit: null };

  // ------------------ createWallet ------------------
  describe("createWallet", () => {
    it("should create a new wallet", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      WalletRepositoryMock.createForUserWithPin.mockResolvedValue(wallet);

      const result = await WalletService.createWallet(user_id, "1234");
      expect(result).toEqual(wallet);
      expect(WalletRepositoryMock.createForUserWithPin).toHaveBeenCalledWith(user_id, "1234");
    });

    it("should throw error if wallet exists", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      await expect(WalletService.createWallet(user_id, "1234")).rejects.toThrow(AppError);
    });
  });

  // ------------------ updatePin ------------------
  describe("updatePin", () => {
    it("should update the wallet PIN successfully", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletRepositoryMock.updatePin.mockResolvedValue({ ...wallet, pin: "5678" });

      const result = await WalletService.updatePin(user_id, "5678");
      expect(result.success).toBe(true);
      expect(result.wallet.pin).toBe("5678");
    });

    it("should fail if PIN too short", async () => {
      const result = await WalletService.updatePin(user_id, "12");
      expect(result.success).toBe(false);
      expect(result.message).toBe("PIN must be at least 4 digits");
    });

    it("should throw error if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.updatePin(user_id, "5678")).rejects.toThrow(AppError);
    });
  });

  // ------------------ getBalance ------------------
  describe("getBalance", () => {
    it("should return wallet balance", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      const balance = await WalletService.getBalance(user_id);
      expect(balance).toBe(wallet.balance);
    });

    it("should throw error if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.getBalance(user_id)).rejects.toThrow(AppError);
    });
  });

  // ------------------ getTransactions ------------------
  describe("getTransactions", () => {
    it("should return transactions", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletTransactionRepositoryMock.findByWallet.mockResolvedValue([txn]);

      const result = await WalletService.getTransactions(user_id);
      expect(result).toEqual([txn]);
    });

    it("should throw error if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.getTransactions(user_id)).rejects.toThrow(AppError);
    });
  });

  // ------------------ initiateWithdraw ------------------
  describe("initiateWithdraw", () => {
    beforeEach(() => {
      WalletService.runPython = jest.fn();
      WalletRepositoryMock.updateBalanceByUserId.mockResolvedValue({ ...wallet, balance: 800 });
      WalletTransactionRepositoryMock.create.mockResolvedValue({ id: 1 });
    });

    it("should withdraw successfully", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: true });

      const result = await WalletService.initiateWithdraw(user_id, 200, "1234");
      expect(result.success).toBe(true);
      expect(result.balance).toBe(800);
    });

    it("should fail for invalid PIN", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      const result = await WalletService.initiateWithdraw(user_id, 200, "0000");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid wallet PIN");
    });

    it("should fail for insufficient balance", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      const result = await WalletService.initiateWithdraw(user_id, 2000, "1234");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Insufficient balance");
    });

    it("should fail if Python withdraw fails", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: false, message: "Python error" });

      const result = await WalletService.initiateWithdraw(user_id, 200, "1234");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Python error");
    });
  });

  // ------------------ initiateAddMoney ------------------
  describe("initiateAddMoney", () => {
    beforeEach(() => WalletService.runPython = jest.fn());

    it("should add money successfully", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: true, txn_id: 1 });

      const result = await WalletService.initiateAddMoney(user_id, 500, "1234");
      expect(result.success).toBe(true);
    });

    it("should fail for invalid PIN", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      await expect(WalletService.initiateAddMoney(user_id, 500, "0000")).rejects.toThrow(AppError);
    });

    it("should fail if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.initiateAddMoney(user_id, 500, "1234")).rejects.toThrow(AppError);
    });
  });

  // ------------------ verifyAddMoney ------------------
  describe("verifyAddMoney", () => {
    beforeEach(() => WalletService.runPython = jest.fn());

    it("should verify successfully", async () => {
      WalletService.runPython.mockResolvedValue({ success: true });
      const result = await WalletService.verifyAddMoney(1, "razorpay123");
      expect(result.success).toBe(true);
    });

    it("should fail if verification fails", async () => {
      WalletService.runPython.mockResolvedValue({ success: false, message: "Payment failed" });
      await expect(WalletService.verifyAddMoney(1, "razorpay123")).rejects.toThrow(AppError);
    });
  });
});
