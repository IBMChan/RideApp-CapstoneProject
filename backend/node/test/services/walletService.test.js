import { jest } from "@jest/globals";
import AppError from "../../utils/appError.js";

let WalletService;
let WalletRepositoryMock;
let WalletTransactionRepositoryMock;

beforeAll(async () => {
  WalletRepositoryMock = {
    findByUser: jest.fn(),
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };

  WalletTransactionRepositoryMock = {
    findByWallet: jest.fn(),
    create: jest.fn(),
    findByRazorpayId: jest.fn(),
    updateStatus: jest.fn(),
  };

  jest.unstable_mockModule("../../repositories/postgres/walletRepository.js", () => ({
    default: WalletRepositoryMock,
  }));

  jest.unstable_mockModule("../../repositories/postgres/walletTransactionRepository.js", () => ({
    default: WalletTransactionRepositoryMock,
  }));

  WalletService = (await import("../../services/walletService.js")).default;
});

afterEach(() => jest.clearAllMocks());

describe("WalletService", () => {
  const user_id = 1;
  const wallet = { wallet_id: 1, user_id, balance: 1000, pin: "1234" };
  const txn = {
    transc_id: 1,
    wallet_id: 1,
    debit: 100,
    credit: null,
    status: "pending",
    razorpay_payment_id: "razorpay123",
    txn_date: new Date()
  };

  // getWalletByUserId
  describe("getWalletByUserId", () => {
    it("should return wallet if found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);

      const result = await WalletService.getWalletByUserId(user_id);
      expect(result).toEqual(wallet);
    });

    it("should return null if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);

      const result = await WalletService.getWalletByUserId(user_id);
      expect(result).toBeNull();
    });
  });

  // initiateAddMoney
  describe("initiateAddMoney", () => {
    beforeEach(() => {
      WalletService.runPython = jest.fn();
    });

    it("should initiate add money successfully", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      const pythonResponse = {
        success: true,
        txn: { transc_id: 1, amount: 500, status: "pending" },
      };
      WalletService.runPython.mockResolvedValue(pythonResponse);

      const result = await WalletService.initiateAddMoney(user_id, 500, "1234");
      expect(result.success).toBe(true);
      expect(result.txn).toEqual(pythonResponse.txn);
    });

    it("should throw error for invalid PIN", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      await expect(WalletService.initiateAddMoney(user_id, 500, "0000")).rejects.toThrow(AppError);
    });

    it("should throw error when wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.initiateAddMoney(user_id, 500, "1234")).rejects.toThrow(AppError);
    });

    it("should throw error if python call fails", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: false, message: "Failed" });

      await expect(WalletService.initiateAddMoney(user_id, 500, "1234")).rejects.toThrow(AppError);
    });
  });

  // verifyAddMoneyByTxnId
  describe("verifyAddMoneyByTxnId", () => {
    it("should return failure if transaction not found", async () => {
      WalletTransactionRepositoryMock.findByRazorpayId.mockResolvedValue(null);
      const result = await WalletService.verifyAddMoneyByTxnId("razorpay123");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Transaction not found");
    });

    it("should return success if transaction already verified", async () => {
      const transaction = { ...txn, status: "completed" };
      WalletTransactionRepositoryMock.findByRazorpayId.mockResolvedValue(transaction);
      const result = await WalletService.verifyAddMoneyByTxnId("razorpay123");
      expect(result.success).toBe(true);
      expect(result.message).toBe("Already verified");
    });

    it("should update balance and transaction status on verification", async () => {
      const transaction = { ...txn, status: "pending", credit: 500 };
      WalletTransactionRepositoryMock.findByRazorpayId.mockResolvedValue(transaction);
      WalletRepositoryMock.findById.mockResolvedValue(wallet);
      WalletRepositoryMock.updateBalance.mockResolvedValue({ ...wallet, balance: 1500 });
      WalletTransactionRepositoryMock.updateStatus.mockResolvedValue(true);

      const result = await WalletService.verifyAddMoneyByTxnId("razorpay123");

      expect(result.success).toBe(true);
      expect(result.balance).toBe(1500);
      expect(WalletRepositoryMock.updateBalance).toHaveBeenCalledWith(wallet.wallet_id, 1500);
      expect(WalletTransactionRepositoryMock.updateStatus).toHaveBeenCalledWith(transaction.transc_id, "completed");
    });

    it("should return failure if wallet not found during verification", async () => {
      const transaction = { ...txn, status: "pending", credit: 500 };
      WalletTransactionRepositoryMock.findByRazorpayId.mockResolvedValue(transaction);
      WalletRepositoryMock.findById.mockResolvedValue(null);

      const result = await WalletService.verifyAddMoneyByTxnId("razorpay123");
      expect(result.success).toBe(false);
      expect(result.message).toBe("Wallet not found");
    });
  });

  // initiateWithdraw
  describe("initiateWithdraw", () => {
    beforeEach(() => {
      WalletService.runPython = jest.fn();
      WalletTransactionRepositoryMock.create.mockResolvedValue({ transc_id: 2 });
      WalletRepositoryMock.updateBalance.mockResolvedValue({ ...wallet, balance: 800 });
    });

    it("should withdraw successfully", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: true });

      const result = await WalletService.initiateWithdraw(user_id, 200, "1234");
      expect(result.success).toBe(true);
      expect(result.balance).toBe(800);
    });

    it("should throw error for invalid PIN", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      await expect(WalletService.initiateWithdraw(user_id, 200, "0000")).rejects.toThrow(AppError);
    });

    it("should throw error for insufficient balance", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      await expect(WalletService.initiateWithdraw(user_id, 2000, "1234")).rejects.toThrow(AppError);
    });

    it("should throw if python withdraw fails", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletService.runPython.mockResolvedValue({ success: false, message: "Error" });

      await expect(WalletService.initiateWithdraw(user_id, 200, "1234")).rejects.toThrow(AppError);
    });
  });

  // getBalance
  describe("getBalance", () => {
    it("should return wallet balance", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      const balance = await WalletService.getBalance(user_id);
      expect(balance).toBe(wallet.balance);
    });

    it("should throw if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.getBalance(user_id)).rejects.toThrow(AppError);
    });
  });

  // getTransactions
  describe("getTransactions", () => {
    it("should return transactions", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(wallet);
      WalletTransactionRepositoryMock.findByWallet.mockResolvedValue([txn]);

      const result = await WalletService.getTransactions(user_id);
      expect(result).toEqual([
        {
          transc_id: txn.transc_id,
          txn_date: txn.txn_date,
          credit: txn.credit,
          debit: txn.debit,
          status: txn.status,
          razorpay_payment_id: txn.razorpay_payment_id,
        },
      ]);
    });

    it("should throw if wallet not found", async () => {
      WalletRepositoryMock.findByUser.mockResolvedValue(null);
      await expect(WalletService.getTransactions(user_id)).rejects.toThrow(AppError);
    });
  });
});
