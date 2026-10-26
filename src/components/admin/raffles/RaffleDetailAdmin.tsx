"use client";

import { useState, type ReactNode } from "react";

import {
    RaffleResponseDTO,
    UpdateRaffleRequestDTO,
} from "@/types/raffles/raffle.types";

import { PrizeResponseDTO } from "@/types/raffles/prize.types";

import { RaffleRuleResponseDTO } from "@/types/raffles/raffleRule.types";

import ConfirmDialog from "@/components/generic/ConfirmDialog";
import EditRaffleForm from "@/components/admin/raffles/EditRaffleForm";
import { getFriendlyErrorMessage } from "@/utils/errorMessages";

import {
    X,
    Calendar,
    Ticket,
    Users,
    PawPrint,
    Dices,
    Pencil,
    Play,
    RotateCcw,
    Ban,
    Trash2,
    AlertTriangle,
    Award,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Lock,
    ShieldCheck,
    BarChart3,
} from "lucide-react";

/* ============================================================
   TIPOS
   ============================================================ */

type TabType =
    | "general"
    | "prizes"
    | "rules"
    | "draw";

type ConfirmAction =
    | "activate"
    | "close"
    | "cancel"
    | "delete"
    | "verify"
    | null;

interface Props {
    raffle: RaffleResponseDTO;

    /**
     * Navegar de regreso al listado de rifas.
     */
    onClose?: () => void;

    /**
     * Actualizar la rifa.
     *
     * Permitido:
     * DRAFT
     * ACTIVE
     * MISSED_DRAW
     */
    onUpdate?: (
        raffleId: number,
        data: UpdateRaffleRequestDTO
    ) => Promise<void>;

    /**
     * Activar / reactivar la rifa.
     *
     * Permitido:
     * DRAFT
     * CANCELLED
     * MISSED_DRAW
     */
    onActivate?: (
        raffleId: number
    ) => Promise<void>;

    /**
     * Cerrar una rifa.
     *
     * Permitido:
     * ACTIVE
     */
    onCloseRaffle?: (
        raffleId: number
    ) => Promise<void>;

    /**
     * Cancelar una rifa.
     *
     * Permitido:
     * ACTIVE
     * MISSED_DRAW
     */
    onCancel?: (
        raffleId: number
    ) => Promise<void>;

    /**
     * Eliminar una rifa.
     *
     * Permitido:
     * DRAFT
     */
    onDelete?: (
        raffleId: number
    ) => Promise<void>;

    /**
     * Verificar integridad del sorteo.
     *
     * Permitido:
     * COMPLETED
     */
    onVerify?: (
        raffleId: number
    ) => Promise<void>;

    /**
     * Consultar estadísticas.
     *
     * Permitido:
     * COMPLETED
     */
    onStatistics?: (
        raffleId: number
    ) => Promise<void>;
}

/* ============================================================
   CONFIGURACIÓN DE ESTADOS
   ============================================================ */

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        badge: string;
        dot: string;
    }
> = {
    DRAFT: {
        label: "Borrador",
        badge:
            "bg-gray-100 text-gray-700 border-gray-200",
        dot: "bg-gray-400",
    },

    ACTIVE: {
        label: "Activa",
        badge:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500 animate-pulse",
    },

    CLOSED: {
        label: "Cerrada",
        badge:
            "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
    },

    LIVE: {
        label: "En Vivo",
        badge:
            "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
    },

    DRAWING: {
        label: "En Sorteo",
        badge:
            "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500 animate-ping",
    },

    COMPLETED: {
        label: "Completada",
        badge:
            "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
    },

    CANCELLED: {
        label: "Cancelada",
        badge:
            "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
    },

    MISSED_DRAW: {
        label: "Sorteo Pendiente",
        badge:
            "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
    },
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function RaffleDetailCard({
                                             raffle,
                                             onClose,
                                             onUpdate,
                                             onActivate,
                                             onCloseRaffle,
                                             onCancel,
                                             onDelete,
                                             onVerify,
                                             onStatistics,
                                         }: Props) {
    const [activeTab, setActiveTab] =
        useState<TabType>("general");

    const [isConfirmOpen, setIsConfirmOpen] =
        useState(false);

    const [confirmAction, setConfirmAction] =
        useState<ConfirmAction>(null);

    const [isEditOpen, setIsEditOpen] =
        useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ========================================================
       DATOS DERIVADOS
       ======================================================== */

    const status = raffle.raffleStatus;

    const isDraft = status === "DRAFT";
    const isActive = status === "ACTIVE";
    const isCancelled = status === "CANCELLED";
    const isMissedDraw = status === "MISSED_DRAW";
    const isCompleted = status === "COMPLETED";

    const prizes = raffle.prizes ?? [];
    const rules = raffle.rules ?? [];

    /*
     * MISSED_DRAW:
     *
     * Si el drawDate ya pasó, la rifa NO puede reactivarse.
     * Primero debe editarse y actualizarse la fecha.
     */
    const datesNeedUpdate =
        isMissedDraw &&
        new Date(raffle.drawDate).getTime() <=
        Date.now();

    /* ========================================================
       MANEJADOR DE ERRORES
       ======================================================== */

    const handleAction = async <T,>(
        action: () => Promise<T>,
        successMessage?: string
    ): Promise<T | undefined> => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const result = await action();

            // Si hay mensaje de éxito, mostrarlo (puedes usar toast)
            if (successMessage) {
                console.log('✅', successMessage);
                // toast.success(successMessage); // Descomenta si usas toast
            }

            return result;
        } catch (err) {
            const friendlyMessage = getFriendlyErrorMessage(err);
            setErrorMessage(friendlyMessage);
            console.error('❌ Error en acción:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /* ========================================================
       ABRIR CONFIRMACIÓN
       ======================================================== */

    const openConfirm = (
        action: Exclude<ConfirmAction, null>
    ) => {
        setConfirmAction(action);
        setIsConfirmOpen(true);
    };

    /* ========================================================
       CERRAR CONFIRMACIÓN
       ======================================================== */

    const closeConfirm = () => {
        setIsConfirmOpen(false);
        setConfirmAction(null);
    };

    /* ========================================================
       CONFIRMAR ACCIÓN
       ======================================================== */

    const handleConfirm = async () => {
        if (!confirmAction) {
            return;
        }

        try {
            switch (confirmAction) {
                case "activate":
                    if (onActivate) {
                        await handleAction(
                            () => onActivate(raffle.id),
                            '¡Rifa activada exitosamente!'
                        );
                    }
                    break;

                case "close":
                    if (onCloseRaffle) {
                        await handleAction(
                            () => onCloseRaffle(raffle.id),
                            'Rifa cerrada correctamente.'
                        );
                    }
                    break;

                case "cancel":
                    if (onCancel) {
                        await handleAction(
                            () => onCancel(raffle.id),
                            'Rifa cancelada correctamente.'
                        );
                    }
                    break;

                case "delete":
                    if (onDelete) {
                        await handleAction(
                            () => onDelete(raffle.id),
                            'Rifa eliminada permanentemente.'
                        );
                    }
                    break;

                case "verify":
                    if (onVerify) {
                        await handleAction(
                            () => onVerify(raffle.id),
                            'Sorteo verificado correctamente.'
                        );
                    }
                    break;

                default:
                    break;
            }
        } finally {
            closeConfirm();
        }
    };

    /* ========================================================
       CONFIGURACIÓN DEL ESTADO
       ======================================================== */

    const statusInfo =
        STATUS_CONFIG[status] ?? {
            label: status,
            badge:
                "bg-slate-100 text-slate-700 border-slate-200",
            dot: "bg-slate-400",
        };

    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <div className="
            bg-white
            rounded-3xl
            border
            border-slate-100
            shadow-xl/5
            p-6
            md:p-8
            space-y-8
            relative
        ">

            {/* ==================================================
                VOLVER
            ================================================== */}

            {onClose && (
                <div className="
                    flex
                    items-center
                    justify-between
                    pb-2
                ">
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            px-3.5
                            py-2
                            rounded-xl
                            text-slate-600
                            hover:text-slate-900
                            bg-slate-100
                            hover:bg-slate-200/70
                            text-xs
                            font-semibold
                            transition-all
                            active:scale-95
                            cursor-pointer
                        "
                    >
                        <ArrowLeft className="w-4 h-4" />

                        Volver a las rifas
                    </button>
                </div>
            )}

            {/* ==================================================
                IMAGEN
            ================================================== */}

            {raffle.imageUrl && (
                <div className="
                    w-full
                    h-56
                    md:h-64
                    rounded-2xl
                    overflow-hidden
                    relative
                    shadow-inner
                    group
                ">
                    <img
                        src={raffle.imageUrl}
                        alt={raffle.title}
                        className="
                            w-full
                            h-full
                            object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-105
                        "
                        loading="lazy"
                        decoding="async"
                    />

                    <div className="
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/40
                        via-transparent
                        to-transparent
                    " />
                </div>
            )}

            {/* ==================================================
                HEADER + ACCIONES
            ================================================== */}

            <div className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                justify-between
                gap-6
                pb-2
                border-b
                border-slate-100
            ">

                {/* INFORMACIÓN */}

                <div className="space-y-3">
                    <div className="
                        flex
                        flex-wrap
                        items-center
                        gap-2.5
                    ">

                        {/* ESTADO */}

                        <span
                            className={`
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-1
                                rounded-full
                                text-xs
                                font-semibold
                                border
                                ${statusInfo.badge}
                            `}
                        >
                            <span
                                className={`
                                    w-2
                                    h-2
                                    rounded-full
                                    ${statusInfo.dot}
                                `}
                            />

                            {statusInfo.label}
                        </span>

                        {/* TIPO */}

                        <span className="
                            text-xs
                            font-semibold
                            px-3
                            py-1
                            rounded-full
                            bg-slate-100
                            text-slate-600
                            border
                            border-slate-200/60
                            uppercase
                            tracking-wider
                        ">
                            {raffle.raffleType}
                        </span>
                    </div>

                    <h1 className="
                        text-2xl
                        md:text-3xl
                        font-extrabold
                        text-slate-900
                        tracking-tight
                    ">
                        {raffle.title}
                    </h1>
                </div>

                {/* ==================================================
                    ACCIONES
                ================================================== */}

                <div className="
                    flex
                    flex-wrap
                    items-center
                    gap-2.5
                    shrink-0
                ">

                    {/* ==================================================
                        DRAFT
                    ================================================== */}

                    {isDraft && onUpdate && (
                        <EditButton
                            onClick={() =>
                                setIsEditOpen(true)
                            }
                        />
                    )}

                    {isDraft && onActivate && (
                        <ActivateButton
                            label="Activar"
                            onClick={() =>
                                openConfirm("activate")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {isDraft && onDelete && (
                        <DeleteButton
                            onClick={() =>
                                openConfirm("delete")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {/* ==================================================
                        ACTIVE
                    ================================================== */}

                    {isActive && onUpdate && (
                        <EditButton
                            onClick={() =>
                                setIsEditOpen(true)
                            }
                        />
                    )}

                    {isActive && onCloseRaffle && (
                        <CloseButton
                            onClick={() =>
                                openConfirm("close")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {isActive && onCancel && (
                        <CancelButton
                            onClick={() =>
                                openConfirm("cancel")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {/* ==================================================
                        COMPLETED
                    ================================================== */}

                    {isCompleted && onVerify && (
                        <VerifyButton
                            onClick={() =>
                                openConfirm("verify")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {isCompleted && onStatistics && (
                        <StatisticsButton
                            onClick={() =>
                                onStatistics(raffle.id)
                            }
                            disabled={isLoading}
                        />
                    )}

                    {/* ==================================================
                        CANCELLED
                    ================================================== */}

                    {isCancelled && onActivate && (
                        <ActivateButton
                            label="Activar"
                            onClick={() =>
                                openConfirm("activate")
                            }
                            disabled={isLoading}
                        />
                    )}

                    {/* ==================================================
                        MISSED_DRAW
                    ================================================== */}

                    {isMissedDraw && onUpdate && (
                        <EditButton
                            onClick={() =>
                                setIsEditOpen(true)
                            }
                        />
                    )}

                    {isMissedDraw && onActivate && (
                        <ActivateButton
                            label="Reactivar"
                            disabled={datesNeedUpdate || isLoading}
                            title={
                                datesNeedUpdate
                                    ? "Actualiza las fechas de la rifa antes de reactivarla"
                                    : undefined
                            }
                            onClick={() =>
                                openConfirm("activate")
                            }
                        />
                    )}

                    {isMissedDraw && onCancel && (
                        <CancelButton
                            onClick={() =>
                                openConfirm("cancel")
                            }
                            disabled={isLoading}
                        />
                    )}
                </div>
            </div>

            {/* ==================================================
                ALERTA MISSED DRAW
            ================================================== */}

            {isMissedDraw && (
                <div className="
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-amber-200/80
                    bg-amber-50/70
                    p-4
                    text-sm
                    text-amber-900
                    shadow-xs
                ">
                    <AlertTriangle className="
                        w-5
                        h-5
                        text-amber-600
                        shrink-0
                        mt-0.5
                    " />

                    <p className="leading-relaxed">
                        Esta rifa superó la fecha de sorteo
                        sin ejecutarse. Actualiza las fechas
                        con el botón{" "}
                        <strong className="
                            font-semibold
                            text-amber-950
                        ">
                            Editar
                        </strong>{" "}
                        antes de reactivarla, o bien
                        cancélala.
                    </p>
                </div>
            )}

            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {errorMessage && (
                <div className="
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-rose-200/80
                    bg-rose-50/70
                    p-4
                    text-sm
                    text-rose-900
                    shadow-xs
                    animate-in
                    slide-in-from-top-2
                    duration-300
                ">
                    <AlertTriangle className="
                        w-5
                        h-5
                        text-rose-600
                        shrink-0
                        mt-0.5
                    " />

                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-rose-800">
                            No se pudo completar la acción
                        </p>
                        <p className="leading-relaxed">
                            {errorMessage}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="
                            shrink-0
                            text-rose-400
                            hover:text-rose-600
                            transition-colors
                            p-1
                            rounded-lg
                            hover:bg-rose-100/50
                        "
                        aria-label="Cerrar mensaje de error"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ==================================================
                TABS
            ================================================== */}

            <div className="
                bg-slate-100/80
                p-1.5
                rounded-2xl
                flex
                flex-wrap
                gap-1
                border
                border-slate-200/50
            ">
                <TabButton
                    label="General"
                    value="general"
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                <TabButton
                    label={`Premios (${prizes.length})`}
                    value="prizes"
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                <TabButton
                    label={`Reglas (${rules.length})`}
                    value="rules"
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                <TabButton
                    label="Sorteo & Términos"
                    value="draw"
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {/* ==================================================
                CONTENIDO
            ================================================== */}

            <div className="
                pt-2
                min-h-[320px]
            ">
                {activeTab === "general" && (
                    <GeneralTab raffle={raffle} />
                )}

                {activeTab === "prizes" && (
                    <PrizesTab prizes={prizes} />
                )}

                {activeTab === "rules" && (
                    <RulesTab rules={rules} />
                )}

                {activeTab === "draw" && (
                    <DrawTab raffle={raffle} />
                )}
            </div>

            {/* ==================================================
                CONFIRM DIALOG
            ================================================== */}

            <ConfirmDialog
                isOpen={isConfirmOpen}

                title={
                    confirmAction === "activate"
                        ? "Confirmar activación"
                        : confirmAction === "close"
                            ? "Confirmar cierre"
                            : confirmAction === "delete"
                                ? "Confirmar eliminación"
                                : confirmAction === "verify"
                                    ? "Verificar sorteo"
                                    : "Confirmar cancelación"
                }

                description={
                    confirmAction === "activate"
                        ? "La rifa pasará a estado ACTIVA. Asegúrate de que las fechas y la configuración sean correctas antes de continuar."
                        : confirmAction === "close"
                            ? "La rifa pasará a estado CERRADA. Esta acción finalizará el período activo de la rifa."
                            : confirmAction === "delete"
                                ? "Esta acción eliminará permanentemente la rifa. Esta operación no se puede deshacer."
                                : confirmAction === "verify"
                                    ? "Se verificará la integridad de la información asociada al sorteo."
                                    : "La rifa pasará a estado CANCELADA. Esta acción interrumpirá el flujo normal de la rifa."
                }

                variant={
                    confirmAction === "activate" ||
                    confirmAction === "verify"
                        ? "default"
                        : "danger"
                }

                confirmText={
                    confirmAction === "delete"
                        ? "Eliminar"
                        : confirmAction === "cancel"
                            ? "Cancelar rifa"
                            : confirmAction === "close"
                                ? "Cerrar rifa"
                                : confirmAction === "activate"
                                    ? "Activar"
                                    : "Verificar"
                }

                cancelText="Volver"

                onConfirm={handleConfirm}

                onClose={closeConfirm}

                requireTextConfirmation={
                    confirmAction === "delete" ||
                    confirmAction === "cancel"
                }

                confirmationText="CONFIRMAR"
            />

            {/* ==================================================
                MODAL EDICIÓN
            ================================================== */}

            {isEditOpen && onUpdate && (
                <div className="
                    fixed
                    inset-0
                    bg-slate-900/60
                    backdrop-blur-xs
                    flex
                    items-center
                    justify-center
                    z-50
                    p-4
                ">
                    <div className="
                        bg-white
                        rounded-3xl
                        max-w-2xl
                        w-full
                        relative
                        shadow-2xl
                        overflow-hidden
                        max-h-[90vh]
                        flex
                        flex-col
                        border
                        border-slate-100
                        animate-in
                        fade-in
                        zoom-in-95
                        duration-200
                    ">
                        <button
                            type="button"
                            onClick={() =>
                                setIsEditOpen(false)
                            }
                            className="
                                cursor-pointer
                                absolute
                                top-4
                                right-4
                                z-50
                                p-2
                                text-slate-400
                                hover:text-slate-700
                                bg-white/80
                                hover:bg-slate-100
                                rounded-xl
                                transition-all
                            "
                            aria-label="Cerrar edición"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <EditRaffleForm
                            raffle={raffle}

                            onCancel={() =>
                                setIsEditOpen(false)
                            }

                            onBack={() => {
                                setIsEditOpen(false);
                                onClose?.();
                            }}

                            onSubmit={async (data) => {
                                try {
                                    await handleAction(
                                        () => onUpdate(raffle.id, data),
                                        'Rifa actualizada correctamente.'
                                    );
                                    setIsEditOpen(false);
                                } catch (error) {
                                    // El error ya fue manejado por handleAction
                                    // No cerramos el modal para que el usuario pueda corregir
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================================================================
   TAB BUTTON
   ================================================================ */

function TabButton({
                       label,
                       value,
                       activeTab,
                       onChange,
                   }: {
    label: string;
    value: TabType;
    activeTab: TabType;
    onChange: (value: TabType) => void;
}) {
    const isActive =
        activeTab === value;

    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={`
                flex-1
                min-w-[120px]
                cursor-pointer
                py-2.5
                px-4
                text-xs
                md:text-sm
                font-semibold
                rounded-xl
                transition-all
                duration-200
                text-center

                ${
                isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }
            `}
        >
            {label}
        </button>
    );
}

/* ================================================================
   BOTONES DE ACCIÓN
   ================================================================ */

function EditButton({
                        onClick,
                    }: {
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-slate-100
                hover:bg-slate-200
                text-slate-700
                font-medium
                rounded-xl
                text-sm
                transition-all
                active:scale-95
            "
        >
            <Pencil className="
                w-4
                h-4
                text-slate-500
            " />

            Editar
        </button>
    );
}

function ActivateButton({
                            onClick,
                            label,
                            disabled = false,
                            title,
                        }: {
    onClick: () => void;
    label: string;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2.5
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                font-medium
                rounded-xl
                text-sm
                shadow-sm
                transition-all
                active:scale-95
                cursor-pointer
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            {label === "Reactivar" ? (
                <RotateCcw className="w-4 h-4" />
            ) : (
                <Play className="w-4 h-4" />
            )}

            {label}
        </button>
    );
}

function CloseButton({
                         onClick,
                         disabled = false,
                     }: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-slate-800
                hover:bg-slate-900
                text-white
                font-medium
                rounded-xl
                text-sm
                shadow-sm
                transition-all
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            <Lock className="w-4 h-4" />

            Cerrar
        </button>
    );
}

function CancelButton({
                          onClick,
                          disabled = false,
                      }: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-rose-50
                hover:bg-rose-100
                text-rose-600
                font-medium
                rounded-xl
                text-sm
                border
                border-rose-200/60
                transition-all
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            <Ban className="w-4 h-4" />

            Cancelar
        </button>
    );
}

function DeleteButton({
                          onClick,
                          disabled = false,
                      }: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-slate-900
                hover:bg-black
                text-white
                font-medium
                rounded-xl
                text-sm
                shadow-sm
                transition-all
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            <Trash2 className="
                w-4
                h-4
                text-rose-400
            " />

            Eliminar
        </button>
    );
}

function VerifyButton({
                          onClick,
                          disabled = false,
                      }: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-blue-600
                hover:bg-blue-700
                text-white
                font-medium
                rounded-xl
                text-sm
                shadow-sm
                transition-all
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            <ShieldCheck className="w-4 h-4" />

            Verificar
        </button>
    );
}

function StatisticsButton({
                              onClick,
                              disabled = false,
                          }: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="
                inline-flex
                items-center
                gap-2
                cursor-pointer
                px-4
                py-2.5
                bg-indigo-50
                hover:bg-indigo-100
                text-indigo-700
                font-medium
                rounded-xl
                text-sm
                border
                border-indigo-200
                transition-all
                active:scale-95
                disabled:opacity-40
                disabled:cursor-not-allowed
            "
        >
            <BarChart3 className="w-4 h-4" />

            Estadísticas
        </button>
    );
}

/* ================================================================
   GENERAL TAB
   ================================================================ */

function GeneralTab({
                        raffle,
                    }: {
    raffle: RaffleResponseDTO;
}) {
    const progress =
        raffle.maxTotalTickets > 0
            ? (
            raffle.totalTicketsIssued /
            raffle.maxTotalTickets
        ) * 100
            : 0;

    const formatDate = (
        dateStr: string
    ) => {
        return new Date(
            dateStr
        ).toLocaleDateString(
            "es-CO",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    return (
        <div className="space-y-6">

            {/* DESCRIPCIÓN */}

            <div className="
                bg-slate-50/60
                rounded-2xl
                p-5
                border
                border-slate-100
            ">
                <h4 className="
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                    mb-1.5
                ">
                    Descripción
                </h4>

                <p className="
                    text-slate-700
                    text-sm
                    leading-relaxed
                ">
                    {raffle.description ||
                        "Sin descripción asignada."}
                </p>
            </div>

            {/* INFORMACIÓN */}

            <div className="
                bg-white
                rounded-2xl
                border
                border-slate-200/80
                divide-y
                divide-slate-100
                text-sm
                overflow-hidden
                shadow-xs
            ">
                <div className="
                    px-5
                    py-3.5
                    bg-slate-50/50
                    border-b
                    border-slate-100
                ">
                    <h4 className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                    ">
                        Información del Sorteo
                    </h4>
                </div>

                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    divide-y
                    md:divide-y-0
                    md:divide-x
                    divide-slate-100
                ">
                    <div className="p-5 space-y-4">

                        <DetailRow
                            icon={
                                <Calendar className="w-4 h-4 text-slate-400" />
                            }
                            label="Fecha de Inicio"
                            value={formatDate(
                                raffle.startDate
                            )}
                        />

                        <DetailRow
                            icon={
                                <Clock className="w-4 h-4 text-slate-400" />
                            }
                            label="Fecha de Cierre"
                            value={formatDate(
                                raffle.endDate
                            )}
                        />

                        <DetailRow
                            icon={
                                <Dices className="w-4 h-4 text-slate-400" />
                            }
                            label="Fecha del Sorteo"
                            value={formatDate(
                                raffle.drawDate
                            )}
                        />
                    </div>

                    <div className="p-5 space-y-4">

                        <DetailRow
                            icon={
                                <Users className="w-4 h-4 text-slate-400" />
                            }
                            label="Participantes Registrados"
                            value={`${raffle.totalParticipants.toLocaleString()} usuarios`}
                        />

                        <DetailRow
                            icon={
                                <Ticket className="w-4 h-4 text-slate-400" />
                            }
                            label="Límite por Usuario"
                            value={`${raffle.maxTicketsPerUser} tickets`}
                        />

                        <DetailRow
                            icon={
                                <PawPrint className="w-4 h-4 text-slate-400" />
                            }
                            label="Mascota Requerida"
                            value={
                                raffle.requiresPet
                                    ? "Sí, obligatorio"
                                    : "No"
                            }
                        />

                        <DetailRow
                            icon={
                                <Award className="w-4 h-4 text-slate-400" />
                            }
                            label="Método de Selección"
                            value={raffle.drawMethod}
                        />
                    </div>
                </div>
            </div>

            {/* PROGRESO */}

            <div className="
                bg-white
                rounded-2xl
                p-5
                border
                border-slate-200/80
                shadow-xs
                space-y-3
            ">
                <div className="
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-2
                ">
                    <div className="
                        flex
                        items-center
                        gap-2
                    ">
                        <div className="
                            p-2
                            bg-indigo-50
                            text-admin-blue
                            rounded-xl
                        ">
                            <Ticket className="w-5 h-5" />
                        </div>

                        <div>
                            <p className="
                                text-xs
                                font-medium
                                text-slate-500
                            ">
                                Progreso de emisión
                            </p>

                            <p className="
                                text-sm
                                font-bold
                                text-slate-900
                            ">
                                {raffle.totalTicketsIssued.toLocaleString()}

                                <span className="
                                    text-xs
                                    font-normal
                                    text-slate-400
                                ">
                                    {" "}
                                    /{" "}
                                    {raffle.maxTotalTickets.toLocaleString()}{" "}
                                    tickets
                                </span>
                            </p>
                        </div>
                    </div>

                    <span className="
                        text-sm
                        font-extrabold
                        text-admin-blue
                        bg-indigo-50
                        px-3
                        py-1
                        rounded-full
                        border
                        border-indigo-100
                    ">
                        {progress.toFixed(1)}%
                    </span>
                </div>

                <div className="
                    w-full
                    bg-slate-100
                    rounded-full
                    h-2.5
                    overflow-hidden
                ">
                    <div
                        className="
                            bg-admin-gradient
                            h-full
                            rounded-full
                            transition-all
                            duration-500
                        "
                        style={{
                            width: `${Math.min(
                                progress,
                                100
                            )}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   DETAIL ROW
   ================================================================ */

function DetailRow({
                       icon,
                       label,
                       value,
                   }: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="
            flex
            items-center
            justify-between
            gap-4
        ">
            <div className="
                flex
                items-center
                gap-2.5
                min-w-0
            ">
                <span className="shrink-0">
                    {icon}
                </span>

                <span className="
                    text-slate-500
                    text-xs
                    md:text-sm
                    truncate
                ">
                    {label}
                </span>
            </div>

            <span className="
                font-semibold
                text-slate-800
                text-xs
                md:text-sm
                text-right
                shrink-0
            ">
                {value}
            </span>
        </div>
    );
}

/* ================================================================
   PRIZES TAB
   ================================================================ */

function PrizesTab({
                       prizes,
                   }: {
    prizes: PrizeResponseDTO[];
}) {
    if (!prizes.length) {
        return (
            <div className="
                text-center
                py-12
                bg-slate-50
                rounded-2xl
                border
                border-dashed
                border-slate-200
            ">
                <Award className="
                    w-10
                    h-10
                    text-slate-300
                    mx-auto
                    mb-2
                " />

                <p className="
                    text-slate-500
                    font-medium
                ">
                    No hay premios configurados
                    para esta rifa.
                </p>
            </div>
        );
    }

    const sorted = [...prizes].sort(
        (a, b) =>
            a.position - b.position
    );

    return (
        <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-5
        ">
            {sorted.map((prize) => (
                <div
                    key={prize.id}
                    className="
                        group
                        border
                        border-slate-100
                        rounded-2xl
                        p-4
                        bg-white
                        shadow-xs
                        hover:shadow-md
                        hover:border-slate-200
                        transition-all
                        duration-300
                        flex
                        flex-col
                        justify-between
                    "
                >
                    <div>
                        {prize.imageUrl ? (
                            <div className="
                                w-full
                                h-44
                                rounded-xl
                                overflow-hidden
                                mb-4
                                bg-slate-100
                                relative
                            ">
                                <img
                                    src={prize.imageUrl}
                                    alt={prize.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="
                                        w-full
                                        h-full
                                        object-cover
                                        group-hover:scale-105
                                        transition-transform
                                        duration-300
                                    "
                                />

                                <span className="
                                    absolute
                                    top-2
                                    left-2
                                    bg-slate-900/80
                                    backdrop-blur-xs
                                    text-white
                                    text-xs
                                    font-bold
                                    px-2.5
                                    py-1
                                    rounded-lg
                                ">
                                    Lugar #{prize.position}
                                </span>
                            </div>
                        ) : (
                            <div className="
                                w-full
                                h-24
                                rounded-xl
                                mb-4
                                bg-slate-50
                                border
                                border-slate-100
                                flex
                                items-center
                                justify-center
                            ">
                                <span className="
                                    bg-slate-200
                                    text-slate-700
                                    text-xs
                                    font-bold
                                    px-3
                                    py-1
                                    rounded-lg
                                ">
                                    Posición #{prize.position}
                                </span>
                            </div>
                        )}

                        <h3 className="
                            font-bold
                            text-slate-800
                            text-base
                            group-hover:text-admin-blue
                            transition-colors
                        ">
                            {prize.title}
                        </h3>

                        <p className="
                            text-xs
                            text-slate-500
                            mt-1
                            line-clamp-2
                            leading-relaxed
                        ">
                            {prize.description ||
                                "Sin descripción"}
                        </p>
                    </div>

                    <div className="
                        mt-4
                        pt-3
                        border-t
                        border-slate-100
                        text-xs
                        space-y-2
                        text-slate-600
                    ">
                        <div className="
                            flex
                            justify-between
                        ">
                            <span className="text-slate-400">
                                Marca:
                            </span>

                            <span className="
                                font-semibold
                                text-slate-700
                            ">
                                {prize.brand || "—"}
                            </span>
                        </div>

                        <div className="
                            flex
                            justify-between
                        ">
                            <span className="text-slate-400">
                                Tipo:
                            </span>

                            <span className="
                                font-semibold
                                text-slate-700
                            ">
                                {prize.prizeType}
                            </span>
                        </div>

                        <div className="
                            flex
                            justify-between
                        ">
                            <span className="text-slate-400">
                                Cantidad:
                            </span>

                            <span className="
                                font-semibold
                                text-slate-700
                            ">
                                {prize.quantity} u.
                            </span>
                        </div>

                        <div className="
                            flex
                            justify-between
                            items-center
                            pt-1
                            border-t
                            border-slate-50
                        ">
                            <span className="text-slate-400">
                                Valor Estimado:
                            </span>

                            <span className="
                                font-bold
                                text-emerald-600
                                text-sm
                            ">
                                {prize.value.toLocaleString(
                                    "es-CO",
                                    {
                                        style: "currency",
                                        currency: "COP",
                                        maximumFractionDigits: 0,
                                    }
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ================================================================
   RULES TAB
   ================================================================ */

function RulesTab({
                      rules,
                  }: {
    rules: RaffleRuleResponseDTO[];
}) {
    if (!rules.length) {
        return (
            <div className="
                text-center
                py-12
                bg-slate-50
                rounded-2xl
                border
                border-dashed
                border-slate-200
            ">
                <Ticket className="
                    w-10
                    h-10
                    text-slate-300
                    mx-auto
                    mb-2
                " />

                <p className="
                    text-slate-500
                    font-medium
                ">
                    No hay reglas de asignación
                    de tickets configuradas.
                </p>
            </div>
        );
    }

    const getRuleTypeLabel = (
        type: string
    ) => {
        switch (type) {
            case "PURCHASE":
                return "Por Compra";

            case "DAILY_LOGIN":
                return "Login Diario";

            case "REFERRAL":
                return "Por Referido";

            default:
                return type;
        }
    };

    const getRuleTypeBadge = (
        type: string
    ) => {
        switch (type) {
            case "PURCHASE":
                return "bg-blue-50 text-blue-700 border-blue-200";

            case "DAILY_LOGIN":
                return "bg-amber-50 text-amber-700 border-amber-200";

            case "REFERRAL":
                return "bg-purple-50 text-purple-700 border-purple-200";

            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="space-y-4">
            {rules.map((rule) => {
                const earning =
                    rule.ticketEarningRuleResponseDTO;

                const progress =
                    rule.maxTicketsBySource > 0
                        ? (
                        rule.currentTicketsBySource /
                        rule.maxTicketsBySource
                    ) * 100
                        : 0;

                return (
                    <div
                        key={rule.id}
                        className="
                            border
                            border-slate-100
                            rounded-2xl
                            p-5
                            bg-white
                            shadow-xs
                            hover:border-slate-200
                            transition-all
                            space-y-4
                        "
                    >
                        <div className="
                            flex
                            flex-col
                            sm:flex-row
                            sm:items-center
                            justify-between
                            gap-2
                        ">
                            <div className="space-y-1">
                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                ">
                                    <h3 className="
                                        font-bold
                                        text-slate-800
                                        text-base
                                    ">
                                        {earning.ruleName}
                                    </h3>

                                    <span
                                        className={`
                                            text-[10px]
                                            uppercase
                                            tracking-wider
                                            font-extrabold
                                            px-2.5
                                            py-0.5
                                            rounded-full
                                            border
                                            ${getRuleTypeBadge(
                                            earning.ruleType
                                        )}
                                        `}
                                    >
                                        {getRuleTypeLabel(
                                            earning.ruleType
                                        )}
                                    </span>
                                </div>

                                <p className="
                                    text-xs
                                    text-slate-500
                                ">
                                    {earning.description}
                                </p>
                            </div>

                            <div className="
                                flex
                                items-center
                                gap-2
                                self-start
                                sm:self-center
                            ">
                                <span
                                    className={`
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        text-xs
                                        font-semibold
                                        px-2.5
                                        py-1
                                        rounded-full
                                        ${
                                        rule.isActive
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }
                                    `}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />

                                    {rule.isActive
                                        ? "Activa"
                                        : "Inactiva"}
                                </span>
                            </div>
                        </div>

                        <div className="
                            grid
                            grid-cols-2
                            md:grid-cols-3
                            gap-4
                            bg-slate-50/70
                            rounded-xl
                            p-3.5
                            text-xs
                            border
                            border-slate-100
                        ">
                            <div>
                                <span className="
                                    text-slate-400
                                    block
                                    mb-0.5
                                ">
                                    Tickets que otorga:
                                </span>

                                <span className="
                                    font-bold
                                    text-slate-800
                                    text-sm
                                ">
                                    +{earning.ticketsToAward} tickets
                                </span>
                            </div>

                            <div>
                                <span className="
                                    text-slate-400
                                    block
                                    mb-0.5
                                ">
                                    Prioridad:
                                </span>

                                <span className="
                                    font-semibold
                                    text-slate-700
                                    text-sm
                                ">
                                    Nivel {earning.priority}
                                </span>
                            </div>

                            {earning.ruleType ===
                                "PURCHASE" &&
                                earning.minPurchaseAmount !=
                                null && (
                                    <div>
                                        <span className="
                                            text-slate-400
                                            block
                                            mb-0.5
                                        ">
                                            Monto Mínimo:
                                        </span>

                                        <span className="
                                            font-bold
                                            text-emerald-600
                                            text-sm
                                        ">
                                            $
                                            {earning.minPurchaseAmount.toLocaleString(
                                                "es-CO"
                                            )}
                                        </span>
                                    </div>
                                )}

                            {earning.ruleType ===
                                "REFERRAL" &&
                                earning.referralAddedQuantity !=
                                null && (
                                    <div>
                                        <span className="
                                            text-slate-400
                                            block
                                            mb-0.5
                                        ">
                                            Referidos Mínimos:
                                        </span>

                                        <span className="
                                            font-semibold
                                            text-slate-700
                                            text-sm
                                        ">
                                            {
                                                earning.referralAddedQuantity
                                            }{" "}
                                            usuarios
                                        </span>
                                    </div>
                                )}
                        </div>

                        <div className="
                            space-y-1.5
                            pt-1
                        ">
                            <div className="
                                flex
                                justify-between
                                text-xs
                                text-slate-500
                            ">
                                <span>
                                    Generados:{" "}
                                    <strong>
                                        {rule.currentTicketsBySource.toLocaleString()}
                                    </strong>
                                </span>

                                <span>
                                    Límite:{" "}
                                    <strong>
                                        {rule.maxTicketsBySource.toLocaleString()}
                                    </strong>
                                </span>
                            </div>

                            <div className="
                                w-full
                                bg-slate-100
                                rounded-full
                                h-2
                            ">
                                <div
                                    className="
                                        bg-admin-gradient
                                        h-2
                                        rounded-full
                                        transition-all
                                    "
                                    style={{
                                        width: `${Math.min(
                                            progress,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ================================================================
   DRAW TAB
   ================================================================ */

function DrawTab({
                     raffle,
                 }: {
    raffle: RaffleResponseDTO;
}) {
    return (
        <div className="space-y-6">

            {/* MECANISMO */}

            <div className="
                bg-slate-50/80
                rounded-2xl
                p-5
                border
                border-slate-100
                space-y-2
            ">
                <h4 className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                ">
                    Mecanismo del Sorteo
                </h4>

                <p className="
                    text-slate-800
                    font-medium
                    text-sm
                    md:text-base
                    flex
                    items-center
                    gap-2
                ">
                    <Dices className="
                        w-5
                        h-5
                        text-admin-blue
                    " />

                    {raffle.drawMethod}
                </p>
            </div>

            {/* TÉRMINOS */}

            <div className="
                bg-slate-50/80
                rounded-2xl
                p-5
                border
                border-slate-100
                space-y-3
            ">
                <h4 className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-400
                ">
                    Términos y Condiciones
                </h4>

                <div className="
                    bg-white
                    rounded-xl
                    p-4
                    border
                    border-slate-200/80
                    text-xs
                    md:text-sm
                    text-slate-600
                    leading-relaxed
                    whitespace-pre-wrap
                    max-h-80
                    overflow-y-auto
                ">
                    {raffle.termsAndConditions ||
                        "No se han estipulado términos y condiciones especiales para esta rifa."}
                </div>
            </div>
        </div>
    );
}