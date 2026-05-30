"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import TakefyyLogo from "@/components/TakefyyLogo";

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
    <span ref={ref}>
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
    name: "Free",
    price: "Gratis",
    period: "para siempre",
    desc: "Para arrancar y probar sin riesgo",
    features: [
      "Hasta 10 productos",
      "Pedidos por WhatsApp",
      "Panel admin básico",
      "URL propia",
    ],
    cta: "Empezar gratis →",
    featured: false,
  },
  {
    name: "Pro",
    price: "$4.999",
    period: "/mes",
    desc: "Para negocios en crecimiento",
    features: [
      "Hasta 50 productos",
      "Analytics de ventas",
      "Colores y logo personalizados",
      "Soporte prioritario",
      "Sin comisiones",
    ],
    cta: "Empezar gratis →",
    featured: true,
  },
  {
    name: "Premium",
    price: "$9.999",
    period: "/mes",
    desc: "Para locales con alto volumen",
    features: [
      "Productos ilimitados",
      "Todo el plan Pro",
      "Reportes avanzados",
      "Múltiples admins",
      "Soporte directo",
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
    a: "Sí. Cada restaurante tiene su propia paleta de colores, logo e información de contacto. Tu menú va a tener tu identidad.",
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
  { value: 0, suffix: "%", label: "Comisión por pedido" },
  { value: 3, suffix: " min", label: "Para estar online" },
  { value: 0, suffix: " USD", label: "El precio es en ARS" },
  { value: 100, suffix: "%", label: "Directo a tu WhatsApp" },
];

function PhoneMockup() {
  return (
    <div
      style={{
        width: 260,
        height: 480,
        background: "#1A1D24",
        borderRadius: 36,
        border: "2px solid rgba(255,107,53,0.2)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow:
          "0 0 0 8px rgba(255,107,53,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4px",
        }}
      >
        <span style={{ fontSize: 10, color: "#F0EDE8", fontWeight: 600 }}>
          9:41
        </span>
        <div
          style={{
            width: 48,
            height: 6,
            background: "#0E1116",
            borderRadius: 8,
          }}
        />
        <span style={{ fontSize: 10, color: "#F0EDE8" }}>●●●</span>
      </div>
      <div
        style={{
          background: "linear-gradient(135deg, #FF6B35, #e85a28)",
          borderRadius: 14,
          padding: "10px 12px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.95)",
            fontWeight: 700,
          }}
        >
          Riqq&apos;s Burgers
        </div>
        <div
          style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 2 }}
        >
          Abierto · Hacé tu pedido
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {["Burgers", "Bebidas", "Promos"].map((c, i) => (
          <div
            key={c}
            style={{
              fontSize: 9,
              padding: "3px 8px",
              borderRadius: 20,
              background: i === 0 ? "#FF6B35" : "#22262F",
              color: i === 0 ? "#fff" : "#8A8D95",
              fontWeight: 600,
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {[
        { name: "Smash Clásica", price: "$3.500", badge: "Popular" },
        { name: "BBQ Doble", price: "$4.800", badge: null },
        { name: "Chicken Crispy", price: "$3.900", badge: "Nuevo" },
      ].map((p) => (
        <div
          key={p.name}
          style={{
            background: "#22262F",
            borderRadius: 12,
            padding: "9px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: "#F0EDE8", fontWeight: 600 }}>
              {p.name}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#FF6B35",
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {p.price}
            </div>
          </div>
          {p.badge && (
            <div
              style={{
                fontSize: 8,
                padding: "2px 6px",
                borderRadius: 20,
                background: "rgba(255,107,53,0.15)",
                color: "#FF6B35",
                fontWeight: 600,
                border: "1px solid rgba(255,107,53,0.3)",
              }}
            >
              {p.badge}
            </div>
          )}
        </div>
      ))}
      <div
        style={{
          background: "#FF6B35",
          borderRadius: 12,
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          boxShadow: "0 4px 16px rgba(255,107,53,0.4)",
        }}
      >
        <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>
          Ver carrito (2)
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>
          $7.400 →
        </span>
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
  icon: string;
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
      <span style={{ fontSize: 18 }}>{icon}</span>
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

export default function HomeClient({
  restaurantCount,
}: {
  restaurantCount: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  function handleHeroMouseMove(e: React.MouseEvent<HTMLElement>) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = heroRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    });
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
              onClick={() =>
                window.open(
                  "https://wa.me/542994247985?text=" +
                    encodeURIComponent(
                      "Hola! Me interesa Takefyy para mi negocio 🚀",
                    ),
                  "_blank",
                )
              }
              className="px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{
                background: "var(--accent)",
                border: "none",
                cursor: "pointer",
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
                background: "rgba(14,17,22,0.98)",
                backdropFilter: "blur(20px)",
                borderTop: "1px solid rgba(255,107,53,0.1)",
              }}
            >
              <div style={{ padding: "28px 24px 36px" }}>
                {navLinks.map((l, i) => (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.25 }}
                    onClick={() => scrollTo(l.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      fontSize: 28,
                      fontFamily: "var(--font-anton)",
                      color: "var(--dash-text)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 0",
                    }}
                  >
                    {l.label}
                  </motion.button>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.06, duration: 0.25 }}
                >
                  <a
                    href={
                      "https://wa.me/542994247985?text=" +
                      encodeURIComponent(
                        "Hola! Me interesa Takefyy para mi negocio 🚀",
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      marginTop: 32,
                      padding: "16px",
                      background: "var(--accent)",
                      color: "white",
                      borderRadius: 12,
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: 16,
                      textDecoration: "none",
                    }}
                  >
                    Empezar gratis →
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
        style={{
          position: "relative",
          background: "#0E1116",
          overflow: "hidden",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          paddingTop: 64,
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
          }}
        />

        {/* Grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
            pointerEvents: "none",
          }}
        />

        {/* Mouse-tracking glow */}
        <div
          style={{
            position: "absolute",
            left: `calc(${mousePos.x * 100}% - 300px)`,
            top: `calc(${mousePos.y * 100}% - 300px)`,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.09) 0%, transparent 70%)",
            transition: "left 0.6s ease, top 0.6s ease",
            pointerEvents: "none",
            zIndex: 0,
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

        <div
          className="max-w-6xl mx-auto px-5 sm:px-8 w-full py-20 md:py-0"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left col */}
            <div>
              <motion.div {...fadeUp(0)} className="mb-6">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: "rgba(255,107,53,0.1)",
                    border: "1px solid rgba(255,107,53,0.22)",
                    color: "var(--accent)",
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
                  Hecho para hamburgueserías, pizzerías y dark kitchens 🇦🇷
                </span>
              </motion.div>

              {/* Anton headline */}
              <h1
                className="mb-7"
                style={{
                  fontFamily: "var(--font-anton)",
                  fontSize: "clamp(3rem, 8.5vw, 7.5rem)",
                  lineHeight: 0.93,
                  letterSpacing: "0.01em",
                  color: "#fff",
                  fontWeight: 400,
                  margin: "0 0 1.75rem",
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
                className="mb-10"
                style={{
                  fontSize: "clamp(1rem, 2vw, 1.1rem)",
                  lineHeight: 1.75,
                  color: "var(--dash-muted)",
                  maxWidth: 450,
                }}
              >
                Tu menú digital en minutos, pedidos directo a tu WhatsApp. Sin
                comisiones, sin módulos, sin costos en dólares. Todo incluido en
                un precio en pesos.
              </motion.p>

              <motion.div
                {...fadeUp(0.43)}
                className="flex flex-wrap gap-3 mb-12"
              >
                <motion.button
                  onClick={() =>
                    window.open(
                      "https://wa.me/542994247985?text=" +
                        encodeURIComponent(
                          "Hola! Me interesa Takefyy para mi negocio 🚀",
                        ),
                      "_blank",
                    )
                  }
                  className="rounded-full px-7 py-3.5 text-sm font-bold text-white"
                  style={{
                    background: "var(--accent)",
                    border: "none",
                    cursor: "pointer",
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
                </motion.button>
                <motion.a
                  href="/riqqsburgers"
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
                  Ver demo
                </motion.a>
              </motion.div>

              {/* Social proof */}
              <motion.div
                {...fadeUp(0.52)}
                className="flex items-center gap-4 flex-wrap"
              >
                <div className="flex">
                  {["MG", "RP", "SV", "JC"].map((ini, i) => (
                    <div
                      key={ini}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: `hsl(${20 + i * 30}, 65%, 42%)`,
                        border: "2.5px solid #0E1116",
                        marginLeft: i === 0 ? 0 : -9,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {ini}
                    </div>
                  ))}
                </div>
                <div style={{ color: "var(--dash-muted)", fontSize: 13 }}>
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    <AnimatedCounter
                      target={Math.max(restaurantCount, 50)}
                      suffix="+"
                      prefix=""
                    />{" "}
                    restaurantes
                  </span>{" "}
                  ya usan Takefyy
                </div>
              </motion.div>
            </div>

            {/* Right col — phone + floating toasts */}
            <div
              className="hidden md:flex justify-center items-center"
              style={{ position: "relative" }}
            >
              {/* Toasts - desktop only */}
              <FloatToast
                icon="🛒"
                title="Nuevo pedido"
                sub="$4.200 · BBQ Doble x2"
                color="rgba(255,107,53,0.25)"
                delay={0.8}
                style={{ top: "10%", right: -16 }}
              />
              <FloatToast
                icon="✅"
                title="Pedido confirmado"
                sub="Retiro en 20 min"
                color="rgba(34,197,94,0.25)"
                delay={1.2}
                style={{ bottom: "22%", left: -20 }}
              />
              <FloatToast
                icon="⭐"
                title="Nueva reseña"
                sub="Martina · 5 estrellas"
                color="rgba(234,179,8,0.25)"
                delay={1.6}
                style={{ bottom: "5%", right: 0 }}
              />

              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  filter:
                    "drop-shadow(0 40px 80px rgba(255,107,53,0.28)) drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 340,
                    height: 340,
                    background:
                      "radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)",
                    pointerEvents: "none",
                    zIndex: -1,
                  }}
                />
                <PhoneMockup />
              </motion.div>
            </div>
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
                gap: 20,
                padding: "0 24px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {item}
              </span>
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.45)",
                  flexShrink: 0,
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#0E1116",
          padding: "80px 0",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                style={{
                  textAlign: "center",
                  padding: "24px 16px",
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
                <div
                  style={{
                    fontFamily: "var(--font-anton)",
                    fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                    color: "#fff",
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                    marginBottom: 8,
                  }}
                >
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--dash-muted)",
                    letterSpacing: "0.01em",
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
          borderBottom: "1px solid rgba(255,255,255,0.04)",
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
              }}
            >
              Para cada tipo de local gastronómico
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { emoji: "🍔", label: "Hamburguesería" },
              { emoji: "🍕", label: "Pizzería" },
              { emoji: "📦", label: "Dark Kitchen" },
              { emoji: "🍗", label: "Rotisería" },
              { emoji: "🍦", label: "Heladería" },
              { emoji: "🍱", label: "Sushi" },
              { emoji: "🍺", label: "Bar / Restó" },
              { emoji: "🚐", label: "Food Truck" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
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
                <span style={{ fontSize: 32 }}>{item.emoji}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--dash-muted)",
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
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
                padding: 32,
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
                  fontSize: 20,
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
                        fontSize: 15,
                        flexShrink: 0,
                      }}
                    >
                      ✓
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
                href="/riqqsburgers"
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
                Ver demo en vivo: takefyy.com/riqqsburgers →
              </Link>
            </motion.div>
          </div>
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
              }}
            >
              Todo incluido. Un precio. Sin sorpresas.
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
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
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
                      style={{ color: "#22c55e", fontSize: 13, flexShrink: 0 }}
                    >
                      ✓
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
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✕
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
                      style={{ color: "#ef4444", fontSize: 13, flexShrink: 0 }}
                    >
                      ✕
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
              }}
            >
              Un precio. Sin sorpresas.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease }}
              >
                <TiltCard style={{ height: "100%" }}>
                  <div
                    className={plan.featured ? "animate-border-glow" : ""}
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
                        <div
                          style={{
                            position: "absolute",
                            top: -12,
                            left: "50%",
                            transform: "translateX(-50%)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "4px 14px",
                            borderRadius: 20,
                            background: "rgba(0,0,0,0.22)",
                            border: "1px solid rgba(255,255,255,0.22)",
                            whiteSpace: "nowrap",
                            zIndex: 2,
                            letterSpacing: "0.08em",
                          }}
                        >
                          MÁS POPULAR
                        </div>
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
                          }}
                        >
                          {plan.price}
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
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            ✓
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
                        transition: "all 0.15s",
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
                        window.open(
                          "https://wa.me/542994247985?text=" +
                            encodeURIComponent(
                              "Hola! Me interesa Takefyy para mi negocio 🚀",
                            ),
                          "_blank",
                        );
                      }}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
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

          <div className="grid md:grid-cols-5 gap-5">
            {/* Large featured */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              style={{
                background: "var(--brand-dark)",
                border: "1px solid rgba(255,107,53,0.18)",
                borderRadius: 24,
                padding: 40,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 280,
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
              <div>
                <div className="flex mb-5">
                  {"★★★★★".split("").map((s, si) => (
                    <span
                      key={si}
                      style={{ color: "var(--accent)", fontSize: 18 }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 19,
                    lineHeight: 1.7,
                    color: "#fff",
                    fontStyle: "italic",
                    marginBottom: 28,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  &ldquo;{testimonials[0].text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {testimonials[0].initials}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                    {testimonials[0].name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--dash-muted)" }}>
                    {testimonials[0].restaurant}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2 smaller */}
            <div className="md:col-span-2 flex flex-col gap-5">
              {testimonials.slice(1).map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.12, ease }}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    padding: 24,
                    flex: 1,
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.25s ease",
                  }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: -12,
                      left: 16,
                      fontSize: 70,
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
                  <div className="flex mb-3">
                    {"★★★★★".split("").map((s, si) => (
                      <span
                        key={si}
                        style={{ color: "var(--accent)", fontSize: 13 }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p
                    className="text-sm leading-relaxed mb-5"
                    style={{
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t.restaurant}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              onClick={() =>
                window.open(
                  "https://wa.me/542994247985?text=" +
                    encodeURIComponent(
                      "Hola! Me interesa Takefyy para mi negocio 🚀",
                    ),
                  "_blank",
                )
              }
              className="rounded-full font-bold text-white"
              style={{
                background: "var(--accent)",
                border: "none",
                cursor: "pointer",
                padding: "18px 52px",
                fontSize: 18,
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
            <motion.a
              href="/riqqsburgers"
              className="rounded-full font-semibold"
              style={{
                border: "1.5px solid rgba(255,255,255,0.18)",
                color: "#fff",
                background: "transparent",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 40px",
                fontSize: 16,
              }}
              whileHover={{
                background: "rgba(255,255,255,0.07)",
                borderColor: "rgba(255,255,255,0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              Ver demo →
            </motion.a>
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
                  href="https://wa.me/542994247985"
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
                  Contacto
                </a>
              </div>
            </div>
            <div className="flex gap-12">
              <div>
                <div
                  className="text-xs font-semibold mb-4"
                  style={{ color: "var(--dash-muted)", letterSpacing: "0.1em" }}
                >
                  PRODUCTO
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Funcionalidades", id: "producto" },
                    { label: "Precios", id: "precios" },
                    { label: "Clientes", id: "clientes" },
                    { label: "FAQ", id: "faq" },
                  ].map((l) => (
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
                  EMPRESA
                </div>
                <div className="flex flex-col gap-3">
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
                    href="https://wa.me/542994247985"
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
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
              © 2026 Takefyy · Hecho en Argentina 🇦🇷 · Franco Riquero
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
