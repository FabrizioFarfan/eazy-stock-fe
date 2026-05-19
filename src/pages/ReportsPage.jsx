import { useState } from "react";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  useDailySummary,
  useSalesByProduct,
  useSalesByProvider,
  useReportsLowStock,
} from "../hooks/useReports";

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatCurrency(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(v);
}

function formatDate(str) {
  if (!str) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(str));
}

// ── shared sub-components ─────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorCls }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colorCls}`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

const TYPE_CONFIG = {
  PURCHASE_ENTRY: { label: "Entrada", cls: "bg-green-100 text-green-700" },
  SALE: { label: "Venta", cls: "bg-blue-100  text-blue-700" },
  ADJUSTMENT: { label: "Ajuste", cls: "bg-amber-100 text-amber-700" },
};

function MovementsTable({ movements }) {
  if (!movements?.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Sin movimientos en este período
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-3 py-3">Fecha</th>
            <th className="px-3 py-3">Producto</th>
            <th className="px-3 py-3 text-center">Tipo</th>
            <th className="px-3 py-3 text-center">Cantidad</th>
            <th className="px-3 py-3">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {movements.map((m) => {
            const cfg = TYPE_CONFIG[m.type] ?? {
              label: m.type,
              cls: "bg-gray-100 text-gray-600",
            };
            return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(m.createdAt)}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">
                  {m.productName}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}
                  >
                    {cfg.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-medium text-gray-700">
                  {m.quantity}
                </td>
                <td className="px-3 py-2 text-gray-500">
                  {m.createdByName ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab 1: Daily summary ──────────────────────────────────────────────────────

function TabDaily({ businessId }) {
  const [date, setDate] = useState(today());
  const params = { date, ...(businessId && { businessId }) };
  const { data, isLoading } = useDailySummary(params);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={ShoppingCart}
              label="Ventas realizadas"
              value={data?.totalSales ?? 0}
              colorCls="bg-blue-500"
            />
            <StatCard
              icon={Package}
              label="Items vendidos"
              value={data?.totalItemsSold ?? 0}
              colorCls="bg-indigo-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Ingresos"
              value={formatCurrency(data?.totalRevenue)}
              colorCls="bg-green-500"
            />
            <StatCard
              icon={ArrowUpDown}
              label="Movimientos del día"
              value={data?.movements?.length ?? 0}
              colorCls="bg-amber-500"
            />
          </div>
          <MovementsTable movements={data?.movements} />
        </>
      )}
    </div>
  );
}

// ── Tab 2: Sales by product ───────────────────────────────────────────────────

function TabByProduct({ businessId }) {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [reportParams, setReportParams] = useState(null);

  const { data, isLoading } = useSalesByProduct(reportParams, {
    enabled: !!reportParams,
  });

  const run = () =>
    setReportParams({ from, to, ...(businessId && { businessId }) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <button
          onClick={run}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Generar reporte
        </button>
      </div>

      {isLoading && (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      )}

      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 font-mono">SKU</th>
                  <th className="px-4 py-3 text-center">Unidades vendidas</th>
                  <th className="px-4 py-3 text-right">Ingresos totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr
                    key={row.productId ?? row.productName}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.productName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {row.productSku}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {row.totalQuantitySold}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">
                Ingresos por producto
              </h4>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, data.length * 36)}
              >
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `S/ ${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => [formatCurrency(v), "Ingresos"]} />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#f97316"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab 3: Sales by provider ──────────────────────────────────────────────────

function TabByProvider({ businessId }) {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [reportParams, setReportParams] = useState(null);

  const { data, isLoading } = useSalesByProvider(reportParams, {
    enabled: !!reportParams,
  });

  const run = () =>
    setReportParams({ from, to, ...(businessId && { businessId }) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <button
          onClick={run}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Generar reporte
        </button>
      </div>

      {isLoading && (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      )}

      {data && !isLoading && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-center">Productos distintos</th>
                  <th className="px-4 py-3 text-center">Unidades vendidas</th>
                  <th className="px-4 py-3 text-right">Ingresos totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <tr key={row.providerName} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.providerName}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {row.productCount}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {row.totalQuantitySold}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(row.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-sm font-semibold text-gray-700">
                Ingresos por proveedor
              </h4>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, data.length * 36)}
              >
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `S/ ${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="providerName"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v) => [formatCurrency(v), "Ingresos"]} />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#f97316"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab 4: Low stock ──────────────────────────────────────────────────────────

function TabLowStock({ businessId }) {
  const params = { size: 50, ...(businessId && { businessId }) };
  const { data, isLoading } = useReportsLowStock(params);
  const items = data?.content ?? [];

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertTriangle size={36} className="text-gray-200" />
          <p className="text-sm text-gray-400">
            No hay productos con stock bajo
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-center">Stock actual</th>
                <th className="px-4 py-3 text-center">Stock mínimo</th>
                <th className="px-4 py-3 text-center">Déficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.productName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {p.productSku}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.brand || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.providerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-red-600">
                      {p.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {p.minStock}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      -{p.deficit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "daily", label: "Resumen del día" },
  { id: "by-product", label: "Por producto" },
  { id: "by-provider", label: "Por proveedor" },
  { id: "low-stock", label: "Stock bajo" },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("daily");
  const businessId =
    user?.role === "SUPER_ADMIN" ? user?.businessId : undefined;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold text-gray-900">Reportes</h2>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "daily" && <TabDaily businessId={businessId} />}
        {activeTab === "by-product" && <TabByProduct businessId={businessId} />}
        {activeTab === "by-provider" && (
          <TabByProvider businessId={businessId} />
        )}
        {activeTab === "low-stock" && <TabLowStock businessId={businessId} />}
      </div>
    </div>
  );
}
