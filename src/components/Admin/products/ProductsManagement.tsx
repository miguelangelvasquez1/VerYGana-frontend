"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import {
  prepareProductCategoryCreation,
  confirmProductCategoryCreation,
  deleteProductCategory,
  getAllProductsForAdmin,
  approveProduct,
  rejectProduct,
  deleteProduct,
  recoverProductCategory,
  getInactiveProductCategories,
} from "@/services/admin/AdminProductsService";
import { getActiveProductCategories } from "@/services/ProductCategoryService";
import { getProductDetail } from "@/services/ProductService";
import { getProductReviewsByProductId, hideProductReview } from "@/services/ProductReviewService";
import { useSession } from "next-auth/react";
import { fileUploadService } from "@/services/FileUploadService";
import { useAdminSectionSearch } from "@/context/AdminSearchContext";
import { ProductCategoryResponseDTO } from "@/types/products/ProductCategory.types";
import {
  ProductSummaryResponseDTO,
  ProductResponseDTO,
  ProductStatus,
} from "@/types/products/Product.types";
import { ProductReviewResponseDTO } from "@/types/products/ProductReview.types";

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
  status: ProductStatus | null;
  loading: boolean;
}

interface ReviewsState {
  open: boolean;
  productId: number | null;
  reviews: ProductReviewResponseDTO[];
  loading: boolean;
  hidingId: number | null;
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
  const { data: session } = useSession();
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

  // ── Estado categorías inactivas ────────────
  const [inactiveCategories, setInactiveCategories] = useState<ProductCategoryResponseDTO[]>([]);
  const [loadingInactiveCategories, setLoadingInactiveCategories] = useState(false);
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);
  const [recoveringCatId, setRecoveringCatId] = useState<number | null>(null);

  // ── Estado productos ───────────────────────
  const [products, setProducts] = useState<ProductSummaryResponseDTO[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  const { searchTerm } = useAdminSectionSearch("Buscar productos por nombre...");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

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
    status: null,
    loading: false,
  });

  // ── Estado reseñas producto ─────────────────
  const [reviewsState, setReviewsState] = useState<ReviewsState>({
    open: false,
    productId: null,
    reviews: [],
    loading: false,
    hidingId: null,
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
  }, [activeTab, statusFilter, debouncedSearch, currentPage]);

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
      setCategories(await getActiveProductCategories());
    } catch (e) {
      console.error("Error cargando categorías:", e);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await getAllProductsForAdmin(statusFilter, debouncedSearch || undefined, currentPage, PAGE_SIZE);
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

  const loadInactiveCategories = async () => {
    setLoadingInactiveCategories(true);
    try {
      setInactiveCategories(await getInactiveProductCategories());
    } catch (e) {
      console.error("Error cargando categorías inactivas:", e);
    } finally {
      setLoadingInactiveCategories(false);
    }
  };

  const handleToggleInactiveCategories = () => {
    if (!showInactiveCategories) loadInactiveCategories();
    setShowInactiveCategories((v) => !v);
  };

  const handleRecoverCategory = async (id: number) => {
    setRecoveringCatId(id);
    try {
      await recoverProductCategory(id);
      setInactiveCategories((prev) => prev.filter((c) => c.id !== id));
      await loadCategories();
    } finally {
      setRecoveringCatId(null);
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

  const openDetail = async (summary: ProductSummaryResponseDTO) => {
    setDetailState({ product: null, status: summary.status, loading: true });
    try {
      const product = await getProductDetail(summary.id);
      setDetailState({ product, status: summary.status, loading: false });
    } catch {
      setDetailState({ product: null, status: null, loading: false });
    }
  };

  const closeDetail = () => setDetailState({ product: null, status: null, loading: false });

  const openReviews = async (productId: number) => {
    setReviewsState({ open: true, productId, reviews: [], loading: true, hidingId: null });
    try {
      const res = await getProductReviewsByProductId(productId, 0, 50);
      setReviewsState((prev) => ({ ...prev, reviews: res.data, loading: false }));
    } catch {
      setReviewsState((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeReviews = () => {
    setReviewsState({ open: false, productId: null, reviews: [], loading: false, hidingId: null });
  };

  const handleHideReview = async (reviewId: number) => {
    setReviewsState((prev) => ({ ...prev, hidingId: reviewId }));
    try {
      await hideProductReview(reviewId);
      setReviewsState((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== reviewId),
        hidingId: null,
      }));
    } catch {
      setReviewsState((prev) => ({ ...prev, hidingId: null }));
    }
  };

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

  const handleStatusFilterChange = (status: ProductStatus | undefined) => {
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
    approve: { title: "Aprobar producto", confirm: "Aprobar", btnStyle: "bg-green-600 hover:bg-green-700 cursor-pointer" },
    reject: { title: "Rechazar producto", confirm: "Rechazar", btnStyle: "bg-red-600 hover:bg-red-700 cursor-pointer" },
    delete: { title: "Eliminar producto", confirm: "Eliminar", btnStyle: "bg-red-700 hover:bg-red-800 cursor-pointer" },
  };

  const token: string | undefined = (session as any)?.accessToken;

  // Para URLs proxy (/private-image) añade ?token=JWT para que el backend
  // valide via JwtBearerFilter y redirija 302 a R2. El <img> tag (no-cors)
  // sigue el redirect sin activar CORS. Para URLs públicas de CDN, no cambia nada.
  function privateImageSrc(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    if (url.includes('/private-image')) {
      if (!token) return undefined;
      return `${url}?token=${encodeURIComponent(token)}`;
    }
    return url;
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["products", "categories"] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px cursor-pointer ${activeTab === tab
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
            <button
              onClick={() => handleStatusFilterChange(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${statusFilter === undefined
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-violet-400"
                }`}
            >
              Todos
            </button>
            {Object.values(ProductStatus).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${statusFilter === status
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
                {statusFilter
                  ? `No hay productos con estado ${STATUS_LABELS[statusFilter].toLowerCase()}`
                  : "No hay productos que coincidan con la búsqueda."}
              </div>
            ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-4 py-4 text-left">Producto</th>
                    <th className="px-4 py-4 text-left">Comerciante</th>
                    <th className="px-4 py-4 text-left">Categoría</th>
                    <th className="px-4 py-4 text-right">Precio</th>
                    <th className="px-4 py-4 text-left">Estado</th>
                    <th className="px-4 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {privateImageSrc(p.imageUrl) ? (
                            <img src={privateImageSrc(p.imageUrl)}
                            alt={p.name}
                            className="h-9 w-9 rounded-lg object-cover border border-gray-200 shrink-0 cursor-pointer"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0 cursor-pointer" />
                          )}
                          <button
                            onClick={() => openDetail(p)}
                            className="font-medium text-gray-800 hover:text-violet-600 text-left transition cursor-pointer"
                          >
                            {p.name}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{p.companyName}</td>
                      <td className="px-4 py-4 text-gray-500">{p.categoryName}</td>
                      <td className="px-4 py-4 text-right font-medium text-gray-700">
                        ${p.price.toLocaleString("es-CO")}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs border px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
                          {STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === ProductStatus.PENDING && (
                            <>
                              <button
                                onClick={() => openAction(p.id, "approve")}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition cursor-pointer"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => openAction(p.id, "reject")}
                                className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {p.status !== ProductStatus.INACTIVE && p.status !== ProductStatus.PENDING && (
                            <button
                              onClick={() => openAction(p.id, "delete")}
                              className="text-xs border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 px-3 py-1 rounded-lg transition cursor-pointer"
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
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
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
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleToggleInactiveCategories}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition cursor-pointer ${showInactiveCategories
                  ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
            >
              {showInactiveCategories ? "Ocultar inactivas" : "Ver inactivas"}
            </button>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
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
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCat || !catName || !image}
                    className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <button onClick={() => setShowCreateForm(true)} className="mt-3 text-violet-600 text-sm hover:underline cursor-pointer">
                  Crear la primera
                </button>
              </div>
            ) : (
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-4 text-left">Imagen</th>
                    <th className="px-6 py-4 text-left">Nombre</th>
                    <th className="px-6 py-4 text-left">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">🖼</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{cat.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Activa
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteCatId === cat.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-gray-500">¿Confirmar?</span>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              disabled={deletingCatId === cat.id}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
                            >
                              {deletingCatId === cat.id ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCatId(null)}
                              className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteCatId(cat.id)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition cursor-pointer"
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

          {/* ── Categorías inactivas ── */}
          {showInactiveCategories && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-700">Categorías inactivas</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {inactiveCategories.length} categorías
                </span>
              </div>

              {loadingInactiveCategories ? (
                <div className="py-16 text-center text-sm text-gray-400">Cargando categorías inactivas...</div>
              ) : inactiveCategories.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">No hay categorías inactivas.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-6 py-4 text-left">Imagen</th>
                      <th className="px-6 py-4 text-left">Nombre</th>
                      <th className="px-6 py-4 text-left">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inactiveCategories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">🖼</div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-500">{cat.name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Inactiva
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRecoverCategory(cat.id)}
                            disabled={recoveringCatId === cat.id}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {recoveringCatId === cat.id ? "Restableciendo..." : "Restablecer"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">{detailState.product.name}</h2>
                    {detailState.status && (
                      <span className={`inline-flex items-center gap-1.5 text-xs border px-2 py-0.5 rounded-full ${STATUS_STYLES[detailState.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[detailState.status]}`} />
                        {STATUS_LABELS[detailState.status]}
                      </span>
                    )}
                  </div>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0  cursor-pointer">×</button>
                </div>

                {privateImageSrc(detailState.product.imageUrl) && (
                  <img
                    src={privateImageSrc(detailState.product.imageUrl)}
                    alt={detailState.product.name}
                    className="w-full h-64 object-contain rounded-lg border border-gray-200"
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
                    <p className="font-medium text-gray-800">{detailState.product.companyName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Stock disponible</span>
                    <p className="font-medium text-gray-800">{detailState.product.stock}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Máx. llaves permitidas</span>
                    <p className="font-medium text-gray-800">{detailState.product.maxKeysAllowed}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Piso en efectivo</span>
                    <p className="font-medium text-gray-800">
                      ${(detailState.product.minCashCents / 100).toLocaleString("es-CO")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Rating promedio</span>
                    <p className="font-medium text-gray-800">
                      {detailState.product.averageRate > 0 ? detailState.product.averageRate.toFixed(1) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Recompensa de juego</span>
                    <p className="font-medium text-gray-800">{detailState.product.isGameReward ? "Sí" : "No"}</p>
                  </div>
                </div>

                {detailState.product.description && (
                  <div>
                    <span className="text-gray-400 text-xs">Descripción</span>
                    <p className="text-sm text-gray-700 mt-1">{detailState.product.description}</p>
                  </div>
                )}

                <button
                  onClick={() => openReviews(detailState.product!.id)}
                  className="w-full flex items-center justify-center gap-2 text-sm border border-gray-300 text-gray-700 hover:border-violet-400 hover:text-violet-600 py-2 rounded-lg transition cursor-pointer"
                >
                  <Star size={14} />
                  Ver reseñas ({detailState.product.reviewCount})
                </button>

                {detailState.status !== ProductStatus.INACTIVE && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {detailState.status === ProductStatus.PENDING && (
                      <>
                        <button
                          onClick={() => { closeDetail(); openAction(detailState.product!.id, "approve"); }}
                          className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition cursor-pointer"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => { closeDetail(); openAction(detailState.product!.id, "reject"); }}
                          className="flex-1 text-sm border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg transition cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {(detailState.status === ProductStatus.ACTIVE || detailState.status === ProductStatus.REJECTED) && (
                      <button
                        onClick={() => { closeDetail(); openAction(detailState.product!.id, "delete"); }}
                        className="flex-1 text-sm border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 py-2 rounded-lg transition cursor-pointer"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: RESEÑAS DEL PRODUCTO
      ══════════════════════════════════════════ */}
      {reviewsState.open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeReviews}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">Reseñas del producto</h2>
              <button onClick={closeReviews} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
            </div>

            <div className="p-6 space-y-3">
              {reviewsState.loading ? (
                <div className="py-16 text-center text-sm text-gray-400">Cargando reseñas...</div>
              ) : reviewsState.reviews.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-400">Este producto aún no tiene reseñas.</div>
              ) : (
                reviewsState.reviews.map((review) => (
                  <div key={review.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{review.consumerName}</p>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleHideReview(review.id)}
                        disabled={reviewsState.hidingId === review.id}
                        className="text-xs border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {reviewsState.hidingId === review.id ? "Ocultando..." : "Ocultar"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.createdAt).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                ))
              )}
            </div>
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
              <button onClick={closeAction} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">×</button>
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
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 cursor-pointer"
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