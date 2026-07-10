import Link from "next/link";

const ALL_LINKS = [
  { href: "/menu-digital", label: "Menú digital" },
  { href: "/carta-digital", label: "Carta digital" },
  { href: "/menu-qr", label: "Menú QR" },
  { href: "/pedidos-whatsapp", label: "Pedidos por WhatsApp" },
  { href: "/software-restaurantes", label: "Software para restaurantes" },
  { href: "/pizzerias", label: "Pizzerías" },
  { href: "/hamburgueserias", label: "Hamburgueserías" },
  { href: "/dark-kitchens", label: "Dark kitchens" },
];

/** Franja de links internos, se muestra en cada landing SEO excluyendo la página actual. */
export default function RelatedLinks({ exclude }: { exclude: string }) {
  const links = ALL_LINKS.filter((l) => l.href !== exclude);

  return (
    <div
      style={{
        background: "#0E1116",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px 24px",
        }}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
