"use client";

import { useEffect, useRef, useState } from "react";
import {
  prepareProductCategoryCreation,
  confirmProductCategoryCreation,
  deleteProductCategory,
  getAllProductsForAdmin,
  approveProduct,
  rejectProduct,
  deleteProduct,
} from "@/services/admin/AdminProductsService";
import { getProductCategories } from "@/services/ProductCategoryService";
import { getProductDetail } from "@/services/ProductService";
import { fileUploadService } from "@/services/FileUploadService";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";
import {
  ProductSummaryResponseDTO,
  ProductResponseDTO,
  ProductStatus,
} from "@/types/products/Product.types";

// ─────────────────────────────────────────────
// TIPOS LOCALES
// ─────────────────────────────────────────────

type PageStatus = "idle" | "preparing" | "uploading" | "creating" | "success" | "error";
type AdminTab = "products" | "categories";
type ActionType = "approve" | "reject" | "delete" | null;

interface CreateCategoryState {
  status: PageStatus;
  progress: number;
  error?: string;
}

interface ProductActionState {
  productId: number | null;
  action: ActionType;
  reason: string;
  loading: boolean;
}

interface ProductDetailState {
  product: ProductResponseDTO | null;
  loading: boolean;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: "Activo",
  [ProductStatus.PENDING]: "Pendiente",
  [ProductStatus.REJECTED]: "Rechazado",
  [ProductStatus.INACTIVE]: "Inactivo",
};

const STATUS_STYLES: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: "bg-green-50 text-green-700 border-green-200",
  [ProductStatus.PENDING]: "bg-yellow-50 text-yellow-700 border-yellow-200",
  [ProductStatus.REJECTED]: "bg-red-50 text-red-700 border-red-200",
  [ProductStatus.INACTIVE]: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_DOT: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: "bg-green-500",
  [ProductStatus.PENDING]: "bg-yellow-500",
  [ProductStatus.REJECTED]: "bg-red-500",
  [ProductStatus.INACTIVE]: "bg-gray-400",
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

export default function AdminProductsPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  // ── Estado categorías ──────────────────────
  const [categories, setCategories] = useState<ProductCategoryResponseDTO[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [catName, setCatName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createCatState, setCreateCatState] = useState<CreateCategoryState>({ status: "idle", progress: 0 });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<number | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Estado productos ───────────────────────
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProductStatus>(ProductStatus.PENDING);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  // ── Estado acción sobre producto ───────────
  const [actionState, setActionState] = useState<ProductActionState>({
    productId: null,
    action: null,
    reason: "",
    loading: false,
  });

  // ── Estado detalle producto ────────────────
  const [detailState, setDetailState] = useState<ProductDetailState>({
    product: null,
    loading: false,
  });

  const isCreatingCat = ["preparing", "uploading", "creating"].includes(createCatState.status);

  // ─────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeTab === "products") loadProducts();
  }, [activeTab, statusFilter, currentPage]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ─────────────────────────────────────────────
  // LOADERS
  // ─────────────────────────────────────────────

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      setCategories(await getProductCategories());
    } catch (e) {
      console.error("Error cargando categorías:", e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await getAllProductsForAdmin(statusFilter, currentPage, PAGE_SIZE);
      setProducts(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalElements(res.meta.totalElements);
    } catch (e) {
      console.error("Error cargando productos:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ─────────────────────────────────────────────
  // CATEGORÍAS — HANDLERS
  // ─────────────────────────────────────────────

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetCatForm = () => {
    setCatName("");
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCreateCatState({ status: "idle", progress: 0 });
    setShowCreateForm(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    try {
      setCreateCatState({ status: "preparing", progress: 0 });
      const { assetId, imagePermission } = await prepareProductCategoryCreation({
        originalFileName: image.name,
        contentType: image.type,
        sizeBytes: image.size,
      });
      setCreateCatState({ status: "uploading", progress: 0 });
      await fileUploadService.uploadToR2(imagePermission.uploadUrl, image, (progress) => {
        setCreateCatState({ status: "uploading", progress: progress * 0.9 });
      });
      setCreateCatState({ status: "creating", progress: 90 });
      await confirmProductCategoryCreation({
        productCategoryAssetId: assetId,
        productCategoryData: { name: catName },
      });
      setCreateCatState({ status: "success", progress: 100 });
      await loadCategories();
      setTimeout(resetCatForm, 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al crear la categoría";
      setCreateCatState({ status: "error", progress: 0, error: msg });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setDeletingCatId(id);
    try {
      await deleteProductCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingCatId(null);
      setConfirmDeleteCatId(null);
    }
  };

  // ─────────────────────────────────────────────
  // PRODUCTOS — HANDLERS
  // ─────────────────────────────────────────────

  const openAction = (productId: number, action: ActionType) => {
    setActionState({ productId, action, reason: "", loading: false });
  };

  const closeAction = () => {
    setActionState({ productId: null, action: null, reason: "", loading: false });
  };

  const openDetail = async (productId: number) => {
    setDetailState({ product: null, loading: true });
    try {
      const product = await getProductDetail(productId);
      setDetailState({ product, loading: false });
    } catch {
      setDetailState({ product: null, loading: false });
    }
  };

  const closeDetail = () => setDetailState({ product: null, loading: false });

  const handleProductAction = async () => {
    const { productId, action, reason } = actionState;
    if (!productId || !action) return;
    if ((action === "reject" || action === "delete") && !reason.trim()) return;

    setActionState((prev) => ({ ...prev, loading: true }));
    try {
      if (action === "approve") await approveProduct(productId);
      else if (action === "reject") await rejectProduct(productId, reason);
      else if (action === "delete") await deleteProduct(productId, reason);
      closeAction();
      closeDetail();
      await loadProducts();
    } catch {
      setActionState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleStatusFilterChange = (status: ProductStatus) => {
    setStatusFilter(status);
    setCurrentPage(0);
  };

  // ─────────────────────────────────────────────
  // LABELS
  // ─────────────────────────────────────────────

  const catStatusLabel: Record<string, string> = {
    preparing: "Preparando...",
    uploading: `Subiendo imagen... ${Math.round(createCatState.progress)}%`,
    creating: "Creando categoría...",
    success: "¡Categoría creada!",
  };

  const actionMeta: Record<string, { title: string; confirm: string; btnStyle: string }> = {
    approve: { title: "Aprobar producto", confirm: "Aprobar", btnStyle: "bg-green-600 hover:bg-green-700" },
    reject:  { title: "Rechazar producto", confirm: "Rechazar", btnStyle: "bg-red-600 hover:bg-red-700" },
    delete:  { title: "Eliminar producto", confirm: "Eliminar", btnStyle: "bg-red-700 hover:bg-red-800" },
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Productos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Administra productos y categorías del marketplace
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["products", "categories"] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "products" ? "Productos" : "Categorías"}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: PRODUCTOS
      ══════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-4">

          {/* Filtros de estado */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.values(ProductStatus).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  statusFilter === status
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-violet-400"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {totalElements} producto{totalElements !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {loadingProducts ? (
              <div className="py-16 text-center text-sm text-gray-400">Cargando productos...</div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No hay productos con estado {STATUS_LABELS[statusFilter].toLowerCase()}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-left">Comerciante</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-9 w-9 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                          )}
                          <button
                            onClick={() => openDetail(p.id)}
                            className="font-medium text-gray-800 hover:text-violet-600 text-left transition"
                          >
                            {p.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.companyName}</td>
                      <td className="px-4 py-3 text-gray-500">{p.categoryName}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        ${p.price.toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs border px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === ProductStatus.PENDING && (
                            <>
                              <button
                                onClick={() => openAction(p.id, "approve")}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => openAction(p.id, "reject")}
                                className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {p.status !== ProductStatus.INACTIVE && p.status !== ProductStatus.PENDING && (
                            <button
                              onClick={() => openAction(p.id, "delete")}
                              className="text-xs border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 px-3 py-1 rounded-lg transition"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Paginador */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 0}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: CATEGORÍAS
      ══════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <span className="text-lg leading-none">+</span>
              Nueva categoría
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Crear nueva categoría</h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Ej: Videojuegos, Software..."
                      required
                      disabled={isCreatingCat}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen *</label>
                    <label className="flex items-center gap-3 border border-dashed border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50 transition">
                      {imagePreview ? (
                        <img src={imagePreview} alt="preview" className="h-8 w-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-gray-400 text-lg">🖼</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-500 truncate">
                        {image ? image.name : "Seleccionar imagen"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={isCreatingCat}
                      />
                    </label>
                  </div>
                </div>

                {isCreatingCat && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${createCatState.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">{catStatusLabel[createCatState.status]}</p>
                  </div>
                )}

                {createCatState.status === "success" && (
                  <p className="text-xs text-green-600 text-center font-medium">✓ {catStatusLabel.success}</p>
                )}

                {createCatState.status === "error" && (
                  <p className="text-xs text-red-600 text-center">{createCatState.error}</p>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={resetCatForm}
                    disabled={isCreatingCat}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCat || !catName || !image}
                    className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCat ? catStatusLabel[createCatState.status] : "Crear categoría"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700">Categorías registradas</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {categories.length} categorías
              </span>
            </div>

            {loadingCategories ? (
              <div className="py-16 text-center text-sm text-gray-400">Cargando categorías...</div>
            ) : categories.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No hay categorías registradas aún.</p>
                <button onClick={() => setShowCreateForm(true)} className="mt-3 text-violet-600 text-sm hover:underline">
                  Crear la primera
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">Imagen</th>
                    <th className="px-6 py-3 text-left">Nombre</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">🖼</div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-800">{cat.name}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Activa
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {confirmDeleteCatId === cat.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">¿Confirmar?</span>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deletingCatId === cat.id}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              {deletingCatId === cat.id ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCatId(null)}
                              className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteCatId(cat.id)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: DETALLE PRODUCTO
      ══════════════════════════════════════════ */}
      {(detailState.product || detailState.loading) && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeDetail}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailState.loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Cargando...</div>
            ) : detailState.product ? (
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-800">{detailState.product.name}</h2>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0">×</button>
                </div>

                {detailState.product.imageUrl && (
                  <img
                    src={detailState.product.imageUrl}
                    alt={detailState.product.name}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Precio</span>
                    <p className="font-medium text-gray-800">${detailState.product.price.toLocaleString("es-CO")}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Categoría</span>
                    <p className="font-medium text-gray-800">{detailState.product.categoryName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Comerciante</span>
                    <p className="font-medium text-gray-800">{detailState.product.shopName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Stock disponible</span>
                    <p className="font-medium text-gray-800">{detailState.product.stock}</p>
                  </div>
                </div>

                {detailState.product.description && (
                  <div>
                    <span className="text-gray-400 text-xs">Descripción</span>
                    <p className="text-sm text-gray-700 mt-1">{detailState.product.description}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { closeDetail(); openAction(detailState.product!.id, "approve"); }}
                    className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => { closeDetail(); openAction(detailState.product!.id, "reject"); }}
                    className="flex-1 text-sm border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg transition"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => { closeDetail(); openAction(detailState.product!.id, "delete"); }}
                    className="flex-1 text-sm border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 py-2 rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: CONFIRMAR ACCIÓN
      ══════════════════════════════════════════ */}
      {actionState.action && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeAction}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {actionMeta[actionState.action].title}
              </h3>
              <button onClick={closeAction} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {actionState.action === "approve" ? (
              <p className="text-sm text-gray-600">
                ¿Confirmas que deseas aprobar este producto? Quedará visible para los consumidores inmediatamente.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {actionState.action === "reject"
                    ? "El comerciante recibirá una notificación con la razón del rechazo."
                    : "El comerciante recibirá una notificación con la razón de la eliminación."}
                </p>
                <label className="block text-sm font-medium text-gray-700">Razón *</label>
                <textarea
                  value={actionState.reason}
                  onChange={(e) => setActionState((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explica al comerciante el motivo..."
                  rows={3}
                  disabled={actionState.loading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none disabled:opacity-50"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeAction}
                disabled={actionState.loading}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleProductAction}
                disabled={
                  actionState.loading ||
                  ((actionState.action === "reject" || actionState.action === "delete") &&
                    !actionState.reason.trim())
                }
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${actionMeta[actionState.action].btnStyle}`}
              >
                {actionState.loading ? "Procesando..." : actionMeta[actionState.action].confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}