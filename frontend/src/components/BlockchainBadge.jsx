/**
 * BlockchainBadge.jsx v2
 * ========================
 * Phase 1 upgrade:
 *   - Frontend calls smart contract DIRECTLY via Ethers.js
 *   - No backend trust needed for verification
 *   - Falls back to backend API if Ethers.js unavailable
 *   - Shows full audit trail (block, timestamp, wallet)
 *
 * Copy to: frontend/src/components/BlockchainBadge.jsx
 *
 * Add to frontend/.env:
 *   VITE_CONTRACT_ADDRESS=0x<your_new_contract_address>
 *   VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<your_key>
 */

import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import Lottie from "lottie-react";
import verification from "../assets/Success.json";
import loadingAnimation from "../assets/Loading animation blue.json";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;

// Minimal ABI — only what we need for verification
const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "predictionId", type: "string" },
      { internalType: "bytes32", name: "hash", type: "bytes32" },
    ],
    name: "verifyPrediction",
    outputs: [
      { internalType: "bool", name: "valid", type: "bool" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "address", name: "storedBy", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "predictionId", type: "string" }],
    name: "getPrediction",
    outputs: [
      { internalType: "bytes32", name: "hash", type: "bytes32" },
      { internalType: "string", name: "ipfsCid", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "address", name: "storedBy", type: "address" },
      { internalType: "bool", name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ── Direct contract verification via Ethers.js ────────────────────────────────
const verifyViaContract = async (
  predictionId,
  blockchainHash,
  blockchainTxHash,
) => {
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider,
    );

    // Call verifyPrediction directly on the blockchain
    const [valid, timestamp, storedBy] = await contract.verifyPrediction(
      predictionId,
      blockchainHash,
    );

    return {
      verified: valid,
      timestamp: valid
        ? new Date(Number(timestamp) * 1000).toISOString()
        : null,
      storedBy,
      source: "contract", // verified directly on-chain — no backend involved
      etherscanUrl: blockchainTxHash
        ? `https://sepolia.etherscan.io/tx/${blockchainTxHash}`
        : `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
    };
  } catch (err) {
    console.warn(
      "Direct contract call failed, falling back to backend:",
      err.message,
    );
    return null;
  }
};

// ── Backend API fallback ──────────────────────────────────────────────────────
const verifyViaBackend = async (predictionId, token) => {
  try {
    const { data } = await axios.get(
      `${BACKEND_URL}/api/predictions/verify/${predictionId}`,
      { headers: { token } },
    );
    return { ...data, source: "backend" };
  } catch {
    return { verified: false, failed: true, source: "backend" };
  }
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function BlockchainBadge({ predictionId, blockchain }) {
  const { token } = useContext(AppContext);
  const [status, setStatus] = useState("pending");
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const isVerified = useRef(false);

  useEffect(() => {
    if (!predictionId) return;
    isVerified.current = false;

    const poll = async () => {
      if (isVerified.current) return;
      setStatus("checking");

      // Try direct contract call first — trustless verification
      let result = null;
      if (CONTRACT_ADDRESS && SEPOLIA_RPC_URL && blockchain?.hash) {
        result = await verifyViaContract(
          predictionId,
          blockchain.hash,
          blockchain.txHash,
        );
      }

      // Fall back to backend if contract call failed
      if (!result) {
        result = await verifyViaBackend(predictionId, token);
      }

      if (result?.verified) {
        isVerified.current = true;
        setStatus("verified");
        setData(result);
        clearInterval(intervalRef.current);
      } else if (result?.tampered) {
        isVerified.current = true;
        setStatus("tampered");
        clearInterval(intervalRef.current);
      } else {
        setStatus("pending");
      }
    };

    const intervalRef = { current: null };
    poll();
    const t1 = setTimeout(poll, 3000);
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      clearTimeout(t1);
      clearInterval(intervalRef.current);
    };
  }, [predictionId, token, blockchain]);

  if (!blockchain) return null;

  const s = {
    wrap: {
      marginTop: 16,
      padding: "14px 18px",
      borderRadius: 12,
      border:
        status === "verified"
          ? "1.5px solid #bfdbfe"
          : status === "tampered"
            ? "2px solid #dc2626"
            : "1.5px solid #e2e8f0",
      background:
        status === "verified"
          ? "#eff6ff"
          : status === "tampered"
            ? "#fff1f2"
            : "#f8fafc",
      fontFamily: "system-ui, sans-serif",
    },
    icon: {
      width: 54,
      height: 54,
      borderRadius: 10,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      border: "none",
      overflow: "visible",
    },
    title: {
      fontSize: 13,
      fontWeight: 700,
      margin: "0 0 2px",
      color:
        status === "verified"
          ? "#1e3a8a"
          : status === "tampered"
            ? "#991b1b"
            : "#475569",
    },
    sub: { fontSize: 11.5, color: "#64748b", margin: 0 },
    link: {
      fontSize: 11.5,
      color: "#2563eb",
      textDecoration: "none",
      fontWeight: 600,
    },
    spinner: {
      width: 74,
      height: 74,
      border: "2px solid #e2e8f0",
      borderTop: "2px solid #2563eb",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    },
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.wrap}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div style={s.icon}>
            {status === "checking" || status === "pending" ? (
              <Lottie
                animationData={loadingAnimation}
                loop
                autoplay
                style={{
                  width: 74,
                  height: 74,
                }}
              />
            ) : status === "verified" ? (
              <Lottie
                animationData={verification}
                loop
                autoplay
                speed={0.8}
                style={{
                  width: 34,
                  height: 34,
                }}
              />
            ) : status === "tampered" ? (
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#fff"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#fff"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={s.title}>
              {status === "verified" && " Blockchain Verified"}
              {status === "pending" && "Storing on Blockchain…"}
              {status === "checking" && "Verifying on Ethereum…"}
              {status === "tampered" && " Data Tampering Detected"}
              {status === "failed" && "Blockchain unavailable"}
            </p>

            {status === "verified" && data ? (
              <p style={s.sub}>
                {data.source === "contract"
                  ? " Verified directly on Ethereum — no backend involved · "
                  : "Confirmed on Sepolia · "}
                <a
                  href={data.etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={s.link}
                >
                  View on Etherscan →
                </a>
                {" · "}
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    ...s.link,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {expanded ? "Hide details" : "Show details"}
                </button>
              </p>
            ) : status === "pending" ? (
              <p style={s.sub}>Usually confirms in ~20 seconds</p>
            ) : status === "tampered" ? (
              <p style={{ ...s.sub, color: "#dc2626", fontWeight: 600 }}>
                Hash mismatch — data altered after blockchain sealing
              </p>
            ) : null}
          </div>

          {/* Hash pill */}
          {blockchain?.hash && (
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: "#94a3b8",
                background: "#f1f5f9",
                padding: "4px 8px",
                borderRadius: 6,
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {blockchain.hash.slice(0, 10)}…
            </div>
          )}
        </div>

        {/* ── Expanded audit trail ──────────────────────────────────────────── */}
        {status === "verified" && data && expanded && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: 11,
              color: "#475569",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                color: "#1e3a8a",
                margin: "0 0 8px",
                fontSize: 12,
              }}
            >
              On-Chain Audit Trail
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <p
                  style={{
                    color: "#94a3b8",
                    margin: "0 0 2px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Verified By
                </p>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    color: data.source === "contract" ? "#16a34a" : "#2563eb",
                  }}
                >
                  {data.source === "contract"
                    ? " Smart Contract"
                    : " Backend API"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: "#94a3b8",
                    margin: "0 0 2px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Sealed At
                </p>
                <p style={{ margin: 0 }}>
                  {data.timestamp
                    ? new Date(data.timestamp).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: "#94a3b8",
                    margin: "0 0 2px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Stored By Wallet
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: 10,
                    wordBreak: "break-all",
                  }}
                >
                  {data.storedBy || "N/A"}
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: "#94a3b8",
                    margin: "0 0 2px",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Hash
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: 10,
                    wordBreak: "break-all",
                  }}
                >
                  {blockchain?.hash?.slice(0, 20)}…
                </p>
              </div>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 10, color: "#94a3b8" }}>
              Contract: {CONTRACT_ADDRESS?.slice(0, 10)}…
              {CONTRACT_ADDRESS?.slice(-8)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
