import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { evaluateStatus, generateSignature, paramsToString, paytmAmountToPaise, toPaytmAmount, verifySignature } from "@/lib/paytm-core";

// Paytm's official checksum library (dev dependency) — the reference our port must agree with
const Official = createRequire(import.meta.url)("paytmchecksum") as {
  generateSignature: (params: string | Record<string, string>, key: string) => Promise<string>;
  verifySignature: (params: string | Record<string, string>, key: string, checksum: string) => boolean;
};

const KEY = "Ab1@Cd2#Ef3$Gh4&"; // merchant keys are 16 characters
const BODY = JSON.stringify({ mid: "AAYATS12345678901234", orderId: "AAR-261004-5312" });
const FORM = { ORDERID: "AAR-261004-5312", MID: "AAYATS12345678901234", TXNAMOUNT: "1199.00", STATUS: "TXN_SUCCESS", BANKNAME: "" };

describe("Paytm checksum", () => {
  it("is verified by Paytm's official library (JSON body)", async () => {
    expect(Official.verifySignature(BODY, KEY, generateSignature(BODY, KEY))).toBe(true);
  });

  it("verifies signatures made by Paytm's official library (JSON body and form posts)", async () => {
    expect(verifySignature(BODY, KEY, await Official.generateSignature(BODY, KEY))).toBe(true);
    const checksum = await Official.generateSignature({ ...FORM }, KEY);
    expect(verifySignature({ ...FORM, CHECKSUMHASH: checksum }, KEY, checksum)).toBe(true);
  });

  it("rejects tampered data, the wrong key and garbage", async () => {
    const checksum = await Official.generateSignature({ ...FORM }, KEY);
    expect(verifySignature({ ...FORM, TXNAMOUNT: "1.00" }, KEY, checksum)).toBe(false);
    expect(verifySignature(FORM, "Zz9@Yy8#Xx7$Ww6&", checksum)).toBe(false);
    expect(verifySignature(FORM, KEY, "not-a-checksum")).toBe(false);
  });

  it("joins form fields in key order without the checksum", () => {
    expect(paramsToString({ b: "2", a: "1", CHECKSUMHASH: "x", c: "" })).toBe("1|2|");
  });
});

describe("Paytm amounts", () => {
  it("converts between paise and rupee strings", () => {
    expect(toPaytmAmount(119_900)).toBe("1199.00");
    expect(toPaytmAmount(5)).toBe("0.05");
    expect(paytmAmountToPaise("1199.00")).toBe(119_900);
    expect(paytmAmountToPaise("1199.5")).toBe(119_950);
    expect(paytmAmountToPaise("12,00")).toBeNaN();
    expect(paytmAmountToPaise(undefined)).toBeNaN();
  });
});

describe("evaluateStatus", () => {
  const expected = { mid: "MID1", orderId: "AAR-1", amount: 119_900 };
  const success = { resultInfo: { resultStatus: "TXN_SUCCESS" }, mid: "MID1", orderId: "AAR-1", txnAmount: "1199.00", txnId: "T1", paymentMode: "UPI" };

  it("confirms only an exact match", () => {
    expect(evaluateStatus(success, expected)).toEqual({ status: "PAID", txnId: "T1", paymentMode: "UPI" });
  });

  it("never confirms a success for another amount, order or merchant", () => {
    expect(evaluateStatus({ ...success, txnAmount: "1.00" }, expected).status).toBe("MISMATCH");
    expect(evaluateStatus({ ...success, orderId: "AAR-2" }, expected).status).toBe("MISMATCH");
    expect(evaluateStatus({ ...success, mid: "OTHER" }, expected).status).toBe("MISMATCH");
    expect(evaluateStatus({ ...success, txnId: undefined }, expected).status).toBe("MISMATCH");
  });

  it("reports pending and failed transactions", () => {
    expect(evaluateStatus({ resultInfo: { resultStatus: "PENDING" } }, expected).status).toBe("PENDING");
    // Paytm's own outage response must not be shown to the shopper as a failed payment
    expect(evaluateStatus({ resultInfo: { resultStatus: "TXN_FAILURE", resultCode: "501", resultMsg: "System Error." } }, expected).status).toBe("PENDING");
    expect(evaluateStatus({ resultInfo: { resultStatus: "TXN_FAILURE", resultMsg: "Insufficient balance" } }, expected)).toEqual({
      status: "FAILED",
      reason: "Insufficient balance",
    });
    expect(evaluateStatus({}, expected).status).toBe("FAILED");
  });
});
