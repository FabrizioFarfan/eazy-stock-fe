import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Package,
  Edit,
  QrCode,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProducts, useDeactivateProduct } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import ProductFormModal from "../components/products/ProductFormModal";
import QrModal from "../components/products/QrModal";

function formatCurrency(value) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
}

// ── sub-components ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

function StockBadge({ current, min }) {
  const isLow = current <= min;
  return isLow ? (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Bajo ({current})
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      {current}
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Activo
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
      Inactivo
    </span>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const canMutate = (u) => u?.role === "OWNER" || (u?.role === "SUPER_ADMIN" && !!u?.businessId);

export default function ProductsPage() {
  const { user } = useAuth();
  const isManager = canMutate(user);

  // ── filter state
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active"); // active | inactive | all
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  // reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, lowStock, statusFilter]);

  // ── modal state
  const [formModal, setFormModal] = useState({ open: false, product: null });
  const [qrModal, setQrModal] = useState(null); // product | null

  // ── query params
  const params = {
    page,
    size: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(lowStock && { lowStock: true }),
    ...(statusFilter !== "all" && { active: statusFilter === "active" }),
    ...(user?.role === "SUPER_ADMIN" &&
      user?.businessId && { businessId: user.businessId }),
  };

  const { data, isLoading, isFetching } = useProducts(params);
  const deactivate = useDeactivateProduct();

  const products = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  // ── handlers
  const openCreate = () => setFormModal({ open: true, product: null });
  const openEdit = (p) => setFormModal({ open: true, product: p });
  const closeForm = () => setFormModal({ open: false, product: null });

  const handleDeactivate = useCallback(
    (p) => {
      if (!window.confirm(`¿Desactivar "${p.name}"?`)) return;
      deactivate.mutate(p.id);
    },
    [deactivate],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
          {!isLoading && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {totalElements}
            </span>
          )}
        </div>
        {isManager && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={15} />
            Nuevo producto
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Low stock toggle */}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="accent-orange-500"
          />
          <span className="text-gray-700">Stock bajo</span>
        </label>

        {/* Status select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {/* ── Table card ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Estado</th>
                {isManager && (
                  <th className="px-4 py-3 text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 9 : 8}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <Package size={40} className="text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">
                        No hay productos aún
                      </p>
                      {isManager && (
                        <button
                          onClick={openCreate}
                          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                          Crear primer producto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-gray-50 ${isFetching ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.brandName || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                      {p.supplierName || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(p.purchasePrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(p.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockBadge current={p.currentStock} min={p.minStock} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge active={p.active} />
                    </td>
                    {isManager && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            title="Editar"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => setQrModal(p)}
                            title="Código QR"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <QrCode size={15} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p)}
                            title="Desactivar"
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              Mostrando{" "}
              <span className="font-medium">
                {from}–{to}
              </span>{" "}
              de <span className="font-medium">{totalElements}</span> productos
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <span className="px-2 text-sm text-gray-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formModal.open && (
        <ProductFormModal product={formModal.product} onClose={closeForm} />
      )}
      {qrModal && (
        <QrModal product={qrModal} onClose={() => setQrModal(null)} />
      )}
    </div>
  );
}
