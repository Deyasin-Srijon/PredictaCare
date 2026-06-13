import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import workingBrain from "../assets/working brain.json";
import heart from "../assets/Human Heart.json";
import diabetes from "../assets/Diabetes Blood Cells.json";
import pcos from "../assets/Uterus.json";
import Lottie from "lottie-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const STATUS_STYLE = {
  pending_payment: { bg: "#f1f5f9", text: "#64748b", label: "Pending Payment" },
  pending_assignment: {
    bg: "#fffbeb",
    text: "#d97706",
    label: "Finding Doctor",
  },
  assigned: { bg: "#eff6ff", text: "#2563eb", label: "Doctor Assigned" },
  accepted: { bg: "#f0fdf4", text: "#16a34a", label: "Confirmed ✓" },
  rejected: { bg: "#fef2f2", text: "#dc2626", label: "Rejected" },
  completed: { bg: "#f0fdf4", text: "#16a34a", label: "Completed" },
  cancelled: { bg: "#f1f5f9", text: "#94a3b8", label: "Cancelled" },
};

const DISEASE_ANIMATIONS = {
  heart: heart,
  diabetes: diabetes,
  pcos: pcos,
  stroke: workingBrain,
};

export default function MyConsultations() {
  const { token } = useContext(AppContext);
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/consultations/my`, {
        headers: { token },
      });
      if (data.success) setConsultations(data.consultations);
    } catch {
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCall = (id) => navigate(`/video-call/${id}`);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this consultation?")) return;
    try {
      await axios.post(
        `${BACKEND_URL}/api/consultations/cancel`,
        { consultationId: id },
        { headers: { token } },
      );
      toast.success("Consultation cancelled");
      fetchConsultations();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const handleRate = async (id) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/consultations/rate`,
        { consultationId: id, rating: rating[id], feedback: feedback[id] },
        { headers: { token } },
      );
      toast.success("Rating submitted!");
      fetchConsultations();
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  const isCallTime = (c) => {
    if (c.status !== "accepted") return false;
    const scheduled = new Date(
      `${c.scheduledDate.split("T")[0]} ${c.scheduledTime}`,
    );
    const now = new Date();
    const diff = Math.abs(scheduled - now) / 60000;
    return diff <= 15;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#4F5FE0,#5F6FFF)",
          padding: "40px 24px 56px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 6px",
            }}
          >
            My Consultations
          </h1>
          <p
            style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0 }}
          >
            View and manage your doctor consultations
          </p>
        </div>
      </div>

      <div
        style={{ maxWidth: 860, margin: "-28px auto 48px", padding: "0 24px" }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "#fff",
              borderRadius: 20,
              border: "1.5px solid #e2e8f0",
            }}
          >
            <p style={{ color: "#94a3b8" }}>Loading consultations…</p>
          </div>
        ) : consultations.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "#fff",
              borderRadius: 20,
              border: "1.5px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚕️</div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#334155",
                margin: "0 0 8px",
              }}
            >
              No consultations yet
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>
              Book a consultation after your next prediction
            </p>
            <button
              onClick={() => navigate("/prediction")}
              style={{
                padding: "10px 24px",
                borderRadius: 12,
                background: "#5F6FFF",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Go to DiagnoAI →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {consultations.map((c) => {
              const ss = STATUS_STYLE[c.status] || STATUS_STYLE.pending_payment;
              const canJoin = c.status === "accepted";
              return (
                <div
                  key={c._id}
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    border: "1.5px solid #e2e8f0",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ padding: "18px 20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      {/* Left */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: "#EEF2FF",
                            border: "1.5px solid #C7D2FE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          <Lottie
                            animationData={DISEASE_ANIMATIONS[c.disease] || " "}
                            loop
                            autoplay
                            speed={0.7}
                            style={{
                              width: 56,
                              height: 56,
                            }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#0f172a",
                              margin: "0 0 4px",
                              textTransform: "capitalize",
                            }}
                          >
                            {c.disease} Consultation
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#94a3b8",
                              margin: 0,
                            }}
                          >
                            {new Date(c.scheduledDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            · {c.scheduledTime}
                          </p>
                          {c.doctorName && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "#5F6FFF",
                                fontWeight: 600,
                                margin: "4px 0 0",
                              }}
                            >
                               {c.doctorName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: ss.bg,
                            color: ss.text,
                          }}
                        >
                          {ss.label}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {canJoin && (
                            <button
                              onClick={() => handleJoinCall(c._id)}
                              style={{
                                padding: "6px 16px",
                                borderRadius: 10,
                                border: "none",
                                background: "#5F6FFF",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                animation: "pulse 1.5s infinite",
                              }}
                            >
                              Join Call
                            </button>
                          )}
                          {[
                            "pending_payment",
                            "pending_assignment",
                            "assigned",
                          ].includes(c.status) && (
                            <button
                              onClick={() => handleCancel(c._id)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 10,
                                border: "1.5px solid #fca5a5",
                                background: "#fef2f2",
                                color: "#dc2626",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Doctor notes after completion */}
                    {c.status === "completed" && (
                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {c.doctorNotes && (
                          <div
                            style={{
                              padding: "12px 14px",
                              borderRadius: 10,
                              background: "#EEF2FF",
                              border: "1px solid #C7D2FE",
                              fontSize: 13,
                              color: "#3730A3",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: 700,
                                margin: "0 0 4px",
                                fontSize: 12,
                                color: "#5F6FFF",
                              }}
                            >
                              🩺 Doctor Notes
                            </p>
                            <p style={{ margin: 0 }}>{c.doctorNotes}</p>
                          </div>
                        )}

                        {c.prescription && (
                          <div
                            style={{
                              padding: "12px 14px",
                              borderRadius: 10,
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              fontSize: 13,
                              color: "#92400e",
                            }}
                          >
                            <p
                              style={{
                                fontWeight: 700,
                                margin: "0 0 4px",
                                fontSize: 12,
                                color: "#d97706",
                              }}
                            >
                              Prescription
                            </p>
                            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                              {c.prescription}
                            </p>
                          </div>
                        )}

                        {c.followUpRequired && (
                          <div
                            style={{
                              padding: "10px 14px",
                              borderRadius: 10,
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              fontSize: 13,
                              color: "#1e40af",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span>📅</span>
                            <span>
                              <strong>Follow-up recommended</strong> — please
                              book another consultation
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {c.status === "rejected" && c.rejectionReason && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          fontSize: 13,
                          color: "#dc2626",
                        }}
                      >
                        Reason: {c.rejectionReason}
                      </div>
                    )}

                    {/* Rating */}
                    {c.status === "completed" && !c.rating && (
                      <div style={{ marginTop: 14 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#94a3b8",
                            margin: "0 0 8px",
                          }}
                        >
                          Rate your consultation:
                        </p>
                        <div
                          style={{ display: "flex", gap: 6, marginBottom: 8 }}
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() =>
                                setRating((r) => ({ ...r, [c._id]: s }))
                              }
                              style={{
                                fontSize: 22,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                opacity: (rating[c._id] || 0) >= s ? 1 : 0.3,
                              }}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            value={feedback[c._id] || ""}
                            onChange={(e) =>
                              setFeedback((f) => ({
                                ...f,
                                [c._id]: e.target.value,
                              }))
                            }
                            placeholder="Optional feedback..."
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1.5px solid #e2e8f0",
                              fontSize: 13,
                              outline: "none",
                              fontFamily: "inherit",
                            }}
                          />
                          <button
                            onClick={() => handleRate(c._id)}
                            disabled={!rating[c._id]}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: "none",
                              background: "#5F6FFF",
                              color: "#fff",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              opacity: rating[c._id] ? 1 : 0.5,
                            }}
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                    {c.rating && (
                      <p
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          color: "#94a3b8",
                        }}
                      >
                        Your rating: {"⭐".repeat(c.rating)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
