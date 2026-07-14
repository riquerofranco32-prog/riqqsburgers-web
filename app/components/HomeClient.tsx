"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
// Lazy-load the WebGL shader so it never blocks the hero render
const HeroShader = dynamic(() => import("@/components/HeroShader"), {
  ssr: false,
  loading: () => null,
});
// Lazy-load the Spline 3D scene — heavy WebGL asset, skip on mobile to improve LCP/TBT
const SplineScene = dynamic(
  () =>
    import("@/components/ui/splite").then((m) => ({ default: m.SplineScene })),
  { ssr: false, loading: () => null },
);
import {
  ShoppingCart,
  CheckCircle,
  Star,
  Utensils,
  UtensilsCrossed,
  Package,
  ChefHat,
  Snowflake,
  Fish,
  Wine,
  Truck,
  ChevronRight,
  Check,
  X,
  Zap,
  TrendingUp,
  Target,
  MessageCircle,
  Smartphone,
  Clock,
  ArrowRight,
  QrCode,
  Flame,
  Shield,
} from "lucide-react";
import TakefyyLogo from "@/components/TakefyyLogo";
import { WHATSAPP_URL, WHATSAPP_BASE, trackLandingEvent } from "@/lib/contact";

const ease = [0.22, 1, 0.36, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay, ease },
  };
}

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {count.toLocaleString("es-AR")}
      {suffix}
    </span>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 16,
            color: "var(--text-primary)",
            lineHeight: 1.4,
          }}
        >
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2, ease }}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: open ? "var(--accent)" : "var(--surface-2)",
            color: open ? "#fff" : "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 300,
          }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            style={{ overflow: "hidden" }}
          >
            <p
              style={{
                paddingBottom: 20,
                color: "var(--text-secondary)",
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="text-xs font-semibold tracking-widest mb-3 flex items-center gap-2.5"
      style={{ color: "var(--accent)", letterSpacing: "0.15em" }}
    >
      <span
        style={{
          display: "inline-block",
          width: 24,
          height: 2,
          background: "var(--accent)",
          borderRadius: 1,
          flexShrink: 0,
        }}
      />
      {children}
    </p>
  );
}

/* Tilt card wrapper using framer-motion */
function TiltCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    n: "01",
    title: "Cargás tu menú",
    desc: "Productos, fotos, precios y categorías. En minutos tenés tu carta lista.",
    icon: "📋",
    size: "large",
  },
  {
    n: "02",
    title: "Compartís el link",
    desc: "Tu URL propia: takefyy.com/tu-restaurante. Lista al instante.",
    icon: "🔗",
    size: "small",
  },
  {
    n: "03",
    title: "Recibís pedidos",
    desc: "Directo a tu WhatsApp, sin intermediarios, sin comisiones.",
    icon: "📲",
    size: "small",
  },
];

const showcaseFeatures = [
  "Catálogo con fotos, precios y categorías",
  "Badges: Popular, Nuevo, Promo, Agotado",
  "Carrito y pedido directo por WhatsApp",
  "Panel admin del restaurante incluido",
  "URL propia: takefyy.com/{tu-negocio}",
  "Sin comisiones por pedido",
];

const adminPanelFeatures = [
  "Ventas de la semana y por categoría en tiempo real",
  "Horas pico para planificar tu equipo y tu stock",
  "Top de productos más vendidos, actualizado solo",
  "Cierre de caja automático por efectivo, transferencia y delivery",
  "Pedidos en vivo con timbre de cocina y WebSocket",
  "Reporte mensual descargable en Excel",
];

const testimonials = [
  {
    name: "Martina G.",
    restaurant: "Burguer Palace · Buenos Aires",
    initials: "MG",
    text: "En un día ya estábamos tomando pedidos por WhatsApp. Mis clientes lo aman porque es simple y rápido. Dejé de perder tiempo en llamadas y ahora el negocio va solo.",
  },
  {
    name: "Roberto P.",
    restaurant: "La Parrilla de Juan · Córdoba",
    initials: "RP",
    text: "Dejé de perder tiempo en llamadas. Ahora el cliente elige, yo confirmo y listo. Sin app, sin locura.",
  },
  {
    name: "Sofía V.",
    restaurant: "Sushi Express · Rosario",
    initials: "SV",
    text: "El panel admin es súper intuitivo. Actualizo precios en segundos y mis clientes lo ven al instante.",
  },
];

const plans = [
  {
    name: "Starter",
    priceMonthly: null as number | null,
    price: "Gratis",
    period: "para siempre",
    desc: "Para arrancar sin riesgo",
    features: [
      "Menú digital completo",
      "Hasta 20 productos",
      "Pedidos por WhatsApp",
      "Link y código QR",
      "Panel admin (1 usuario)",
    ],
    cta: "Empezar gratis →",
    featured: false,
  },
  {
    name: "Pro",
    priceMonthly: 17000,
    price: "$17.000",
    period: "/mes",
    desc: "Para negocios que quieren crecer",
    features: [
      "Todo lo del plan Starter",
      "Productos ilimitados",
      "URL en takefyy.com/tu-local",
      "Sin logo de Takefyy",
      "Colores personalizados",
      "Estadísticas de ventas",
      "Sin comisiones por pedido",
      "Hasta 3 administradores",
    ],
    cta: "Empezar gratis →",
    featured: true,
  },
  {
    name: "Growth",
    priceMonthly: 27000,
    price: "$27.000",
    period: "/mes",
    desc: "Para locales con alto volumen",
    features: [
      "Todo lo del plan Pro",
      "Administradores ilimitados",
      "Reportes avanzados",
      "Soporte prioritario directo",
    ],
    cta: "Contactar →",
    featured: false,
  },
];

const faqs = [
  {
    q: "¿Necesito saber programar?",
    a: "Para nada. El panel es tan intuitivo que cualquier persona puede armarlo en minutos. Solo cargás tus productos, poné los precios y listo.",
  },
  {
    q: "¿Cómo llegan los pedidos?",
    a: 'Directo a tu WhatsApp. El cliente arma su pedido, hace click en "Hacer pedido" y te manda un mensaje con todos los detalles: nombre, dirección y qué pidió.',
  },
  {
    q: "¿Puedo personalizar los colores y logo?",
    a: "Sí, en los planes Pro y Growth. Podés cargar tu logo, elegir tus colores y tu menú va a tener tu identidad. En el plan Starter el menú funciona con la estética estándar de Takefyy.",
  },
  {
    q: "¿Hay comisión por pedido?",
    a: "No. Pagás la suscripción mensual y listo. Sin sorpresas, sin porcentajes por cada venta. El dinero de tus clientes es tuyo.",
  },
  {
    q: "¿Qué pasa cuando termina el período de prueba?",
    a: "Te avisamos antes de que expire. Si querés continuar, elegís un plan. Si no, no te cobramos nada.",
  },
  {
    q: "¿Puedo cancelar cuando quiero?",
    a: "Sí. Sin permanencia, sin letras chicas. Si no te convence, cancelás en un click y no pasa nada.",
  },
  {
    q: "¿En qué se diferencia de otras plataformas?",
    a: "Takefyy está hecho exclusivamente para gastronomía argentina. Precio fijo en pesos, todo incluido desde el primer día, sin módulos extra ni costos en dólares. El pedido llega directo a tu WhatsApp, sin bots ni apps intermediarias.",
  },
  {
    q: "¿Funciona para mi tipo de local?",
    a: "Sí. Hamburgueserías, pizzerías, dark kitchens, rotiserías, sushi, heladerías, bares, food trucks — cualquier negocio gastronómico que venda o haga delivery. Si vendés comida, Takefyy funciona para vos.",
  },
];

const marqueeItems = [
  "Menú digital",
  "Pedidos por WhatsApp",
  "0% comisión",
  "Setup en 3 minutos",
  "Sin apps que instalar",
  "URL propia",
  "Panel admin",
  "Entregás más",
  "Hecho en Argentina",
  "Precio en pesos",
  "Sin dólares",
  "Para hamburgueserías",
  "Menú digital",
  "Pedidos por WhatsApp",
  "0% comisión",
  "Setup en 3 minutos",
  "Sin apps que instalar",
  "URL propia",
  "Panel admin",
  "Entregás más",
  "Hecho en Argentina",
  "Precio en pesos",
  "Sin dólares",
  "Para hamburgueserías",
];

const stats = [
  {
    value: 0,
    suffix: "%",
    label: "Comisión por pedido",
    iconKey: "shield",
    color: "#22c55e",
  },
  {
    value: 3,
    suffix: " min",
    label: "Para estar online",
    iconKey: "zap",
    color: "var(--accent)",
  },
  {
    value: 0,
    suffix: " USD",
    label: "El precio es en pesos",
    iconKey: "trending",
    color: "#f59e0b",
  },
  {
    value: 100,
    suffix: "%",
    label: "Directo a tu WhatsApp",
    iconKey: "message",
    color: "#25D366",
  },
];

function PhoneMockup() {
  return (
    <div
      style={{
        width: 260,
        height: 480,
        background: "#0D0D0D", // phone bezel matches screenshot theme
        borderRadius: 36,
        border: "2.5px solid rgba(255,107,53,0.25)",
        padding: "8px 6px 12px", // tight padding for maximum screen space
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow:
          "0 0 0 8px rgba(255,107,53,0.04), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        userSelect: "none",
      }}
    >
      {/* Top Phone bar (Status bar) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 10px",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 9, color: "#F0EDE8", fontWeight: 600 }}>
          9:41
        </span>
        <div
          style={{
            width: 50,
            height: 12,
            background: "#000",
            borderRadius: "0 0 8px 8px",
            marginTop: -8,
          }}
        />
        <span
          style={{ fontSize: 9, color: "#F0EDE8", display: "flex", gap: 3 }}
        >
          📶 🔋
        </span>
      </div>

      {/* Screen container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 22,
          background: "#0D0D0D", // match dark theme
          position: "relative",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Scrollable screen content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: 60, // space for the floating cart
          }}
          className="phone-scroll"
        >
          <style>{`
            .phone-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Restaurant Banner Header */}
          <div
            style={{
              height: 105,
              position: "relative",
              backgroundImage:
                "url('https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/larryssburgers/banner_url.png?t=1781301346730')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              flexShrink: 0,
            }}
          >
            {/* Dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,13,13,0.95) 100%)",
              }}
            />

            {/* Abierto Status badge */}
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(34,197,94,0.9)",
                color: "#fff",
                fontSize: 7,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                }}
              />
              Abierto
            </div>

            {/* Restaurant Logo */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: "50%",
                transform: "translateX(-50%)",
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: "#0D0D0D",
                backgroundImage:
                  "url('https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/larryssburgers/logo_url.png?t=1781301339056')",
                backgroundSize: "cover",
              }}
            />

            {/* Titles */}
            <div
              style={{
                position: "absolute",
                bottom: 4,
                left: 0,
                right: 0,
                textAlign: "center",
                padding: "0 8px",
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Larry's Burgers
              </h3>
              <p
                style={{
                  fontSize: 8,
                  color: "rgba(255,255,255,0.6)",
                  margin: "1px 0 3px",
                }}
              >
                Real Smash Burgers · San Rafael
              </p>

              {/* Info icons row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 7,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <span>🕒 20:00 - 00:00</span>
                <span>📍 San Rafael, Mza</span>
              </div>
            </div>
          </div>

          {/* Categories Horizontal Tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "0 10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: "#8B1A1A",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 3,
                border: "1px solid rgba(255,107,53,0.15)",
              }}
            >
              🍔 Burgers
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: "#1E1E24",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              🍟 Extras
            </div>
          </div>

          {/* Category Section Title */}
          <div
            style={{
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: "#F5C518",
                letterSpacing: "0.08em",
              }}
            >
              🍔 BURGERS
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>

          {/* Products List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "0 10px",
            }}
          >
            {/* Product 1 — The Larry */}
            <div
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                gap: 8,
                position: "relative",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Popular badge */}
                <span
                  style={{
                    background: "rgba(245,197,24,0.12)",
                    color: "#F5C518",
                    fontSize: 6,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  ☆ Más pedido
                </span>
                <h4
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    margin: "4px 0 2px",
                  }}
                >
                  The Larry
                </h4>
                <p
                  style={{
                    fontSize: 7,
                    color: "rgba(255,255,255,0.55)",
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  1 medallon de 100gr - Cebolla caramelizada - 4 fetas de
                  cheddar - Salsa Larry
                </p>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--accent)",
                    display: "block",
                  }}
                >
                  $ 8.500
                </span>
              </div>

              {/* Product Image + add button */}
              <div
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <Image
                  src="https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/9f9897cc-5cf0-4aac-96ba-e76d2ef8a0fa-1781283776830.jpeg"
                  alt="The Larry"
                  fill
                  sizes="56px"
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#8B1A1A",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  +
                </div>
              </div>
            </div>

            {/* Product 2 — Ultra Chesse */}
            <div
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 2px",
                  }}
                >
                  Ultra Chesse
                </h4>
                <p
                  style={{
                    fontSize: 7,
                    color: "rgba(255,255,255,0.55)",
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  1 medallon de 100gr - 6 fetas de cheddar - Cebolla en cubitos
                  - Salsa Larry
                </p>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--accent)",
                    display: "block",
                  }}
                >
                  $ 8.999
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <Image
                  src="https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/384d792a-6a88-4c3b-97b7-7019bf6f743b-1781283780827.jpeg"
                  alt="Ultra Chesse"
                  fill
                  sizes="56px"
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#8B1A1A",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  +
                </div>
              </div>
            </div>

            {/* Product 3 — Bacon Larry */}
            <div
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: 10,
                display: "flex",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    margin: "0 0 2px",
                  }}
                >
                  Bacon Larry
                </h4>
                <p
                  style={{
                    fontSize: 7,
                    color: "rgba(255,255,255,0.55)",
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  1 medallon de 100gr - 4 fetas de cheddar - 2 fetas bacon -
                  Salsa Larry
                </p>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--accent)",
                    display: "block",
                  }}
                >
                  $ 9.000
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <Image
                  src="https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/803cf764-89a1-4f4f-8fe2-7d60303f96c6-1781283784115.jpeg"
                  alt="Bacon Larry"
                  fill
                  sizes="56px"
                  style={{
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />

                {/* Quantity counter pill */}
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -8,
                    background: "#8B1A1A",
                    borderRadius: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  <span style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>
                    -
                  </span>
                  <span style={{ fontSize: 7, color: "#fff", fontWeight: 900 }}>
                    1
                  </span>
                  <span style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>
                    +
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Bar */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            right: 8,
            background: "#8B1A1A",
            borderRadius: 14,
            padding: "8px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 16px rgba(139,26,26,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 100,
          }}
        >
          {/* Left: Cart badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "3px 6px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <ShoppingCart size={9} color="#fff" />
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>
                1
              </span>
            </div>
            <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>
              Bacon Larry
            </span>
          </div>

          {/* Right: Price & Delivery */}
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: 9,
                color: "#fff",
                fontWeight: 800,
                display: "block",
              }}
            >
              $ 9.000
            </span>
            <span
              style={{
                fontSize: 6,
                color: "rgba(255,255,255,0.7)",
                display: "block",
              }}
            >
              + envío $ 2.000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Floating notification toast */
function FloatToast({
  icon,
  title,
  sub,
  color = "rgba(255,107,53,0.25)",
  delay = 0,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  color?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className="float-a"
      style={{
        position: "absolute",
        background: "rgba(20,23,30,0.92)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${color}`,
        borderRadius: 14,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        zIndex: 10,
        ...style,
      }}
    >
      <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
          {title}
        </div>
        <div
          style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}
        >
          {sub}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAGNETIC BUTTON ─────────────────────────────────────────────────────── */
function MagneticButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);
  const springX = useSpring(posX, { stiffness: 200, damping: 20 });
  const springY = useSpring(posY, { stiffness: 200, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    posX.set((e.clientX - cx) * 0.35);
    posY.set((e.clientY - cy) * 0.35);
  }
  function handleMouseLeave() {
    posX.set(0);
    posY.set(0);
  }
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 700);
    onClick?.();
  }

  return (
    <motion.button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500"
      style={{
        x: springX,
        y: springY,
        background: "var(--accent)",
        border: "none",
        cursor: "pointer",
        padding: "18px 52px",
        fontSize: 18,
        borderRadius: 999,
        color: "#fff",
        fontWeight: 700,
        position: "relative",
        overflow: "visible",
      }}
      whileHover={{
        scale: 1.06,
        filter: "brightness(1.15)",
        boxShadow: "0 12px 48px rgba(255,107,53,0.55)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
      {/* Particle burst */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
          animate={{
            x: p.x + (Math.random() - 0.5) * 120,
            y: p.y - 80 - Math.random() * 60,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#fff",
            pointerEvents: "none",
            left: 0,
            top: 0,
          }}
        />
      ))}
    </motion.button>
  );
}

/* ─── PRICING TOGGLE ──────────────────────────────────────────────────────── */
function PricingToggle({
  annual,
  onToggle,
}: {
  annual: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 24,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: annual ? "var(--text-muted)" : "var(--text-primary)",
          transition: "color 0.25s",
        }}
      >
        Mensual
      </span>
      <button
        onClick={onToggle}
        style={{
          width: 52,
          height: 28,
          borderRadius: 999,
          background: annual ? "var(--accent)" : "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.25s",
          padding: 0,
        }}
      >
        <motion.span
          animate={{ x: annual ? 26 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={{
            display: "block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 2,
            left: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </button>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: annual ? "var(--text-primary)" : "var(--text-muted)",
          transition: "color 0.25s",
        }}
      >
        Anual{" "}
        <motion.span
          animate={{ opacity: annual ? 1 : 0, scale: annual ? 1 : 0.8 }}
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: 999,
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#22c55e",
            marginLeft: 4,
          }}
        >
          −20%
        </motion.span>
      </span>
    </div>
  );
}

/* ─── ANIMATED TESTIMONIALS ───────────────────────────────────────────────── */
const allTestimonials = [
  {
    initials: "LB",
    name: "Larry's Burgers",
    location: "Real Smash Burgers · San Rafael, Mendoza",
    img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/larryssburgers/logo_url.png?t=1781289992571",
    stars: 5,
    badge: "Caso de Éxito",
    quote:
      "Fuimos de los primeros en confiar en Takefyy. El resultado fue inmediato: pasamos de anotar pedidos a mano por WhatsApp a recibir todo ya detallado. Cero errores, clientes más felices y más tiempo para tirar las mejores smash burgers.",
    highlights: [
      "⚡ Pedidos 100% automatizados",
      "🎯 Cero errores de envío",
      "📈 Mayor ticket promedio",
    ],
  },
  {
    initials: "RB",
    name: "Riqq's Burgers",
    location: "Amor a primera mordida · Catriel, Río Negro",
    img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/riqqsburgers/logo_url.png",
    stars: 5,
    badge: "Caso de Éxito",
    quote:
      "Takefyy nos cambió la forma de trabajar. Antes nos volvíamos locos atendiendo llamadas. Ahora los clientes arman el pedido solos y nos llega todo ordenado. El ticket promedio subió un 25% gracias al carrito.",
    highlights: [
      "⚡ 2 horas/noche ahorradas en WhatsApp",
      "📈 +25% en el ticket promedio",
      "🍔 Menú digital visual y rápido",
    ],
  },
  {
    initials: "MG",
    name: "Martina G.",
    location: "Burguer Palace · Buenos Aires",
    img: "",
    stars: 5,
    badge: "Cliente",
    quote:
      "En un día ya estábamos tomando pedidos por WhatsApp. Mis clientes lo aman porque es simple y rápido. Dejé de perder tiempo en llamadas y ahora el negocio va solo.",
    highlights: [
      "✅ Setup en menos de 1 día",
      "💬 Clientes más felices",
      "🚀 Negocio más autónomo",
    ],
  },
];

function AnimatedTestimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // ponytail: pausa el auto-advance fuera de viewport — evita re-renders/timers
  // desperdiciados mientras el usuario está en otra sección de la landing.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % allTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [inView]);

  function goTo(idx: number) {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }

  const t = allTestimonials[current];

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {/* Stacked avatar indicators */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 32,
          alignItems: "center",
        }}
      >
        {allTestimonials.map((item, i) => (
          <motion.button
            key={i}
            onClick={() => goTo(i)}
            animate={{
              scale: i === current ? 1.2 : 1,
              zIndex: i === current ? 10 : 3 - i,
              x: i === 0 ? 0 : i === 1 ? -10 : -20,
            }}
            whileHover={{ scale: 1.35, zIndex: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border:
                i === current
                  ? "2.5px solid var(--accent)"
                  : "2.5px solid rgba(255,255,255,0.12)",
              background: item.img ? "transparent" : "var(--accent)",
              cursor: "pointer",
              padding: 0,
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow:
                i === current ? "0 0 0 3px rgba(255,107,53,0.3)" : "none",
            }}
          >
            {item.img ? (
              <Image
                src={item.img}
                alt={item.name}
                fill
                sizes="48px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                {item.initials}
              </span>
            )}
          </motion.button>
        ))}
        <div style={{ marginLeft: 20, display: "flex", gap: 8 }}>
          {allTestimonials.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{
                width: i === current ? 24 : 8,
                background:
                  i === current ? "var(--accent)" : "rgba(255,107,53,0.25)",
              }}
              style={{
                height: 8,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Testimonial card with slide animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 60 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "var(--brand-dark)",
            border: "1px solid rgba(255,107,53,0.18)",
            borderRadius: 24,
            padding: "40px 36px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Big quote mark */}
          <span
            style={{
              position: "absolute",
              top: -20,
              left: 24,
              fontSize: 120,
              fontFamily: "Georgia, serif",
              color: "var(--accent)",
              opacity: 0.07,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            &ldquo;
          </span>

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Stars + badge */}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex" }}>
                {"★★★★★".split("").map((s, si) => (
                  <span
                    key={si}
                    style={{ color: "var(--accent)", fontSize: 18 }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <span
                style={{
                  background: "rgba(255,107,53,0.12)",
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t.badge}
              </span>
            </div>

            {/* Quote */}
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: "#fff",
                fontStyle: "italic",
                marginBottom: 28,
                maxWidth: 680,
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Highlights */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {t.highlights.map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "5px 12px",
                    borderRadius: 8,
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  position: "relative",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,107,53,0.3)",
                  flexShrink: 0,
                  background: t.img ? "transparent" : "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.img ? (
                  <Image
                    src={t.img}
                    alt={t.name}
                    fill
                    sizes="44px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span
                    style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}
                  >
                    {t.initials}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                  {t.location}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function HomeClient({
  restaurantCount,
}: {
  restaurantCount: number;
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [ventasDelivery, setVentasDelivery] = useState(800000);
  const [isMobile, setIsMobile] = useState(false);
  const [showSpline, setShowSpline] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isHoveringHero = useRef(false);

  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);
    if (isMobileDevice) return;
    // ponytail: mobile no carga Spline — WebGL bloquea LCP; agregar si se pide feature mobile

    // Defer el mount de Spline hasta que el hilo principal esté libre: si carga
    // en el mismo tick que la hidratación, los clicks del nav (scrollIntoView)
    // se pierden porque React todavía no terminó de adjuntar los handlers.
    const ric =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) => setTimeout(cb, 300));
    const id = ric(() => setShowSpline(true));
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
      else clearTimeout(id as unknown as number);
    };
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("takefyy_banner_dismissed") === "1") {
      setBannerDismissed(true);
    }
  }, []);

  function dismissBanner() {
    setBannerDismissed(true);
    localStorage.setItem("takefyy_banner_dismissed", "1");
  }

  // Idle automatic mouse drift — uses transform (compositor-only) to avoid layout recalcs
  useEffect(() => {
    let start = Date.now();
    let frame: number;
    let tick_i = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);
      tick_i++;
      if (tick_i % 3 !== 0) return; // ~20fps — decorative, 60fps is wasteful
      if (!isHoveringHero.current && glowRef.current) {
        const elapsed = (Date.now() - start) / 1000;
        const x = 0.22 * Math.sin(elapsed * 0.7);
        const y = 0.22 * Math.cos(elapsed * 0.4);
        glowRef.current.style.transform = `translate3d(${x * 600}px, ${y * 600}px, 0)`;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    isHoveringHero.current = true;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect || !glowRef.current) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    glowRef.current.style.transform = `translate3d(${x * 400}px, ${y * 400}px, 0)`;
  }

  function handleHeroMouseLeave() {
    isHoveringHero.current = false;
  }

  function scrollTo(id: string) {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const navLinks = [
    { label: "Producto", id: "producto" },
    { label: "Precios", id: "precios" },
    { label: "Clientes", id: "clientes" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <div
      style={{
        background: "var(--brand-dark)",
        color: "var(--dash-text)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(14,17,22,0.88)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255,107,53,0.1)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" style={{ color: "var(--dash-text)" }}>
            <TakefyyLogo size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm font-medium"
                style={{
                  color: "var(--dash-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.15s",
                  padding: "12px 8px",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  WebkitAppearance: "none",
                  appearance: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--dash-text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--dash-muted)")
                }
              >
                {l.label}
              </button>
            ))}
            <Link
              href="/blog"
              className="text-sm font-medium"
              style={{
                color: "var(--dash-muted)",
                transition: "color 0.15s",
                padding: "12px 8px",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--dash-text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--dash-muted)")
              }
            >
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium"
              style={{
                color: "var(--dash-muted)",
                transition: "color 0.15s",
                padding: "12px 8px",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--dash-text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--dash-muted)")
              }
            >
              Iniciar sesión
            </Link>
            <motion.button
              onClick={() => {
                trackLandingEvent("cta_click", {
                  label: "empezar",
                  section: "navbar",
                });
                window.open(
                  WHATSAPP_URL("Hola! Me interesa Takefyy para mi negocio 🚀"),
                  "_blank",
                );
              }}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: "var(--accent)",
                border: "none",
                cursor: "pointer",
                WebkitAppearance: "none",
                appearance: "none",
              }}
              whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.97 }}
            >
              Empezar →
            </motion.button>
            <button
              className="md:hidden p-2"
              style={{
                color: "var(--dash-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
                WebkitAppearance: "none",
                appearance: "none",
              }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                {mobileOpen ? (
                  <path
                    d="M4 4L18 18M18 4L4 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h16M3 11h16M3 16h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease }}
              className="md:hidden overflow-hidden"
              style={{
                background: "rgba(10,12,17,0.99)",
                backdropFilter: "blur(24px)",
                borderTop: "1px solid rgba(255,107,53,0.15)",
              }}
            >
              <div style={{ padding: "12px 0 32px" }}>
                {navLinks.map((l, i) => (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.22 }}
                    onClick={() => scrollTo(l.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      textAlign: "left",
                      fontSize: 20,
                      fontFamily: "var(--font-anton)",
                      letterSpacing: "0.05em",
                      color: "rgba(255,255,255,0.8)",
                      background: "none",
                      border: "none",
                      borderRadius: 0,
                      WebkitAppearance: "none",
                      appearance: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      padding: "18px 24px",
                      transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = "#FF6B35";
                      el.style.background = "rgba(255,107,53,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.color = "rgba(255,255,255,0.8)";
                      el.style.background = "none";
                    }}
                  >
                    <span>{l.label}</span>
                    <span
                      style={{
                        fontSize: 16,
                        color: "rgba(255,107,53,0.5)",
                        lineHeight: 1,
                      }}
                    >
                      →
                    </span>
                  </motion.button>
                ))}

                {/* Blog link */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.06, duration: 0.22 }}
                >
                  <Link
                    href="/blog"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 20,
                      fontFamily: "var(--font-anton)",
                      letterSpacing: "0.05em",
                      color: "#FF6B35",
                      padding: "18px 24px",
                      textDecoration: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      transition: "opacity 0.15s",
                    }}
                  >
                    <span>Blog</span>
                    <span style={{ fontSize: 16, opacity: 0.6 }}>→</span>
                  </Link>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (navLinks.length + 1) * 0.06,
                    duration: 0.25,
                  }}
                  style={{ padding: "28px 24px 0" }}
                >
                  <a
                    href={WHATSAPP_URL(
                      "Hola! Me interesa Takefyy para mi negocio 🚀",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "15px 20px",
                      background: "#FF6B35",
                      color: "white",
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: "0.03em",
                      textDecoration: "none",
                      boxShadow: "0 4px 24px rgba(255,107,53,0.35)",
                    }}
                  >
                    Empezar gratis
                    <span style={{ fontSize: 18 }}>→</span>
                  </a>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          position: "relative",
          background: "#0E1116",
          overflowX: "clip",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 64,
          paddingBottom: 40,
        }}
      >
        {/* Shader background */}
        <HeroShader />

        {/* Mouse-tracking glow — transform-only updates stay on compositor thread */}
        <div
          ref={glowRef}
          style={{
            position: "absolute",
            left: "calc(50% - 300px)",
            top: "calc(50% - 300px)",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.09) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
            willChange: "transform",
          }}
        />

        {/* Static glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-6%",
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* ── Robot ─────────────────────────────────────────────────────────────
            Mobile: position:relative, in-flow, height 72vw — appears above text
            Desktop: position:absolute (via CSS), right:0, width:55%, height:100%
                     relative to THIS SECTION (full viewport height + right edge)
        ─────────────────────────────────────────────────────────────────────── */}
        <div className="hero-robot" style={{ zIndex: 1 }}>
          {/* Spline 3D robot — lazy: desktop carga post-mount, mobile difiere hasta scroll o 3s */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              opacity: splineLoaded ? 1 : 0,
              transition: "opacity 0.9s ease",
            }}
          >
            {showSpline && (
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
                onLoad={() => setSplineLoaded(true)}
              />
            )}
          </div>

          {/* Takefyy logo — centrado en el robot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.7, ease }}
            style={{
              position: "absolute",
              top: "48%",
              left: "38%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: -32,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,107,53,0.28) 0%, transparent 70%)",
                filter: "blur(16px)",
                zIndex: -1,
              }}
            />
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: "rgba(14,17,22,0.72)",
                border: "1.5px solid rgba(255,107,53,0.5)",
                borderRadius: 22,
                padding: "10px 20px",
                backdropFilter: "blur(16px)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.06), 0 12px 40px rgba(255,107,53,0.25), 0 2px 8px rgba(0,0,0,0.6)",
                color: "#fff",
              }}
            >
              <TakefyyLogo size="md" className="md:hidden" />
              <TakefyyLogo size="lg" className="hidden md:flex" />
            </motion.div>
          </motion.div>
        </div>

        {/* ── Text content ───────────────────────────────────────────────────────
            Mobile: in-flow below the robot
            Desktop: centered in section (robot is absolute, out of flow)
        ─────────────────────────────────────────────────────────────────────── */}
        <div
          className="max-w-6xl mx-auto px-5 sm:px-8 w-full"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="md:max-w-[50%] py-6 md:py-0">
            <motion.div {...fadeUp(0)} className="mb-6">
              <a
                href="#producto"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("producto")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: "rgba(255,107,53,0.1)",
                  border: "1px solid rgba(255,107,53,0.22)",
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                Hecho para hamburgueserías, pizzerías y dark kitchens
                <ChevronRight
                  size={13}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
            </motion.div>

            {/* Anton headline */}
            <h1
              className="hero-heading mb-5 md:mb-7"
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                lineHeight: 0.93,
                letterSpacing: "0.01em",
                color: "#fff",
                fontWeight: 400,
                margin: "0 0 1.25rem",
              }}
            >
              <motion.span style={{ display: "block" }} {...fadeUp(0.08)}>
                Tu carta,
              </motion.span>
              <motion.span style={{ display: "block" }} {...fadeUp(0.16)}>
                <span className="gradient-text-animate">online</span>
              </motion.span>
              <motion.span style={{ display: "block" }} {...fadeUp(0.24)}>
                en minutos.
              </motion.span>
            </h1>

            <motion.p
              {...fadeUp(0.34)}
              className="mb-8 md:mb-10"
              style={{
                fontSize: "clamp(0.95rem, 3.5vw, 1.1rem)",
                lineHeight: 1.7,
                color: "var(--dash-muted)",
                maxWidth: 450,
                textWrap: "pretty",
              }}
            >
              Tu menú digital en minutos, pedidos directo a tu WhatsApp. Sin
              comisiones, sin módulos, sin costos en dólares. Todo incluido en
              un precio en pesos.
            </motion.p>

            <motion.div {...fadeUp(0.43)} className="mb-6">
              <div className="hero-cta-group flex flex-wrap gap-3 mb-3">
                <motion.a
                  href="/signup"
                  onClick={() => {
                    trackLandingEvent("cta_click", {
                      label: "empezar_gratis",
                      section: "hero",
                    });
                  }}
                  className="rounded-full px-7 py-3.5 text-sm font-bold text-white"
                  style={{
                    background: "var(--accent)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                  whileHover={{
                    scale: 1.05,
                    filter: "brightness(1.12)",
                    boxShadow: "0 6px 32px rgba(255,107,53,0.45)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  Empezar gratis →
                </motion.a>
                <motion.a
                  href="/larryssburgers"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold"
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.16)",
                    color: "#fff",
                    background: "transparent",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  whileHover={{
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  Ver Larry's en vivo
                </motion.a>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,232,0.4)",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Check size={11} style={{ color: "#22c55e", flexShrink: 0 }} />
                Sin tarjeta de crédito · Setup en 3 minutos · Cancelás cuando
                querés
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--accent)",
          overflow: "hidden",
          padding: "14px 0",
        }}
      >
        <div
          className="marquee-track"
          style={{ display: "flex", width: "max-content" }}
        >
          {marqueeItems.map((item, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 16,
                padding: "0 20px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {item}
              </span>
              <Star
                size={8}
                fill="rgba(255,255,255,0.5)"
                stroke="none"
                style={{ flexShrink: 0 }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section
        className="py-14 md:py-20"
        style={{
          background: "#0E1116",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="stats-cell"
                style={{
                  textAlign: "center",
                  padding: "24px 12px",
                  position: "relative",
                }}
              >
                {i < stats.length - 1 && (
                  <div
                    className="hidden md:block"
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "20%",
                      bottom: "20%",
                      width: 1,
                      background: "rgba(255,255,255,0.06)",
                    }}
                  />
                )}
                {/* Icon badge */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    color: s.color,
                  }}
                >
                  {s.iconKey === "shield" && <Shield size={18} />}
                  {s.iconKey === "zap" && <Zap size={18} />}
                  {s.iconKey === "trending" && <TrendingUp size={18} />}
                  {s.iconKey === "message" && <MessageCircle size={18} />}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: "clamp(2.4rem, 4.5vw, 3.8rem)",
                    color: s.color,
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                    marginBottom: 8,
                    textShadow: `0 0 40px ${s.color}40`,
                  }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--dash-muted)",
                    letterSpacing: "0.01em",
                    lineHeight: 1.4,
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIPOS DE LOCAL ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#0E1116",
          padding: "80px 0",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-12"
          >
            <SectionLabel>PARA CADA TIPO DE LOCAL</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                letterSpacing: "0.01em",
                color: "#fff",
                lineHeight: 1.0,
                textWrap: "balance",
              }}
            >
              Para cada tipo de local gastronómico
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { Icon: Utensils, label: "Hamburguesería" },
              { Icon: UtensilsCrossed, label: "Pizzería" },
              { Icon: Package, label: "Dark Kitchen" },
              { Icon: ChefHat, label: "Rotisería" },
              { Icon: Snowflake, label: "Heladería" },
              { Icon: Fish, label: "Sushi" },
              { Icon: Wine, label: "Bar / Restó" },
              { Icon: Truck, label: "Food Truck" },
            ].map(({ Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05, ease }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "24px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon size={28} color="rgba(255,107,53,0.75)" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.3,
                  }}
                >
                  {label}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease }}
            style={{
              textAlign: "center",
              fontSize: 16,
              color: "var(--dash-muted)",
              fontStyle: "italic",
            }}
          >
            &quot;Si vendés comida, Takefyy funciona para vos.&quot;
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.55, ease }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 32,
            }}
          >
            {[
              { label: "Menú para hamburguerías →", href: "/hamburgueserias" },
              { label: "Menú para pizzerías →", href: "/pizzerias" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 18px",
                  borderRadius: 99,
                  background: "rgba(255,107,53,0.08)",
                  border: "1px solid rgba(255,107,53,0.2)",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition:
                    "background-color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES (Bento) ────────────────────────────────────────────────── */}
      <section
        id="producto"
        style={{ background: "var(--brand-cream)", padding: "100px 0" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-16"
          >
            <SectionLabel>CÓMO FUNCIONA</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
                textWrap: "balance",
              }}
            >
              Tan simple que da
              <br />
              vergüenza ajena.
            </h2>
          </motion.div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1 — large */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease }}
              style={{
                background: "var(--brand-dark)",
                borderRadius: 24,
                padding: 36,
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,107,53,0.12)",
                minHeight: 220,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle at top right, rgba(255,107,53,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "4.5rem",
                  color: "var(--accent)",
                  lineHeight: 1,
                  marginBottom: 20,
                  letterSpacing: "0.01em",
                }}
              >
                01
              </div>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                Cargás tu menú
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--dash-muted)",
                  lineHeight: 1.6,
                  maxWidth: 340,
                }}
              >
                Productos, fotos, precios y categorías. En minutos tenés tu
                carta lista para compartir.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1, ease }}
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                padding: 36,
                border: "1px solid var(--border)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "4.5rem",
                  color: "var(--accent)",
                  lineHeight: 1,
                  marginBottom: 20,
                  letterSpacing: "0.01em",
                }}
              >
                02
              </div>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                Compartís el link
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                Tu URL propia, lista al instante.
              </p>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--accent)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                → takefyy.com/tu-restaurante
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15, ease }}
              style={{
                background: "linear-gradient(135deg, #FF6B35 0%, #d94f1e 100%)",
                borderRadius: 24,
                padding: 32,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.06,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: "120px 120px",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "4.5rem",
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1,
                  marginBottom: 20,
                  letterSpacing: "0.01em",
                }}
              >
                03
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                Recibís pedidos
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.6,
                }}
              >
                Directo a tu WhatsApp, sin intermediarios, sin comisiones por
                cada pedido.
              </p>
            </motion.div>

            {/* Card 4 — wide: feature tags */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2, ease }}
              style={{
                background: "var(--surface)",
                borderRadius: 24,
                padding: "28px 32px",
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 18,
                }}
              >
                Todo incluido
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  "Fotos y descripciones",
                  "Badges y promos",
                  "Carrito integrado",
                  "Panel admin",
                  "URL propia",
                  "Pedidos por WhatsApp",
                  "Sin comisiones",
                  "Soporte incluido",
                ].map((feat, i) => (
                  <motion.span
                    key={feat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 999,
                      background:
                        i < 4 ? "rgba(255,107,53,0.08)" : "var(--surface-2)",
                      border: `1px solid ${i < 4 ? "rgba(255,107,53,0.2)" : "var(--border)"}`,
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        i < 4 ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background:
                          i < 4 ? "var(--accent)" : "var(--text-muted)",
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    {feat}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SHOWCASE ────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--brand-dark)",
          padding: "100px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "15%",
            top: "40%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="max-w-6xl mx-auto px-5 sm:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
              className="flex justify-center md:justify-start"
              style={{ position: "relative" }}
            >
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  filter:
                    "drop-shadow(0 40px 80px rgba(255,107,53,0.25)) drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 300,
                    height: 300,
                    background:
                      "radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)",
                    pointerEvents: "none",
                    zIndex: -1,
                  }}
                />
                <PhoneMockup />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
            >
              <SectionLabel>QUÉ INCLUYE</SectionLabel>
              <h2
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  letterSpacing: "0.01em",
                  color: "#fff",
                  lineHeight: 1.0,
                  marginBottom: 36,
                }}
              >
                Todo lo que necesitás,
                <br />
                nada de lo que no.
              </h2>
              <div className="flex flex-col gap-3">
                {showcaseFeatures.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(255,107,53,0.05)",
                      border: "1px solid rgba(255,107,53,0.1)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "rgba(240,237,232,0.85)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </motion.div>
                ))}
              </div>
              <Link
                href="/larryssburgers"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--accent)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  marginTop: 28,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,107,53,0.3)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,107,53,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,107,53,0.3)")
                }
              >
                Así lo usa Larry's Burgers: takefyy.com/larryssburgers →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EN 3 PASOS ──────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "100px 0" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <SectionLabel>EN 3 PASOS</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
              }}
            >
              Tu carta online en minutos.
            </h2>
            <p
              style={{
                marginTop: 16,
                color: "var(--text-secondary)",
                fontSize: 16,
                maxWidth: 480,
                margin: "16px auto 0",
                lineHeight: 1.6,
              }}
            >
              Sin técnicos, sin complicaciones. Hoy arrancás.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
              position: "relative",
            }}
          >
            {/* Connecting line (desktop only) */}
            <div
              style={{
                position: "absolute",
                top: 44,
                left: "calc(16% + 24px)",
                right: "calc(16% + 24px)",
                height: 2,
                background:
                  "linear-gradient(90deg, var(--accent), rgba(255,107,53,0.2))",
                pointerEvents: "none",
                zIndex: 0,
              }}
              className="hidden md:block"
            />

            {[
              {
                step: "01",
                icon: <MessageCircle size={22} />,
                title: "Nos escribís por WhatsApp",
                desc: "Mandanos tu menú — fotos, lista o PDF. En minutos lo cargamos por vos.",
                color: "var(--accent)",
              },
              {
                step: "02",
                icon: <Smartphone size={22} />,
                title: "Armamos tu carta digital",
                desc: "Tu menú queda publicado en takefyy.com/tunegocio con fotos y precios.",
                color: "#f59e0b",
              },
              {
                step: "03",
                icon: <QrCode size={22} />,
                title: "Compartís el link con tus clientes",
                desc: "Escaneando el QR o con el link directo. Los pedidos te llegan por WhatsApp al instante.",
                color: "#22c55e",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease }}
                style={{ position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: "28px 24px 24px",
                    height: "100%",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,107,53,0.35)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Step badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `${item.color}18`,
                        border: `1px solid ${item.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-anton)",
                        fontSize: "2.8rem",
                        color: "var(--border)",
                        lineHeight: 1,
                        letterSpacing: "0.02em",
                        userSelect: "none",
                      }}
                    >
                      {item.step}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease }}
            style={{ textAlign: "center", marginTop: 48 }}
          >
            <button
              onClick={() => {
                trackLandingEvent("cta_click", {
                  label: "empezar_ahora",
                  section: "como_funciona",
                });
                window.open(
                  WHATSAPP_URL(
                    "Hola! Quiero crear mi carta digital con Takefyy 🚀",
                  ),
                  "_blank",
                );
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                transition: "filter 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <MessageCircle size={16} />
              Empezar ahora — es gratis
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── SIN LETRA CHICA ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--brand-cream)",
          padding: "100px 0",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <SectionLabel>SIN LETRA CHICA</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
                textWrap: "balance",
              }}
            >
              Todo incluido. Sin comisiones. Sin sorpresas.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Columna Takefyy */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,107,53,0.18)",
                borderRadius: 20,
                padding: "32px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--accent)",
                    fontFamily: "var(--font-anton)",
                    letterSpacing: "0.06em",
                  }}
                >
                  CON TAKEFYY
                </span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Check size={13} strokeWidth={2.5} />
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  "Precio fijo en ARS",
                  "Todo incluido desde el día 1",
                  "Setup en 3 minutos",
                  "Pedidos directo a tu WhatsApp",
                  "Sin comisión por pedido",
                  "Soporte en castellano argentino",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(34,197,94,0.05)",
                      border: "1px solid rgba(34,197,94,0.1)",
                    }}
                  >
                    <span
                      style={{
                        color: "#22c55e",
                        flexShrink: 0,
                        display: "flex",
                      }}
                    >
                      <Check size={13} strokeWidth={2.5} />
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "rgba(240,237,232,0.85)",
                        lineHeight: 1.4,
                      }}
                    >
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Columna Otros */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "32px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-anton)",
                    letterSpacing: "0.06em",
                  }}
                >
                  CON OTROS
                </span>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <X size={13} strokeWidth={2.5} />
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  "Costos en dólares",
                  "Módulos extras que se suman al precio",
                  "Hardware dedicado, instalación técnica",
                  "Bots y apps intermediarias",
                  "Porcentaje por cada venta",
                  "Soporte genérico LATAM",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06, ease }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(239,68,68,0.03)",
                      border: "1px solid rgba(239,68,68,0.08)",
                    }}
                  >
                    <span
                      style={{
                        color: "#ef4444",
                        flexShrink: 0,
                        display: "flex",
                      }}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                        textDecoration: "line-through",
                        opacity: 0.7,
                      }}
                    >
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LIVE PREVIEW ────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
              className="flex justify-center"
            >
              <div style={{ position: "relative" }}>
                {/* Phone frame */}
                <div
                  style={{
                    width: 280,
                    height: 560,
                    borderRadius: 36,
                    border: "8px solid rgba(0,0,0,0.15)",
                    background: "#0a0a0a",
                    overflow: "hidden",
                    boxShadow:
                      "0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
                    position: "relative",
                  }}
                >
                  {/* Notch */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 90,
                      height: 24,
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "0 0 16px 16px",
                      zIndex: 2,
                    }}
                  />
                  <iframe
                    src="/larryssburgers"
                    title="Menú de Larry's Burgers en vivo"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      pointerEvents: "none",
                    }}
                    loading="lazy"
                  />
                </div>
                {/* Glow */}
                <div
                  style={{
                    position: "absolute",
                    inset: -40,
                    background:
                      "radial-gradient(ellipse at center, rgba(255,107,53,0.15) 0%, transparent 70%)",
                    zIndex: -1,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
            >
              <SectionLabel>Vista en vivo</SectionLabel>
              <h2
                className="text-3xl sm:text-4xl font-bold mb-5"
                style={{ color: "var(--text-primary)", lineHeight: 1.2 }}
              >
                Así se ve tu carta{" "}
                <span style={{ color: "var(--accent)" }}>en el celular</span> de
                tus clientes
              </h2>
              <p
                className="text-base mb-8"
                style={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: 420,
                }}
              >
                Una carta rápida, bonita y fácil de usar. Tus clientes eligen
                sus productos, arman el pedido y te lo mandan directo por
                WhatsApp — sin descargar nada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/larryssburgers"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    background: "var(--accent)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  Ver hamburguesería en funcionamiento →
                </a>
                <a
                  href={WHATSAPP_URL("Hola! Quiero probar Takefyy 🚀")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                    background: "var(--surface-2)",
                  }}
                >
                  Crear la mía gratis
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PANEL ADMIN ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--brand-dark)",
          padding: "100px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "30%",
            transform: "translate(50%, -50%)",
            width: 500,
            height: 500,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="max-w-7xl mx-auto px-5 sm:px-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease }}
            >
              <SectionLabel>PARA EL DUEÑO DEL LOCAL</SectionLabel>
              <h2
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  letterSpacing: "0.01em",
                  color: "#fff",
                  lineHeight: 1.0,
                  marginBottom: 20,
                }}
              >
                Un panel que te dice
                <br />
                cómo va tu negocio.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(240,237,232,0.65)",
                  lineHeight: 1.7,
                  maxWidth: 460,
                  marginBottom: 32,
                }}
              >
                Nada de planillas ni cuadernos. Entrás, ves cuánto vendiste hoy,
                qué se agotó y cuánto tenés que rendir de caja — todo
                actualizado en tiempo real.
              </p>
              <div className="flex flex-col gap-3">
                {adminPanelFeatures.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(255,107,53,0.05)",
                      border: "1px solid rgba(255,107,53,0.1)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: "rgba(240,237,232,0.85)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
              style={{ position: "relative" }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)",
                }}
              >
                <Image
                  src="/admin-panel-dashboard.png"
                  alt="Panel de administración de Takefyy: pedidos en vivo, cierre de caja y ventas de la semana"
                  width={1672}
                  height={940}
                  sizes="(max-width: 1024px) 90vw, 760px"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <div
                className="hidden lg:block"
                style={{
                  position: "absolute",
                  bottom: -28,
                  left: -28,
                  width: "62%",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow:
                    "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.2)",
                }}
              >
                <Image
                  src="/admin-panel-ventas.png"
                  alt="Panel de administración de Takefyy: horas pico y top de productos vendidos"
                  width={1672}
                  height={940}
                  sizes="470px"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CALCULADORA DE AHORRO ───────────────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "100px 0" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="text-center"
            style={{ marginBottom: 44 }}
          >
            <SectionLabel>CALCULÁ TU AHORRO</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.05,
                marginBottom: 16,
              }}
            >
              ¿Cuánto estás perdiendo
              <br />
              en comisiones?
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--text-secondary)",
                maxWidth: 460,
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Las apps de delivery cobran hasta 27% por pedido. Movés el cursor
              y mirá cuánto te quedaría en el bolsillo con Takefyy.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            style={{
              background: "var(--brand-dark)",
              borderRadius: 24,
              padding: "40px clamp(20px, 5vw, 48px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: "-10%",
                top: "-20%",
                width: 360,
                height: 360,
                background:
                  "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <label
                  htmlFor="ventas-delivery"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(240,237,232,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Ventas mensuales por delivery
                </label>
                <span
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: 24,
                    color: "#fff",
                  }}
                >
                  {ventasDelivery.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <input
                id="ventas-delivery"
                type="range"
                min={100000}
                max={4000000}
                step={50000}
                value={ventasDelivery}
                onChange={(e) => setVentasDelivery(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "var(--accent)",
                  height: 6,
                  cursor: "pointer",
                }}
              />

              <div
                className="grid sm:grid-cols-2 gap-4"
                style={{ marginTop: 36 }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: "20px 22px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "rgba(240,237,232,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    Con apps de delivery (27%)
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-anton)",
                      fontSize: 28,
                      color: "#F87171",
                    }}
                  >
                    -
                    {(ventasDelivery * 0.27).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    })}
                    <span
                      style={{ fontSize: 14, color: "rgba(240,237,232,0.4)" }}
                    >
                      {" "}
                      /mes
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(255,107,53,0.08)",
                    border: "1px solid rgba(255,107,53,0.25)",
                    borderRadius: 14,
                    padding: "20px 22px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "rgba(240,237,232,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    Con Takefyy (plan Pro)
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-anton)",
                      fontSize: 28,
                      color: "var(--accent)",
                    }}
                  >
                    -
                    {(17000).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      maximumFractionDigits: 0,
                    })}
                    <span
                      style={{ fontSize: 14, color: "rgba(240,237,232,0.4)" }}
                    >
                      {" "}
                      /mes
                    </span>
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  textAlign: "center",
                  padding: "24px 20px",
                  borderRadius: 14,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.25)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(240,237,232,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 6,
                  }}
                >
                  Lo que te ahorrás por año
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: "clamp(2.2rem, 6vw, 3rem)",
                    color: "#4ADE80",
                  }}
                >
                  {Math.max(
                    0,
                    ventasDelivery * 0.27 * 12 - 17000 * 12,
                  ).toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div style={{ textAlign: "center", marginTop: 28 }}>
                <a
                  href="/signup"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 32px",
                    borderRadius: 99,
                    background: "var(--accent)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                  }}
                >
                  Quiero ese ahorro →
                </a>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(240,237,232,0.35)",
                    marginTop: 12,
                  }}
                >
                  Estimación ilustrativa según comisión promedio de apps de
                  delivery en Argentina. No incluye costos de envío propio.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section
        id="precios"
        style={{ background: "var(--bg)", padding: "100px 0" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SectionLabel>PRECIOS</SectionLabel>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
                textWrap: "balance",
                marginBottom: 16,
              }}
            >
              Tres planes. Sin sorpresas.
            </h2>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 13,
                  color: "#22c55e",
                  fontWeight: 600,
                }}
              >
                <Shield size={13} />
                Todos los planes incluyen 14 días gratis — sin tarjeta de
                crédito
              </span>
            </div>
          </motion.div>

          <PricingToggle
            annual={annual}
            onToggle={() => setAnnual((v) => !v)}
          />

          <div
            className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start"
            style={{ marginTop: 44 }}
          >
            {plans.map((plan, i) => {
              const monthly =
                plan.priceMonthly !== null && annual
                  ? Math.round(plan.priceMonthly * 0.8)
                  : null;
              const displayPrice =
                monthly !== null
                  ? `$${monthly.toLocaleString("es-AR")}`
                  : plan.price;
              const annualNote =
                plan.priceMonthly !== null && annual
                  ? "facturado anualmente"
                  : null;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease }}
                >
                  <TiltCard style={{ height: "100%", position: "relative" }}>
                    {plan.featured && (
                      <div
                        style={{
                          position: "absolute",
                          top: -14,
                          left: "50%",
                          transform: "translateX(-50%) translateZ(10px)",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "5px 16px",
                          borderRadius: 20,
                          background:
                            "linear-gradient(90deg, #ff8c42 0%, #ff6b35 50%, #e85d23 100%)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          letterSpacing: "0.1em",
                          boxShadow:
                            "0 4px 16px rgba(255,107,53,0.5), 0 0 0 2px rgba(255,107,53,0.15)",
                        }}
                      >
                        <Star
                          size={9}
                          fill="currentColor"
                          style={{ marginRight: 4 }}
                        />{" "}
                        MÁS POPULAR
                      </div>
                    )}
                    <div
                      className={
                        plan.featured
                          ? "animate-border-glow plan-featured-card"
                          : ""
                      }
                      style={{
                        background: plan.featured
                          ? "linear-gradient(145deg, #FF6B35 0%, #d94f1e 100%)"
                          : "var(--surface)",
                        border: `1px solid ${plan.featured ? "transparent" : "var(--border)"}`,
                        borderRadius: 22,
                        padding: "32px 28px",
                        position: "relative",
                        overflow: "hidden",
                        transform: plan.featured ? "scale(1.03)" : "scale(1)",
                        height: "100%",
                      }}
                    >
                      {plan.featured && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0.06,
                              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                              backgroundSize: "120px 120px",
                              pointerEvents: "none",
                            }}
                          />
                        </>
                      )}
                      <div
                        className="mb-6"
                        style={{ position: "relative", zIndex: 1 }}
                      >
                        <div
                          className="text-xs font-bold tracking-widest mb-2"
                          style={{
                            color: plan.featured
                              ? "rgba(255,255,255,0.65)"
                              : "var(--accent)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {plan.name.toUpperCase()}
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                          <span
                            style={{
                              fontFamily: "var(--font-anton)",
                              fontSize: "2.8rem",
                              color: plan.featured
                                ? "#fff"
                                : "var(--text-primary)",
                              lineHeight: 1,
                              letterSpacing: "0.01em",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {displayPrice}
                          </span>
                          <span
                            className="text-sm mb-1"
                            style={{
                              color: plan.featured
                                ? "rgba(255,255,255,0.6)"
                                : "var(--text-muted)",
                            }}
                          >
                            {plan.period}
                          </span>
                        </div>
                        {annualNote && (
                          <p
                            style={{
                              fontSize: 11,
                              color: plan.featured
                                ? "rgba(255,255,255,0.55)"
                                : "var(--text-muted)",
                              marginBottom: 4,
                            }}
                          >
                            {annualNote}
                          </p>
                        )}
                        <p
                          className="text-sm"
                          style={{
                            color: plan.featured
                              ? "rgba(255,255,255,0.7)"
                              : "var(--text-secondary)",
                          }}
                        >
                          {plan.desc}
                        </p>
                      </div>
                      <div
                        className="flex flex-col gap-2.5 mb-8"
                        style={{ position: "relative", zIndex: 1 }}
                      >
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-center gap-2.5">
                            <span
                              style={{
                                color: plan.featured
                                  ? "rgba(255,255,255,0.9)"
                                  : "var(--accent)",
                                flexShrink: 0,
                                display: "flex",
                              }}
                            >
                              <Check size={14} strokeWidth={2.5} />
                            </span>
                            <span
                              className="text-sm"
                              style={{
                                color: plan.featured
                                  ? "rgba(255,255,255,0.82)"
                                  : "var(--text-secondary)",
                              }}
                            >
                              {f}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        className="w-full py-3 rounded-xl text-sm font-semibold"
                        style={{
                          position: "relative",
                          zIndex: 1,
                          background: plan.featured
                            ? "rgba(255,255,255,0.16)"
                            : "transparent",
                          color: plan.featured ? "#fff" : "var(--accent)",
                          border: plan.featured
                            ? "1.5px solid rgba(255,255,255,0.28)"
                            : "1.5px solid var(--accent)",
                          cursor: "pointer",
                          transition:
                            "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = plan.featured
                            ? "rgba(255,255,255,0.26)"
                            : "var(--accent)";
                          if (!plan.featured)
                            e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = plan.featured
                            ? "rgba(255,255,255,0.16)"
                            : "transparent";
                          if (!plan.featured)
                            e.currentTarget.style.color = "var(--accent)";
                        }}
                        onClick={() => {
                          trackLandingEvent("cta_click", {
                            label: "plan_cta",
                            section: "precios",
                            plan: plan.name.toLowerCase(),
                          });
                          if (plan.name === "Growth") {
                            window.open(
                              WHATSAPP_URL(
                                "Hola! Me interesa Takefyy para mi negocio 🚀",
                              ),
                              "_blank",
                            );
                          } else {
                            router.push("/signup");
                          }
                        }}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
              marginTop: 28,
            }}
          >
            14 días gratis · Sin tarjeta · Cancelás cuando querés
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section
        id="clientes"
        style={{ background: "var(--brand-cream)", padding: "100px 0" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mb-14"
          >
            <SectionLabel>TESTIMONIOS</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
              }}
            >
              Lo que dicen
              <br />
              nuestros clientes.
            </h2>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card 1 — Larry's Burgers */}
            <motion.div
              className="flex flex-col justify-between gap-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,107,53,0.18)",
                borderRadius: 24,
                padding: "36px 32px",
                position: "relative",
                overflow: "hidden",
                minHeight: 380,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -20,
                  left: 20,
                  fontSize: 120,
                  fontFamily: "Georgia, serif",
                  color: "var(--accent)",
                  opacity: 0.08,
                  lineHeight: 1,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </span>

              {/* Left Side: Testimonial & Improvements */}
              <div className="flex flex-col justify-between gap-6 relative z-10">
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Five stars */}
                    <div className="flex">
                      {"★★★★★".split("").map((s, si) => (
                        <span
                          key={si}
                          style={{ color: "var(--accent)", fontSize: 16 }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <span
                      style={{
                        background: "rgba(255,107,53,0.12)",
                        color: "var(--accent)",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Caso de Éxito
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "#fff",
                      fontStyle: "italic",
                      marginBottom: 20,
                    }}
                  >
                    &ldquo;Fuimos de los primeros en confiar en Takefyy para
                    automatizar nuestras ventas. El resultado fue inmediato:
                    pasamos de anotar pedidos a mano por WhatsApp a recibir todo
                    ya detallado. Cero errores, clientes más felices y más
                    tiempo para tirar las mejores smash burgers.&rdquo;
                  </p>

                  {/* Improvements list */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {[
                      {
                        icon: <Zap size={13} />,
                        text: "Pedidos 100% automatizados por WhatsApp",
                      },
                      {
                        icon: <Target size={13} />,
                        text: "Reducción a cero de errores de envío",
                      },
                      {
                        icon: <TrendingUp size={13} />,
                        text: "Mayor ticket promedio con el carrito",
                      },
                    ].map(({ icon, text }) => (
                      <div
                        key={text}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent)",
                            display: "flex",
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  {/* Restaurant Logo */}
                  <Image
                    src="https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/larryssburgers/logo_url.png?t=1781289992571"
                    alt="Larry's Burgers logo"
                    width={44}
                    height={44}
                    style={{
                      borderRadius: 10,
                      objectFit: "cover",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                    >
                      Larry&apos;s Burgers
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                      Real Smash Burgers · San Rafael, Mendoza
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Menu Sample */}
              <div className="flex flex-col justify-center relative z-10">
                <div
                  style={{
                    background:
                      "linear-gradient(165deg, #1c2029 0%, #14161c 100%)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,107,53,0.22)",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow:
                      "0 24px 48px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,107,53,0.05) inset",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "var(--accent)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      🔥 Muestra del Menú
                    </span>
                    <a
                      href="/larryssburgers"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11,
                        color: "#F5C518",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Ver real ↗
                    </a>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        name: "The Larry",
                        price: "$10.000",
                        desc: "Doble smash, cheddar, salsa Larry",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/9f9897cc-5cf0-4aac-96ba-e76d2ef8a0fa-1781283776830.jpeg",
                        top: true,
                      },
                      {
                        name: "Bacon Larry",
                        price: "$10.500",
                        desc: "Doble smash, cheddar, bacon caramelizado",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/803cf764-89a1-4f4f-8fe2-7d60303f96c6-1781283784115.jpeg",
                        top: false,
                      },
                      {
                        name: "Ultra Chesse",
                        price: "$10.500",
                        desc: "Doble smash, cuádruple cheddar, alioli",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/larrysburguers/384d792a-6a88-4c3b-97b7-7019bf6f743b-1781283780827.jpeg",
                        top: false,
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.name}
                        whileHover={{ scale: 1.03, y: -2 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          background:
                            "linear-gradient(135deg, #21252f 0%, #1b1e26 100%)",
                          padding: 10,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.05)",
                          position: "relative",
                        }}
                      >
                        {item.top && (
                          <span
                            style={{
                              position: "absolute",
                              top: -8,
                              left: 10,
                              background: "var(--accent)",
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 999,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              boxShadow: "0 2px 8px rgba(255,107,53,0.5)",
                            }}
                          >
                            ★ Más pedido
                          </span>
                        )}
                        <Image
                          src={item.img}
                          alt={item.name}
                          width={58}
                          height={58}
                          style={{
                            borderRadius: 12,
                            objectFit: "cover",
                            flexShrink: 0,
                            outline: "2px solid rgba(255,107,53,0.25)",
                            outlineOffset: -2,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#fff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#F5C518",
                                marginLeft: 4,
                              }}
                            >
                              {item.price}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginTop: 2,
                            }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2 — Mano a mano */}
            <motion.div
              className="flex flex-col justify-between gap-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,107,53,0.18)",
                borderRadius: 24,
                padding: "36px 32px",
                position: "relative",
                overflow: "hidden",
                minHeight: 380,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -20,
                  left: 20,
                  fontSize: 120,
                  fontFamily: "Georgia, serif",
                  color: "var(--accent)",
                  opacity: 0.08,
                  lineHeight: 1,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </span>

              {/* Left Side: Testimonial & Improvements */}
              <div className="flex flex-col justify-between gap-6 relative z-10">
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Five stars */}
                    <div className="flex">
                      {"★★★★★".split("").map((s, si) => (
                        <span
                          key={si}
                          style={{ color: "var(--accent)", fontSize: 16 }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <span
                      style={{
                        background: "rgba(255,107,53,0.12)",
                        color: "var(--accent)",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Caso de Éxito
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "#fff",
                      fontStyle: "italic",
                      marginBottom: 20,
                    }}
                  >
                    &ldquo;Takefyy nos cambió la forma de trabajar. Antes nos
                    volvíamos locos atendiendo llamadas y copiando pedidos del
                    chat. Ahora los clientes arman el pedido solos y nos llega
                    todo ordenado para cocinar. El ticket promedio subió un 25%
                    gracias a las sugerencias del carrito.&rdquo;
                  </p>

                  {/* Improvements list */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {[
                      {
                        icon: <Zap size={13} />,
                        text: "Ahorro de más de 2 horas por noche en WhatsApp",
                      },
                      {
                        icon: <TrendingUp size={13} />,
                        text: "Aumento del 25% en el ticket promedio",
                      },
                      {
                        icon: <Utensils size={13} />,
                        text: "Menú digital visual ultra rápido y fluido",
                      },
                    ].map(({ icon, text }) => (
                      <div
                        key={text}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent)",
                            display: "flex",
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  {/* Restaurant Logo */}
                  <Image
                    src="https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/restaurant-logos/manoamano/logo_url.jpg?t=1783045331567"
                    alt="Mano a mano logo"
                    width={44}
                    height={44}
                    style={{
                      borderRadius: 10,
                      objectFit: "cover",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                    }}
                  />
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                    >
                      Mano a mano
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dash-muted)" }}>
                      Mano a mano del mejor sabor 😉🥊🍔
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Menu Sample */}
              <div className="flex flex-col justify-center relative z-10">
                <div
                  style={{
                    background:
                      "linear-gradient(165deg, #1c2029 0%, #14161c 100%)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,107,53,0.22)",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow:
                      "0 24px 48px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,107,53,0.05) inset",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      paddingBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "var(--accent)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      🔥 Muestra del Menú
                    </span>
                    <a
                      href="/manoamano"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11,
                        color: "#F5C518",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      Ver real ↗
                    </a>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        name: "Avocado",
                        price: "$14.000",
                        desc: "Cheddar, medallón 110g, palta, panceta ahumada",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/manoamano/d0d28a8d-6bf7-4b75-8fe5-a4ffadb739de-1783045208106.jpeg",
                        top: true,
                      },
                      {
                        name: "Especial",
                        price: "$13.500",
                        desc: "Cheddar, panceta ahumada, cebolla caramelizada",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/manoamano/d5c40bd8-efac-42da-988b-619f6f20e73b-1783100779096.jpeg",
                        top: false,
                      },
                      {
                        name: "Completa",
                        price: "$13.500",
                        desc: "Cheddar, panceta ahumada, lechuga, tomate, cebolla",
                        img: "https://dzsygeidjfncfhhhrefw.supabase.co/storage/v1/object/public/product-images/manoamano/b171df58-bfaf-46e8-95a8-ab9fcb707664-1783097968547.jpeg",
                        top: false,
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.name}
                        whileHover={{ scale: 1.03, y: -2 }}
                        transition={{ duration: 0.18 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          background:
                            "linear-gradient(135deg, #21252f 0%, #1b1e26 100%)",
                          padding: 10,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.05)",
                          position: "relative",
                        }}
                      >
                        {item.top && (
                          <span
                            style={{
                              position: "absolute",
                              top: -8,
                              left: 10,
                              background: "var(--accent)",
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 999,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              boxShadow: "0 2px 8px rgba(255,107,53,0.5)",
                            }}
                          >
                            ★ Más pedido
                          </span>
                        )}
                        <Image
                          src={item.img}
                          alt={item.name}
                          width={58}
                          height={58}
                          style={{
                            borderRadius: 12,
                            objectFit: "cover",
                            flexShrink: 0,
                            outline: "2px solid rgba(255,107,53,0.25)",
                            outlineOffset: -2,
                            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#fff",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#F5C518",
                                marginLeft: 4,
                              }}
                            >
                              {item.price}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              marginTop: 2,
                            }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ background: "var(--bg)", padding: "100px 0" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-16"
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SectionLabel>FAQ</SectionLabel>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-anton)",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
              }}
            >
              Preguntas frecuentes.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#0E1116",
          padding: "140px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot grid */}
        <div
          className="dot-grid"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            height: 600,
            background:
              "radial-gradient(ellipse, rgba(255,107,53,0.14) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="max-w-3xl mx-auto px-5 sm:px-8 text-center"
          style={{ position: "relative", zIndex: 1 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <SectionLabel>EMPEZÁ HOY</SectionLabel>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.06, ease }}
            className="mb-6"
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: "clamp(3rem, 9vw, 8rem)",
              letterSpacing: "0.01em",
              color: "#fff",
              lineHeight: 0.92,
            }}
          >
            Tu carta, online.
            <br />
            <span className="gradient-text-animate">Hoy.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.14, ease }}
            className="mb-10"
            style={{
              fontSize: 18,
              color: "var(--dash-muted)",
              lineHeight: 1.6,
            }}
          >
            14 días gratis. Sin tarjeta. Cancelás cuando querés.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2, ease }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <motion.button
              onClick={() => {
                trackLandingEvent("cta_click", {
                  label: "empezar_gratis",
                  section: "final_cta",
                });
                window.open(
                  WHATSAPP_URL("Hola! Me interesa Takefyy para mi negocio 🚀"),
                  "_blank",
                );
              }}
              className="rounded-full font-bold text-white"
              style={{
                background: "var(--accent)",
                border: "none",
                cursor: "pointer",
                padding: "18px 52px",
                fontSize: 18,
                WebkitAppearance: "none",
                appearance: "none",
              }}
              whileHover={{
                scale: 1.05,
                filter: "brightness(1.12)",
                boxShadow: "0 10px 40px rgba(255,107,53,0.45)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Empezar gratis →
            </motion.button>
            <Link
              href="/larryssburgers"
              className="rounded-full font-semibold"
              style={{
                border: "1.5px solid rgba(255,255,255,0.18)",
                color: "#fff",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 40px",
                fontSize: 17,
                textDecoration: "none",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              Ver Larry's en acción →
            </Link>
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.32, ease }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {/* Avatar stack */}
            <div style={{ display: "flex" }}>
              {["#FF6B35", "#f59e0b", "#22c55e", "#818cf8"].map((bg, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${bg}cc, ${bg}66)`,
                    border: "2px solid #0E1116",
                    marginLeft: idx === 0 ? 0 : -10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {["L", "R", "S", "M"][idx]}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                {"★★★★★".split("").map((s, si) => (
                  <span
                    key={si}
                    style={{ color: "var(--accent)", fontSize: 12 }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(240,237,232,0.5)",
                  margin: 0,
                }}
              >
                Más de{" "}
                <strong style={{ color: "rgba(240,237,232,0.8)" }}>
                  {restaurantCount > 0 ? restaurantCount : 8}
                </strong>{" "}
                negocios confían en Takefyy
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,107,53,0.35), transparent)",
        }}
      />

      {/* ── FLOATING WHATSAPP CTA ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.5, ease }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 3.2, ease }}
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
            border: "1px solid rgba(255,107,53,0.4)",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#ffffff",
            whiteSpace: "nowrap",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,107,53,0.1)",
            pointerEvents: "auto",
            letterSpacing: "0.01em",
          }}
        >
          🔥 14 días gratis — sin tarjeta
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            trackLandingEvent("cta_click", {
              label: "whatsapp_flotante",
              section: "floating",
            });
            window.open(
              WHATSAPP_URL("Hola! Quiero empezar con Takefyy 🚀"),
              "_blank",
            );
          }}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#25D366",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 8px 24px rgba(37,211,102,0.4), 0 2px 8px rgba(0,0,0,0.2)",
            pointerEvents: "auto",
            color: "#fff",
          }}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={26} fill="currentColor" strokeWidth={0} />
        </motion.button>
      </motion.div>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer
        style={{ background: "var(--brand-dark)", padding: "64px 0 32px" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div>
              <div className="mb-3" style={{ color: "var(--dash-text)" }}>
                <TakefyyLogo size="md" />
              </div>
              <p
                className="text-sm max-w-xs"
                style={{ color: "var(--dash-muted)", lineHeight: 1.6 }}
              >
                Tu carta, online en minutos.
              </p>
              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <a
                  href="https://instagram.com/takefyy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.8)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  Instagram
                </a>
                <a
                  href={WHATSAPP_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.8)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                  }
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-8 md:gap-x-16">
              <div>
                <div
                  className="text-xs font-semibold mb-4"
                  style={{ color: "var(--dash-muted)", letterSpacing: "0.1em" }}
                >
                  PRODUCTO
                </div>
                <div className="flex flex-col gap-3">
                  {navLinks.map((l) => (
                    <button
                      key={l.label}
                      onClick={() => scrollTo(l.id)}
                      className="text-sm text-left"
                      style={{
                        color: "var(--dash-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--dash-text)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--dash-muted)")
                      }
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-semibold mb-4"
                  style={{ color: "var(--dash-muted)", letterSpacing: "0.1em" }}
                >
                  SOLUCIONES
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { href: "/menu-digital", label: "Menú digital" },
                    { href: "/carta-digital", label: "Carta digital" },
                    { href: "/menu-qr", label: "Menú QR" },
                    {
                      href: "/pedidos-whatsapp",
                      label: "Pedidos por WhatsApp",
                    },
                    {
                      href: "/software-restaurantes",
                      label: "Software para restaurantes",
                    },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-sm"
                      style={{
                        color: "var(--dash-muted)",
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-semibold mb-4"
                  style={{ color: "var(--dash-muted)", letterSpacing: "0.1em" }}
                >
                  RUBROS
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { href: "/pizzerias", label: "Pizzerías" },
                    { href: "/hamburgueserias", label: "Hamburgueserías" },
                    { href: "/dark-kitchens", label: "Dark kitchens" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="text-sm"
                      style={{
                        color: "var(--dash-muted)",
                        textDecoration: "none",
                      }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div
                  className="text-xs font-semibold mb-4"
                  style={{ color: "var(--dash-muted)", letterSpacing: "0.1em" }}
                >
                  EMPRESA
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/blog"
                    className="text-sm"
                    style={{
                      color: "var(--dash-muted)",
                      textDecoration: "none",
                    }}
                  >
                    Blog
                  </Link>
                  <a
                    href="https://instagram.com/takefyy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm"
                    style={{
                      color: "var(--dash-muted)",
                      textDecoration: "none",
                    }}
                  >
                    Instagram
                  </a>
                  <a
                    href={WHATSAPP_BASE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm"
                    style={{
                      color: "var(--dash-muted)",
                      textDecoration: "none",
                    }}
                  >
                    Contacto
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              © 2026 Takefyy &middot; Hecho con ❤️ en Argentina
            </p>
            <p style={{ color: "rgba(255,255,255,0.14)", fontSize: 11 }}>
              Takefyy no cobra comisiones por pedido. Todos los pedidos se
              procesan directamente entre el restaurante y el cliente.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
