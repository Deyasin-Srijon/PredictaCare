import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

const STATUS_COLORS = {
  pending_payment: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    label: "Pending Payment",
  },
  active: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Active",
  },
  expired: {
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    label: "Expired",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    label: "Cancelled",
  },
};

const Badge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending_payment;
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
    </span>
  );
};

const AdminResearchOrders = () => {
  const { aToken, backendUrl } = useContext(AdminContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [activatingId, setActivatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        backendUrl + "/api/research/admin/orders",
        {
          headers: { atoken: aToken },
        },
      );
      if (data.success) setOrders(data.orders);
      else toast.error(data.message);
    } catch (err) {
      toast.error("Failed to load research orders");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (orderId) => {
    setActivatingId(orderId);
    try {
      const { data } = await axios.post(
        backendUrl + "/api/research/admin/activate",
        { orderId },
        { headers: { atoken: aToken } },
      );
      if (data.success) {
        toast.success("Order activated — access token sent");
        fetchOrders();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to activate order");
    } finally {
      setActivatingId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    const warning = order?.paid
      ? "This order was ALREADY PAID. Cancel only if you have issued a refund. Proceed?"
      : "Cancel this order?";
    if (!window.confirm(warning)) return;
    try {
      const { data } = await axios.post(
        backendUrl + "/api/research/admin/cancel",
        { orderId, wasRefunded: order?.paid },
        { headers: { atoken: aToken } },
      );
      if (data.success) {
        toast.success(
          order?.paid
            ? "Order cancelled — mark refund in your records"
            : "Order cancelled",
        );
        fetchOrders();
      } else toast.error(data.message);
    } catch (err) {
      toast.error("Failed to cancel order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending_payment").length,
    active: orders.filter((o) => o.status === "active").length,
    invoice: orders.filter(
      (o) => o.invoiceRequested && o.status === "pending_payment",
    ).length,
    revenue: orders.filter((o) => o.paid).reduce((sum, o) => sum + o.amount, 0),
  };

  return (
    <div className="m-5">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Research Orders
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage dataset purchase orders from researchers
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm text-[#5F6FFF] border border-[#5F6FFF] px-4 py-1.5 rounded-full hover:bg-[#F2F3FF] transition-all"
        >
          Refresh
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: stats.total, color: "text-gray-800" },
          {
            label: "Pending Invoice",
            value: stats.invoice,
            color: "text-yellow-600",
          },
          { label: "Active", value: stats.active, color: "text-green-600" },
          {
            label: "Revenue",
            value: `₹${(stats.revenue / 100).toFixed(0)}`,
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

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending_payment", "active", "expired", "cancelled"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filter === f ? "bg-[#5F6FFF] text-white border-[#5F6FFF]" : "bg-white text-gray-500 border-gray-200 hover:border-[#5F6FFF]"}`}
            >
              {f === "all" ? "All" : STATUS_COLORS[f]?.label}
              {f === "pending_payment" && stats.invoice > 0 && (
                <span className="ml-1.5 bg-yellow-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {stats.invoice}
                </span>
              )}
            </button>
          ),
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-xl">
          No orders found
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Researcher</span>
            <span>Institution</span>
            <span>Records</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filtered.map((order, i) => (
            <div key={order._id}>
              {/* Row */}
              <div
                className={`grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1.5fr] gap-3 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                onClick={() =>
                  setExpandedId(expandedId === order._id ? null : order._id)
                }
              >
                {/* Researcher */}
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {order.name}
                  </p>
                  <p className="text-xs text-gray-400">{order.email}</p>
                  {order.invoiceRequested && (
                    <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded mt-1 inline-block">
                      🧾 Invoice Requested
                    </span>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <p className="text-sm text-gray-600 truncate">
                    {order.institution}
                  </p>
                  {order.status === "cancelled" && order.paid && (
                    <span className="text-[10px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded mt-1 inline-block">
                      💸 Paid — Refund Required
                    </span>
                  )}
                </div>

                {/* Records */}
                <p className="text-sm font-semibold text-gray-700">
                  {order.recordCount?.toLocaleString()}
                </p>

                {/* Amount */}
                <p className="text-sm font-semibold text-[#5F6FFF]">
                  ₹{(order.amount / 100).toFixed(0)}
                </p>

                {/* Status */}
                <Badge status={order.status} />

                {/* Actions */}
                <div
                  className="flex gap-2 flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Mark as paid — only for invoice + pending */}
                  {order.invoiceRequested &&
                    order.status === "pending_payment" && (
                      <button
                        onClick={() => markAsPaid(order._id)}
                        disabled={activatingId === order._id}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full font-semibold transition-all disabled:opacity-50"
                      >
                        {activatingId === order._id ? "…" : "✓ Mark Paid"}
                      </button>
                    )}

                  {/* Copy access token */}
                  {order.accessToken && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.accessToken);
                        toast.success("Token copied!");
                      }}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full font-semibold transition-all"
                    >
                      Copy Token
                    </button>
                  )}

                  {/* Cancel */}
                  {["pending_payment", "active"].includes(order.status) && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${
                        order.paid
                          ? "bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-300"
                          : "bg-red-50 hover:bg-red-100 text-red-500 border-red-200"
                      }`}
                    >
                      {order.paid ? "⚠️ Cancel & Refund" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Expanded detail row ──────────────────────────────── */}
              {expandedId === order._id && (
                <div className="px-6 py-4 bg-blue-50/40 border-b border-gray-100">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                        Research Purpose
                      </p>
                      <p className="text-gray-700">{order.purpose}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                        Dataset Filters
                      </p>
                      <p className="text-gray-700">
                        Diseases: {order.diseases?.join(", ")}
                      </p>
                      <p className="text-gray-700">Tier: {order.tierFilter}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                        Payment
                      </p>
                      <p className="text-gray-700">Type: {order.paymentType}</p>
                      <p className="text-gray-700">
                        Paid: {order.paid ? "✅ Yes" : "❌ No"}
                      </p>
                      {order.razorpayPaymentId && (
                        <p className="text-gray-500 text-xs">
                          ID: {order.razorpayPaymentId}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                        Access
                      </p>
                      {order.accessToken ? (
                        <>
                          <p className="text-gray-700 text-xs font-mono break-all">
                            {order.accessToken}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Downloads: {order.downloadCount} · Expires:{" "}
                            {order.expiresAt
                              ? new Date(order.expiresAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400">Not activated yet</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                        Order Info
                      </p>
                      <p className="text-gray-500 text-xs">ID: {order._id}</p>
                      <p className="text-gray-500 text-xs">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminResearchOrders;
