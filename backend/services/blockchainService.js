import { ethers } from "ethers";
import crypto from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load ABI
const ABI = JSON.parse(
  readFileSync(join(__dirname, "../blockchain/PredictaCare.abi.json"), "utf8"),
);

let provider, wallet, contract;

const init = () => {
  if (contract) return;

  if (
    !process.env.SEPOLIA_RPC_URL ||
    !process.env.ADMIN_PRIVATE_KEY ||
    !process.env.CONTRACT_ADDRESS
  ) {
    console.warn("Blockchain env vars missing");
    return;
  }

  try {
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);
    console.log("Blockchain service initialised");
  } catch (err) {
    console.error("Blockchain init failed:", err.message);
  }
};

// ── Unchanged from your version ───────────────────────────────────────────────
export const buildPredictionHash = (data) => {
  const normalizedPayload = {
    userId: String(data.userId).trim(),
    disease: String(data.disease).trim().toLowerCase(),
    predictionResult: String(data.predictionResult).trim().toLowerCase(),
    probability: Number(data.probability).toFixed(6),
    tier: String(data.tier).trim().toLowerCase(),
  };

  const payload = JSON.stringify(normalizedPayload);
  return "0x" + crypto.createHash("sha256").update(payload).digest("hex");
};

/**
 * Store a prediction hash + IPFS CID on-chain.
 *
 * ✅ CHANGE 1: Added ipfsCid parameter (3rd arg, default "")
 *    Pass "" if IPFS upload failed — contract accepts empty string fine.
 *
 * @param predictionId  MongoDB ObjectId string
 * @param hashHex       SHA-256 hash (0x prefixed)
 * @param ipfsCid       IPFS CID from Pinata — "" if unavailable
 * @param queueOnFail   Queue for retry if blockchain call fails
 */
export const storePredictionOnChain = async (
  predictionId,
  hashHex,
  ipfsCid = "", // ✅ CHANGE 1: new parameter
  queueOnFail = false,
) => {
  init();
  if (!contract) return null;

  try {
    const existing = await getPredictionFromChain(predictionId);
    if (existing) {
      console.log(
        `Already on-chain: ${predictionId} — skipping duplicate store`,
      );
      return { txHash: null, blockNumber: null, alreadyStored: true };
    }

    // ✅ CHANGE 2: Pass ipfsCid as 3rd argument to updated smart contract
    const tx = await contract.storePrediction(
      predictionId,
      hashHex,
      ipfsCid || "",
    );
    console.log(`Tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`On-chain: block ${receipt.blockNumber}, tx ${tx.hash}`);
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      alreadyStored: false,
    };
  } catch (err) {
    if (err.message.includes("prediction already stored")) {
      console.log(
        `Duplicate revert caught for ${predictionId} — treating as success`,
      );
      return { txHash: null, blockNumber: null, alreadyStored: true };
    }
    console.error("Blockchain store failed (non-fatal):", err.message);

    if (queueOnFail) {
      try {
        const { default: PendingBlockchain } =
          await import("../models/pendingBlockchainModel.js");
        await PendingBlockchain.findOneAndUpdate(
          { predictionId },
          {
            predictionId,
            hashHex,
            ipfsCid,
            lastError: err.message,
            lastAttempt: new Date(),
          },
          { upsert: true, new: true },
        );
        console.log(`Queued for retry: ${predictionId}`);
      } catch (queueErr) {
        console.error("Failed to queue blockchain retry:", queueErr.message);
      }
    }
    return null;
  }
};

/**
 * Verify a prediction certificate.
 * Returns { valid, timestamp, storedBy }
 * Unchanged from your version.
 */
export const verifyPredictionOnChain = async (predictionId, hashHex) => {
  init();
  if (!contract) return { valid: false, error: "Blockchain not configured" };

  try {
    const [valid, timestamp, storedBy] = await contract.verifyPrediction(
      predictionId,
      hashHex,
    );
    return {
      valid,
      timestamp: valid
        ? new Date(Number(timestamp) * 1000).toISOString()
        : null,
      storedBy: valid ? storedBy : null,
      reason: valid ? null : "Hash mismatch or not yet stored",
    };
  } catch (err) {
    console.error("Verify failed:", err.message);
    return { valid: false, error: err.message };
  }
};

/**
 * Get raw record from chain.
 *
 * ✅ CHANGE 3: Now destructures ipfsCid from contract response
 *    and returns it — so verifyPrediction can include the IPFS link.
 */
export const getPredictionFromChain = async (predictionId) => {
  init();
  if (!contract) return null;

  try {
    // Updated contract returns: [hash, ipfsCid, timestamp, storedBy, exists]
    const [hash, ipfsCid, timestamp, storedBy, exists] =
      await contract.getPrediction(predictionId);
    if (!exists) return null;
    return {
      hash,
      ipfsCid: ipfsCid || null, // ✅ CHANGE 3: now returned
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      storedBy,
    };
  } catch (err) {
    console.error("Get prediction failed:", err.message);
    return null;
  }
};
