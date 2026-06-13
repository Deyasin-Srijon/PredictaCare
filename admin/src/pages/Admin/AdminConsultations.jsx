import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

const STATUS_STYLE = {
  pending_payment: { bg: "#f1f5f9", text: "#64748b", label: "Pending Payment" },
  pending_assignment: {
    bg: "#fef3c7",
    text: "#d97706",
    label: " Needs Doctor",
  },
  assigned: { bg: "#dbeafe", text: "#2563eb", label: "Assigned" },
  accepted: { bg: "#dcfce7", text: "#16a34a", label: "Accepted ✓" },
  rejected: { bg: "#fee2e2", text: "#dc2626", label: "Rejected" },
  completed: { bg: "#dcfce7", text: "#16a34a", label: "Completed" },
  cancelled: { bg: "#f1f5f9", text: "#94a3b8", label: "Cancelled" },
};

export default function AdminConsultations() {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [assigning, setAssigning] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        axios.get(`${backendUrl}/api/consultations/admin/all`, {
          headers: { atoken: aToken },
        }),
        axios.get(`${backendUrl}/api/doctor/list`, {
          headers: { atoken: aToken },
        }),
      ]);
      if (c.data.success) setConsultations(c.data.consultations);
      if (d.data.success) setDoctors(d.data.doctors);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (consultationId) => {
    const docId = selectedDoc[consultationId];
    if (!docId) {
      toast.error("Please select a doctor");
      return;
    }

    const doctor = doctors.find((d) => d._id === docId);
    setAssigning(consultationId);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/consultations/admin/assign`,
        {
          consultationId,
          doctorId: docId,
          doctorName: doctor.name,
          doctorImage: doctor.image,
          speciality: doctor.speciality,
        },
        { headers: { atoken: aToken } },
      );
      if (data.success) {
        toast.success("Doctor assigned!");
        fetchData();
      } else toast.error(data.message);
    } catch {
      toast.error("Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  const filtered =
    filter === "all"
      ? consultations
      : consultations.filter((c) => c.status === filter);

  const stats = {
    total: consultations.length,
    needs: consultations.filter((c) => c.status === "pending_assignment")
      .length,
    accepted: consultations.filter((c) => c.status === "accepted").length,
    completed: consultations.filter((c) => c.status === "completed").length,
    revenue: consultations.filter((c) => c.paid).length * 299,
  };

  return (
    <div className="m-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Consultation Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign doctors to patient consultation requests
          </p>
        </div>
        <button
          onClick={fetchData}
          className="text-sm text-[#5F6FFF] border border-[#5F6FFF] px-4 py-1.5 rounded-full hover:bg-[#F2F3FF] transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-800" },
          { label: "Need Doctor", value: stats.needs, color: "text-amber-600" },
          { label: "Accepted", value: stats.accepted, color: "text-green-600" },
          {
            label: "Completed",
            value: stats.completed,
            color: "text-blue-600",
          },
          {
            label: "Revenue",
            value: `₹${stats.revenue}`,
            color: "text-[#5F6FFF]",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          "all",
          "pending_assignment",
          "assigned",
          "accepted",
          "completed",
          "rejected",
          "cancelled",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filter === f ? "bg-[#5F6FFF] text-white border-[#5F6FFF]" : "bg-white text-gray-500 border-gray-200 hover:border-[#5F6FFF]"}`}
          >
            {f === "all" ? "All" : STATUS_STYLE[f]?.label || f}
            {f === "pending_assignment" && stats.needs > 0 && (
              <span className="ml-1.5 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {stats.needs}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-xl">
          No consultations found
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_2fr] gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Patient</span>
            <span>Schedule</span>
            <span>Disease</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Assign Doctor</span>
          </div>

          {filtered.map((c, i) => {
            const ss = STATUS_STYLE[c.status] || STATUS_STYLE.pending_payment;
            return (
              <div key={c._id}>
                <div
                  className={`grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_2fr] gap-3 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  onClick={() => setExpanded(expanded === c._id ? null : c._id)}
                >
                  {/* Patient */}
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {c.userName}
                    </p>
                    <p className="text-xs text-gray-400">{c.userEmail}</p>
                  </div>

                  {/* Schedule */}
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      {new Date(c.scheduledDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-gray-400">{c.scheduledTime}</p>
                  </div>

                  {/* Disease */}
                  <p className="text-sm text-gray-600 capitalize">
                    {c.disease}
                  </p>

                  {/* Amount */}
                  <p className="text-sm font-semibold text-[#5F6FFF]">₹299</p>

                  {/* Status */}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full`}
                    style={{ background: ss.bg, color: ss.text }}
                  >
                    {ss.label}
                  </span>

                  {/* Assign doctor */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {c.status === "pending_assignment" ? (
                      <div className="flex gap-2">
                        <select
                          value={selectedDoc[c._id] || ""}
                          onChange={(e) =>
                            setSelectedDoc((s) => ({
                              ...s,
                              [c._id]: e.target.value,
                            }))
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 outline-none"
                        >
                          <option value="">Select doctor…</option>
                          {doctors
                            .filter((d) => {
                              const diseaseMap = {
                                diabetes: "Endocrinologist",
                                pcos: "Gynecologist",
                                heart: "Cardiologist",
                                stroke: "Neurologist",
                              };

                              return (
                                d.speciality?.toLowerCase() ===
                                diseaseMap[c.disease]?.toLowerCase()
                              );
                            })
                            .map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name} — {d.speciality}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleAssign(c._id)}
                          disabled={assigning === c._id}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                        >
                          {assigning === c._id ? "…" : "Assign"}
                        </button>
                      </div>
                    ) : c.doctorName ? (
                      <p className="text-sm text-gray-600">
                         {c.doctorName}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">—</p>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === c._id && (
                  <div className="px-6 py-4 bg-blue-50/40 border-b border-gray-100">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                          Prediction
                        </p>
                        <p className="text-gray-700">
                          {c.predictionResult || "N/A"} risk · {c.probability}%
                          probability
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                          Payment
                        </p>
                        <p className="text-gray-700">
                          {c.paid ? "✅ Paid" : "❌ Not paid"}
                        </p>
                        {c.razorpayPaymentId && (
                          <p className="text-xs text-gray-400">
                            {c.razorpayPaymentId}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                          Booking ID
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {c._id}
                        </p>
                      </div>
                      {c.doctorNotes && (
                        <div className="col-span-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                            Doctor Notes
                          </p>
                          <p className="text-gray-700">{c.doctorNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
