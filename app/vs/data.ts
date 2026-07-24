import type { Metadata } from "next";
import Link from "next/link";

interface CompetitorData {
  slug: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  tagline: string;
  intro: string;
  takefyyPros: string[];
  competitorPros: string[];
  competitorCons: string[];
  verdict: string;
  tableRows: Array<{
    feature: string;
    takefyy: string | boolean;
    competitor: string | boolean;
  }>;
}

export const competitors: Record<string, CompetitorData> = {
  olaclick: {
    slug: "olaclick",
    name: "OlaClick",
    title: "Takefyy vs OlaClick: ¿Cuál es mejor para tu restaurante?",
    description:
      "Comparativa honesta entre Takefyy y OlaClick para restaurantes argentinos. Precios, funciones, pedidos por WhatsApp y más. ¿Cuál conviene en 2026?",
    keywords: [
      "takefyy vs olaclick",
      "olaclick alternativa argentina",
      "alternativa a olaclick",
      "comparativa menú digital argentina",
      "olaclick precio argentina",
      "mejor menú digital restaurante argentina",
    ],
    tagline: "Alternativa argentina a OlaClick",
    intro:
      "Tanto Takefyy como OlaClick son plataformas de menú digital para restaurantes, pero tienen diferencias importantes en precio, funciones y enfoque. Acá la comparativa honesta.",
    takefyyPros: [
      "Precio en pesos argentinos — sin cotización en dólares",
      "Plan gratuito permanente con funciones completas",
      "Pedidos directo a WhatsApp, sin intermediación",
      "Panel admin en español con soporte local",
      "Sin comisión por pedido",
    ],
    competitorPros: [
      "Presencia en más países de Latinoamérica",
      "Más tiempo en el mercado",
    ],
    competitorCons: [
      "Precio en dólares — impacta fuerte en Argentina",
      "Comisiones por pedido en algunos planes",
      "Soporte no siempre en horario argentino",
    ],
    verdict:
      "Para restaurantes argentinos, Takefyy es la opción más conveniente: precio en pesos, sin comisiones y soporte local. OlaClick puede tener sentido si operás en varios países de Latam simultáneamente.",
    tableRows: [
      {
        feature: "Precio",
        takefyy: "En pesos ARS",
        competitor: "En dólares USD",
      },
      { feature: "Plan gratuito", takefyy: true, competitor: false },
      { feature: "Pedidos por WhatsApp", takefyy: true, competitor: true },
      { feature: "Comisión por pedido", takefyy: false, competitor: true },
      { feature: "Panel en español", takefyy: true, competitor: true },
      { feature: "Soporte local Argentina", takefyy: true, competitor: false },
      { feature: "Menú QR", takefyy: true, competitor: true },
      { feature: "Customización de colores", takefyy: true, competitor: true },
    ],
  },
  pedix: {
    slug: "pedix",
    name: "Pedix",
    title: "Takefyy vs Pedix: comparativa para restaurantes argentinos",
    description:
      "Comparativa entre Takefyy y Pedix. Precio, funciones, comisiones y soporte. ¿Cuál es la mejor plataforma de menú digital para tu restaurante en Argentina?",
    keywords: [
      "takefyy vs pedix",
      "pedix alternativa",
      "alternativa a pedix argentina",
      "pedix precio",
      "comparativa pedix takefyy",
      "mejor alternativa pedix restaurante",
    ],
    tagline: "Alternativa a Pedix para restaurantes",
    intro:
      "Pedix y Takefyy compiten en el mismo espacio: menú digital y pedidos online para gastronomía. Esta comparativa te ayuda a decidir cuál se adapta mejor a tu negocio.",
    takefyyPros: [
      "Precio fijo en pesos, sin variación por tipo de cambio",
      "Sin comisiones por pedido",
      "Plan gratuito con todas las funciones básicas",
      "Pedidos directo a WhatsApp sin aplicaciones intermedias",
      "Setup en minutos, sin técnicos",
    ],
    competitorPros: [
      "Funcionalidades avanzadas para locales grandes",
      "Integraciones con sistemas de caja",
    ],
    competitorCons: [
      "Precio más elevado para PyMEs gastronómicas",
      "Mayor complejidad de configuración",
      "Curva de aprendizaje más alta",
    ],
    verdict:
      "Si tenés un restaurante pequeño o mediano, Takefyy te da todo lo que necesitás a menor costo y sin complicaciones. Pedix puede ser útil si necesitás integraciones avanzadas con sistemas de punto de venta.",
    tableRows: [
      {
        feature: "Precio mensual",
        takefyy: "Desde $0 ARS",
        competitor: "Varía según plan",
      },
      { feature: "Plan gratuito", takefyy: true, competitor: false },
      { feature: "Pedidos por WhatsApp", takefyy: true, competitor: true },
      { feature: "Comisión por pedido", takefyy: false, competitor: false },
      { feature: "Configuración simple", takefyy: true, competitor: false },
      { feature: "Soporte local Argentina", takefyy: true, competitor: true },
      { feature: "Menú QR", takefyy: true, competitor: true },
      { feature: "Integración con POS", takefyy: false, competitor: true },
    ],
  },
  fudo: {
    slug: "fudo",
    name: "Fudo",
    title: "Takefyy vs Fudo: ¿cuál conviene para tu restaurante?",
    description:
      "Comparativa entre Takefyy y Fudo. Descubrí cuál plataforma se adapta mejor a tu restaurante argentino: precio, funciones, pedidos y comisiones.",
    keywords: [
      "takefyy vs fudo",
      "fudo alternativa restaurante",
      "alternativa a fudo argentina",
      "fudo precio mensual",
      "comparativa fudo takefyy",
      "mejor que fudo restaurante argentina",
    ],
    tagline: "Alternativa simple a Fudo",
    intro:
      "Fudo es una plataforma robusta orientada a restaurantes que necesitan gestión integral. Takefyy apunta a negocios que priorizan simplicidad, velocidad y precio. Esta es la diferencia en detalle.",
    takefyyPros: [
      "Más simple y rápido de implementar",
      "Precio accesible para cualquier tamaño de negocio",
      "Sin comisiones por pedido",
      "Pedidos directo a WhatsApp — sin apps intermediarias",
      "Gratis para empezar",
    ],
    competitorPros: [
      "Gestión integral: cocina, mesas, caja y delivery",
      "POS integrado para salón",
      "Más funciones para grandes cadenas",
    ],
    competitorCons: [
      "Precio más alto — no rentable para locales pequeños",
      "Exceso de funciones para quien solo necesita un menú digital",
      "Mayor tiempo de implementación",
    ],
    verdict:
      "Si solo necesitás un menú digital con pedidos por WhatsApp, Takefyy es la mejor opción: más simple, más barato y sin complicaciones. Si tenés un restaurante con múltiples sucursales y necesitás gestión integral de salón y cocina, Fudo puede ser una opción complementaria.",
    tableRows: [
      {
        feature: "Precio",
        takefyy: "Desde $0 ARS",
        competitor: "Precio más alto",
      },
      { feature: "Plan gratuito", takefyy: true, competitor: false },
      { feature: "Pedidos por WhatsApp", takefyy: true, competitor: false },
      { feature: "Comisión por pedido", takefyy: false, competitor: false },
      { feature: "POS / gestión de mesas", takefyy: false, competitor: true },
      { feature: "Menú QR", takefyy: true, competitor: true },
      { feature: "Setup rápido (< 1 hora)", takefyy: true, competitor: false },
      { feature: "Ideal para PyMEs", takefyy: true, competitor: false },
    ],
  },
  wabox: {
    slug: "wabox",
    name: "Wabox",
    title: "Takefyy vs Wabox: ¿cuál es mejor para vender por WhatsApp?",
    description:
      "Comparativa entre Takefyy y Wabox para restaurantes argentinos. Precio, catálogo digital, pedidos por WhatsApp y comisiones. ¿Cuál conviene en 2026?",
    keywords: [
      "takefyy vs wabox",
      "wabox alternativa argentina",
      "alternativa a wabox",
      "wabox opiniones",
      "wabox precio argentina",
      "comparativa wabox takefyy",
    ],
    tagline: "Alternativa argentina a Wabox",
    intro:
      "Wabox y Takefyy apuntan a lo mismo: automatizar ventas por WhatsApp con un catálogo digital. La diferencia está en el enfoque — acá la comparativa honesta para que elijas con datos.",
    takefyyPros: [
      "Menú digital pensado específicamente para gastronomía, con categorías y badges de producto",
      "Precio fijo en pesos, sin sorpresas",
      "Plan gratuito permanente con funciones completas",
      "Panel admin con ventas, caja y productos más vendidos",
      "Sin comisión por pedido",
    ],
    competitorPros: [
      "Enfocado en automatización de mensajes y respuestas por WhatsApp",
      "Sirve para rubros más allá de gastronomía",
    ],
    competitorCons: [
      "No está especializado en menús de restaurante (categorías, fotos de platos, badges)",
      "Menos pensado para el flujo de pedido de un local gastronómico",
      "Panel administrativo más genérico",
    ],
    verdict:
      "Si tenés un restaurante, hamburguesería o pizzería y necesitás un menú digital con pedidos por WhatsApp, Takefyy está construido específicamente para ese caso de uso. Wabox puede convenir si buscás automatizar WhatsApp para otro tipo de negocio.",
    tableRows: [
      {
        feature: "Precio",
        takefyy: "En pesos ARS",
        competitor: "Varía según plan",
      },
      { feature: "Plan gratuito", takefyy: true, competitor: false },
      { feature: "Pedidos por WhatsApp", takefyy: true, competitor: true },
      { feature: "Comisión por pedido", takefyy: false, competitor: false },
      {
        feature: "Especializado en gastronomía",
        takefyy: true,
        competitor: false,
      },
      { feature: "Panel de ventas y caja", takefyy: true, competitor: false },
      { feature: "Menú QR", takefyy: true, competitor: false },
      { feature: "Soporte local Argentina", takefyy: true, competitor: true },
    ],
  },
  todomenu: {
    slug: "todomenu",
    name: "Todomenu",
    title: "Takefyy vs Todomenu: comparativa de menú digital con QR",
    description:
      "Comparativa entre Takefyy y Todomenu para restaurantes argentinos. Precio, funciones del menú QR, pedidos por WhatsApp y soporte. ¿Cuál conviene en 2026?",
    keywords: [
      "takefyy vs todomenu",
      "todomenu alternativa argentina",
      "alternativa a todomenu",
      "todomenu opiniones",
      "todomenu precio argentina",
      "comparativa todomenu takefyy",
    ],
    tagline: "Alternativa argentina a Todomenu",
    intro:
      "Todomenu y Takefyy compiten en menús digitales con código QR para restaurantes argentinos. La diferencia clave está en pedidos por WhatsApp y precio. Esta es la comparativa honesta.",
    takefyyPros: [
      "Pedidos directo a WhatsApp, sin apps ni pasos extra para el cliente",
      "Precio fijo en pesos, sin comisiones por pedido",
      "Plan gratuito permanente con funciones completas",
      "Panel admin con estadísticas de ventas en tiempo real",
      "Setup en minutos, sin técnicos",
    ],
    competitorPros: [
      "Enfoque simple en menú QR estático",
      "Tiempo en el mercado argentino",
    ],
    competitorCons: [
      "Flujo de pedido menos directo — no siempre termina en WhatsApp",
      "Menos funciones de gestión (caja, ventas, productos más vendidos)",
      "Personalización más limitada",
    ],
    verdict:
      "Si además de mostrar tu carta con QR necesitás que los pedidos te lleguen directo al WhatsApp del local y un panel para llevar tus ventas, Takefyy te da todo eso en el plan gratuito. Todomenu puede alcanzar si solo buscás un menú QR estático.",
    tableRows: [
      {
        feature: "Precio",
        takefyy: "Desde $0 ARS",
        competitor: "Varía según plan",
      },
      { feature: "Plan gratuito", takefyy: true, competitor: true },
      { feature: "Pedidos por WhatsApp", takefyy: true, competitor: false },
      { feature: "Comisión por pedido", takefyy: false, competitor: false },
      { feature: "Menú QR", takefyy: true, competitor: true },
      { feature: "Panel de ventas y caja", takefyy: true, competitor: false },
      { feature: "Soporte local Argentina", takefyy: true, competitor: true },
      { feature: "Setup rápido (< 1 hora)", takefyy: true, competitor: true },
    ],
  },
};
