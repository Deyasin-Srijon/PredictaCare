import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResearchContext } from "../context/ResearchContext";
import workingBrain from "../assets/working brain.json";
import heart from "../assets/Human Heart.json";
import diabetes from "../assets/Diabetes Blood Cells.json";
import pcos from "../assets/Uterus.json";
import Lottie from "lottie-react";
const DISEASE_CONFIG = {
  heart: {
    label: "Heart Disease",
    animation: heart,
    desc: "Cardiovascular risk factor data including ECG readings, cholesterol levels, and lifestyle markers.",
    color: "#ef4444",
    lightBg: "#fff1f2",
    border: "#fecdd3",
  },
  diabetes: {
    label: "Diabetes",
    animation: diabetes,
    desc: "Glucose tolerance, HbA1c, BMI, and metabolic panel data across diverse patient demographics.",
    color: "#f97316",
    lightBg: "#fff7ed",
    border: "#fed7aa",
  },
  pcos: {
    label: "PCOS",
    animation: pcos,
    desc: "Hormonal profiles, ultrasound findings, menstrual cycle patterns and metabolic indicators.",
    color: "#a855f7",
    lightBg: "#fdf4ff",
    border: "#e9d5ff",
  },
  stroke: {
    label: "Stroke",
    animation: workingBrain,
    desc: "Neurological risk data including hypertension history, atrial fibrillation and lifestyle factors.",
    color: "#14b8a6",
    lightBg: "#f0fdfa",
    border: "#99f6e4",
  },
};

const PRICE_TIERS = [
  { records: 100, price: 150 },
  { records: 500, price: 600 },
  { records: 1000, price: 900 },
  { records: 5000, price: 3000 },
];

const DatasetCard = ({ disease, data }) => {
  const navigate = useNavigate();
  const cfg = DISEASE_CONFIG[disease];
  if (!cfg) return null;

  const bcPct =
    data.totalRecords > 0
      ? Math.round((data.blockchainVerified / data.totalRecords) * 100)
      : 0;

  return (
    <div
      onClick={() => navigate(`/dataset/${disease}`)}
      className="bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: cfg.border, backgroundColor: cfg.lightBg }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
            <Lottie
              animationData={cfg.animation}
              loop
              autoplay
              style={{
                width: 52,
                height: 52,
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{cfg.label}</h3>
            <p className="text-xs text-gray-500">
              {data.totalRecords?.toLocaleString() ?? "—"} records
            </p>
          </div>
        </div>
        {bcPct > 0 && (
          <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
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
            {bcPct}% verified
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 leading-relaxed mb-4">{cfg.desc}</p>

      {/* Risk breakdown */}
      {data.riskBreakdown && (
        <div className="flex gap-2 mb-4">
          {[
            ["HIGH", "#ef4444"],
            ["MODERATE", "#f97316"],
            ["LOW", "#10b981"],
          ].map(([r, c]) => (
            <div
              key={r}
              className="flex-1 text-center bg-white rounded-lg py-2"
            >
              <div className="text-sm font-bold" style={{ color: c }}>
                {(data.riskBreakdown[r] ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">{r}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          from{" "}
          <span className="font-bold text-gray-800 text-sm">
            ₹{PRICE_TIERS[0].price}
          </span>
        </span>
        <span className="text-[#5F6FFF] font-semibold flex items-center gap-1">
          View & Purchase
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  );
};

const Datasets = () => {
  const { datasets, stats, loadDatasets, loadStats, loading } =
    useContext(ResearchContext);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadDatasets();
    loadStats();
  }, []);

  const filtered =
    filter === "all" ? datasets : datasets.filter((d) => d.disease === filter);

  // Always show all 4 disease cards — use backend data if available, else zeros
  const displayData = Object.keys(DISEASE_CONFIG)
    .filter((d) => filter === "all" || d === filter)
    .map((d) => {
      const found = datasets.find((ds) => ds.disease === d);
      return (
        found || {
          disease: d,
          totalRecords: 0,
          blockchainVerified: 0,
          riskBreakdown: { HIGH: 0, MODERATE: 0, LOW: 0 },
        }
      );
    });

  return (
    <div className="p-6 sm:p-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Medical Research Datasets
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Anonymised patient prediction data · Blockchain-verified · Research
          use only
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Records",
              value: stats.totalRecords?.toLocaleString(),
              color: "#5F6FFF",
            },
            {
              label: "Blockchain Verified",
              value: stats.blockchainVerified?.toLocaleString(),
              color: "#10b981",
            },
            { label: "Disease Types", value: "4", color: "#a855f7" },
            { label: "Anonymised", value: "100%", color: "#f97316" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {["all", "heart", "diabetes", "pcos", "stroke"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
              filter === f
                ? "bg-[#5F6FFF] text-white border-[#5F6FFF]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#5F6FFF] hover:text-[#5F6FFF]"
            }`}
          >
            {f === "all" ? (
              <span className="flex items-center gap-2">
                🗂 <span>All</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lottie
                  animationData={DISEASE_CONFIG[f].animation}
                  loop
                  autoplay
                  style={{
                    width: 22,
                    height: 22,
                  }}
                />
                <span>{DISEASE_CONFIG[f].label}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dataset grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-60 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayData.map((d, i) => (
            <DatasetCard key={d.disease ?? i} disease={d.disease} data={d} />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="mt-12 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          How it works
        </h2>
        <div className="grid sm:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Browse Datasets",
              desc: "Explore anonymised medical prediction datasets with live statistics and sample previews.",
            },
            {
              step: "02",
              title: "Choose a Plan",
              desc: "Select record count (100–5000) and format (JSON or CSV) that fits your research needs.",
            },
            {
              step: "03",
              title: "Secure Payment",
              desc: "Pay via Razorpay and instantly receive a secure access token at your registered email.",
            },
            {
              step: "04",
              title: "Download & Analyse",
              desc: "Use your token in the Download tab. Token is valid for 30 days from purchase.",
            },
          ].map((s) => (
            <div key={s.step}>
              <div className="w-9 h-9 bg-[#5F6FFF] rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3">
                {s.step}
              </div>
              <h4 className="font-semibold text-gray-800 text-sm mb-1">
                {s.title}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Datasets;
