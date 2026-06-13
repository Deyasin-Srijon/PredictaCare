import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ResearchContext } from "../context/ResearchContext";
import { toast } from "react-toastify";
import axios from "axios";

const DISEASE_CONFIG = {
  heart: {
    label: "Heart Disease",
    emoji: "❤️",
    desc: "Cardiovascular risk factor data including ECG readings, cholesterol, blood pressure, and lifestyle markers collected from PredictaCare users.",
    color: "#ef4444",
    lightBg: "#fff1f2",
    border: "#fecdd3",
  },
  diabetes: {
    label: "Diabetes",
    emoji: "🩺",
    desc: "Glucose tolerance, HbA1c levels, BMI, and metabolic panel data collected across diverse patient demographics via PredictaCare AI predictions.",
    color: "#f97316",
    lightBg: "#fff7ed",
    border: "#fed7aa",
  },
  pcos: {
    label: "PCOS",
    emoji: "⚡",
    desc: "Hormonal profiles, ultrasound findings, menstrual cycle patterns and metabolic indicators from PredictaCare PCOS predictions.",
    color: "#a855f7",
    lightBg: "#fdf4ff",
    border: "#e9d5ff",
  },
  stroke: {
    label: "Stroke",
    emoji: "🧠",
    desc: "Neurological risk data including hypertension history, atrial fibrillation diagnosis and lifestyle factors from stroke predictions.",
    color: "#14b8a6",
    lightBg: "#f0fdfa",
    border: "#99f6e4",
  },
};

const PRICE_TIERS = [
  { records: 100, price: 150, label: "Starter" },
  { records: 500, price: 600, label: "Standard" },
  { records: 1000, price: 900, label: "Pro" },
  { records: 5000, price: 3000, label: "Enterprise" },
];

const SAMPLE_PREVIEW = [
  {
    record_id: "PC-000001",
    prediction_result: "HIGH",
    probability: 0.87,
    tier: "premium",
    blockchain_verified: true,
  },
  {
    record_id: "PC-000002",
    prediction_result: "LOW",
    probability: 0.14,
    tier: "free",
    blockchain_verified: true,
  },
  {
    record_id: "PC-000003",
    prediction_result: "MODERATE",
    probability: 0.52,
    tier: "free",
    blockchain_verified: false,
  },
  {
    record_id: "PC-000004",
    prediction_result: "HIGH",
    probability: 0.91,
    tier: "premium",
    blockchain_verified: true,
  },
  {
    record_id: "PC-000005",
    prediction_result: "LOW",
    probability: 0.09,
    tier: "free",
    blockchain_verified: false,
  },
];

const DatasetDetail = () => {
  const { disease } = useParams();
  const navigate = useNavigate();
  const { rToken, backendUrl, userData, createOrder, verifyPayment } =
    useContext(ResearchContext);

  const cfg = DISEASE_CONFIG[disease];
  const [tab, setTab] = useState("overview");
  const [selectedTier, setSelectedTier] = useState(PRICE_TIERS[1]);
  const [format, setFormat] = useState("csv");
  const [preview, setPreview] = useState(SAMPLE_PREVIEW);
  const [dataInfo, setDataInfo] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!cfg) return; // Load preview + dataset info
    (async () => {
      try {
        const [pvRes, dsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/research-hub/preview/${disease}`),
          axios.get(`${backendUrl}/api/research-hub/datasets`),
        ]);
        if (pvRes.data.success) setPreview(pvRes.data.preview);
        if (dsRes.data.success) {
          const found = dsRes.data.datasets.find((d) => d.disease === disease);
          if (found) setDataInfo(found);
        }
      } catch (_) {}
    })();
  }, [disease]);

  if (!cfg) return <div className="p-10 text-gray-500">Disease not found.</div>;

  const bcPct = dataInfo
    ? Math.round((dataInfo.blockchainVerified / dataInfo.totalRecords) * 100) ||
      0
    : 0;

  const handlePurchase = async () => {
    setBuying(true);
    try {
      const orderRes = await createOrder({
        diseases: [disease],
        recordCount: selectedTier.records,
        format,
        amount: selectedTier.price * 100,
      });

      if (!orderRes.success) {
        toast.error(orderRes.message || "Could not create order");
        setBuying(false);
        return;
      }

      const options = {
        key: orderRes.razorpayKeyId,
        amount: selectedTier.price * 100,
        currency: "INR",
        name: "PredictaCare Research Hub",
        description: `${cfg.label} Dataset – ${selectedTier.records} records`,
        order_id: orderRes.razorpayOrderId,
        handler: async (response) => {
          const result = await verifyPayment({
            ...response,
            orderId: orderRes.orderId,
            format,
          });
          if (result.success) {
            toast.success(
              "Payment successful! Check your email for the download token.",
            );
            navigate("/my-orders");
          } else {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: userData?.name, email: userData?.email },
        theme: { color: "#5F6FFF" },
      };

      if (!window.Razorpay) {
        // Load Razorpay script dynamically
        await new Promise((res, rej) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = res;
          script.onerror = rej;
          document.body.appendChild(script);
        });
      }
      new window.Razorpay(options).open();
    } catch (e) {
      toast.error("Payment failed: " + e.message);
    }
    setBuying(false);
  };

  return (
    <div className="p-6 sm:p-10">
      {/* Back */}
      <button
        onClick={() => navigate("/datasets")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#5F6FFF] mb-6 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Datasets
      </button>

      {/* Hero */}
      <div
        className="rounded-xl border-2 p-6 mb-8 flex items-center gap-5"
        style={{ backgroundColor: cfg.lightBg, borderColor: cfg.border }}
      >
        <div className="text-5xl">{cfg.emoji}</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {cfg.label} Dataset
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {dataInfo?.totalRecords?.toLocaleString() ?? "—"} anonymised
            prediction records
          </p>
          <div className="flex items-center gap-2 mt-2">
            {bcPct > 0 && (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {bcPct}% Blockchain Verified
              </span>
            )}
            <span className="bg-[#eef0ff] text-[#5F6FFF] text-xs px-2.5 py-1 rounded-full font-medium">
              Research Only
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: info + tabs */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            {["overview", "preview", "schema"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "border-b-2 border-[#5F6FFF] text-[#5F6FFF]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="flex flex-col gap-5">
              <p className="text-gray-600 leading-relaxed text-sm">
                {cfg.desc}
              </p>

              {dataInfo && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Records",
                      value: dataInfo.totalRecords?.toLocaleString(),
                    },
                    {
                      label: "BC Verified",
                      value: dataInfo.blockchainVerified?.toLocaleString(),
                    },
                    {
                      label: "High Risk",
                      value: dataInfo.riskBreakdown?.HIGH?.toLocaleString(),
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100"
                    >
                      <p className="text-xl font-bold text-gray-900">
                        {s.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#eef0ff] rounded-xl p-4 flex gap-3 text-sm text-gray-700 leading-relaxed">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5F6FFF"
                  strokeWidth="2"
                  className="flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                All records are{" "}
                <strong className="mx-1">fully anonymised</strong> — no names,
                emails, or identifiable information. Data comes only from users
                who gave explicit research consent on PredictaCare.
              </div>
            </div>
          )}

          {/* Preview */}
          {tab === "preview" && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                    {[
                      "Record ID",
                      "Disease",
                      "Result",
                      "Probability",
                      "Tier",
                      "Blockchain",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {r.record_id}
                      </td>
                      <td className="px-4 py-3 capitalize">{disease}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                            r.prediction_result === "HIGH"
                              ? "bg-red-50 text-red-600"
                              : r.prediction_result === "MODERATE"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-green-50 text-green-600"
                          }`}
                        >
                          {r.prediction_result}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {(r.probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 capitalize">{r.tier}</td>
                      <td className="px-4 py-3">
                        {r.blockchain_verified ? (
                          <span className="flex items-center gap-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs w-fit">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 px-4 py-2.5 text-xs text-gray-400 border-t border-gray-100">
                Showing 5 sample records · Personal identifiers removed · Full
                dataset delivered after purchase
              </div>
            </div>
          )}

          {/* Schema */}
          {tab === "schema" && (
            <div className="bg-gray-900 rounded-xl p-5 text-xs font-mono text-green-400 overflow-x-auto">
              <pre>
                {JSON.stringify(
                  {
                    record_id: "PC-000001",
                    disease: disease,
                    prediction_result: "HIGH | MODERATE | LOW",
                    probability: 0.87,
                    tier: "premium | free",
                    is_beta: false,
                    blockchain_verified: true,
                    blockchain_tx: "0xabc123...",
                    date: "2025-09-18T10:30:00.000Z",
                    "...disease_inputs": "varies by disease type",
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Right: purchase card */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4">
              Purchase Dataset
            </h3>

            {/* Record count */}
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Records
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {PRICE_TIERS.map((t) => (
                <button
                  key={t.records}
                  onClick={() => setSelectedTier(t)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    selectedTier.records === t.records
                      ? "border-[#5F6FFF] bg-[#eef0ff]"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedTier.records === t.records
                          ? "border-[#5F6FFF] bg-[#5F6FFF]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedTier.records === t.records && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="font-medium">
                      {t.records.toLocaleString()} records
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {t.label}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">₹{t.price}</span>
                </button>
              ))}
            </div>

            {/* Format */}
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Format
            </p>
            <div className="flex gap-2 mb-5">
              {["csv", "json"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-semibold uppercase text-sm transition-all ${
                    format === f
                      ? "border-[#5F6FFF] bg-[#eef0ff] text-[#5F6FFF]"
                      : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm border border-gray-100">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Records</span>
                <span className="font-semibold">
                  {selectedTier.records.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Format</span>
                <span className="font-semibold uppercase">{format}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Token validity</span>
                <span className="font-semibold">30 days</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-lg text-[#5F6FFF]">
                  ₹{selectedTier.price}
                </span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={buying}
              className="w-full py-3 rounded-xl bg-[#5F6FFF] hover:bg-[#4a57e8] text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {buying ? (
                "Processing..."
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Pay ₹{selectedTier.price} & Get Token
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-2">
              Secure Razorpay checkout · Token sent to your email
            </p>

            <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Encrypted</span>
              <span>📧 Instant</span>
              <span>📋 Licenced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetail;
