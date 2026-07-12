"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  Tag,
  Truck,
  Clock,
  ChevronLeft,
  Percent,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { TenantPreview } from "@/lib/tenants";
import { computeEffectiveOpen } from "@/lib/businessHours";

const TAG_LABELS: Record<string, string> = {
  pizzeria: "🍕 Pizzería",
  hamburgueseria: "🍔 Hamburguesería",
  heladeria: "🍦 Heladería",
  cafeteria: "☕ Cafetería",
  "dark-kitchen": "🏭 Dark Kitchen",
  sushi: "🍣 Sushi",
  parrilla: "🥩 Parrilla",
  empanadas: "🥟 Empanadas",
  pastas: "🍝 Pastas",
  saludable: "🥗 Saludable",
  rotiseria: "🍗 Rotisería",
  delivery: "🛵 Delivery",
  takeaway: "📦 Takeaway",
  bar: "🍺 Bar",
  bakery: "🥐 Panadería",
};

function getTenantIsOpen(t: TenantPreview): boolean {
  return computeEffectiveOpen(t.is_open, t.business_hours);
}

export default function ExploreClient({
  tenants,
}: {
  tenants: TenantPreview[];
}) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean | null>(null); // null = all
  const [filterDelivery, setFilterDelivery] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);

  // Collect all unique tags from tenants
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tenants.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tenants]);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matches =
          t.name.toLowerCase().includes(q) ||
          (t.tagline?.toLowerCase().includes(q) ?? false) ||
          (t.address?.toLowerCase().includes(q) ?? false) ||
          t.tags.some((tag) => tag.includes(q));
        if (!matches) return false;
      }

      // Tags
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => t.tags.includes(tag))
      ) {
        return false;
      }

      // Open filter
      if (filterOpen === true && !getTenantIsOpen(t)) return false;
      if (filterOpen === false && getTenantIsOpen(t)) return false;

      // Delivery filter
      if (filterDelivery && t.delivery_mode === "none") return false;

      // Offers filter
      if (filterOffers && t.activeCoupons === 0) return false;

      return true;
    });
  }, [tenants, search, selectedTags, filterOpen, filterDelivery, filterOffers]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const activeFilterCount =
    selectedTags.length +
    (filterOpen !== null ? 1 : 0) +
    (filterDelivery ? 1 : 0) +
    (filterOffers ? 1 : 0);

  return (
    <div className="explore-page">
      {/* Ambient background */}
      <div className="explore-bg" />

      {/* Header */}
      <header className="explore-header">
        <div className="explore-header-inner">
          <Link href="/" className="explore-back" aria-label="Volver a Takefyy">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="explore-title">Explorá negocios</h1>
            <p className="explore-subtitle">
              {tenants.length} negocio{tenants.length !== 1 ? "s" : ""} en
              Takefyy
            </p>
          </div>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="explore-controls">
        <div className="explore-search-wrap">
          <Search className="explore-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscá por nombre, tipo o ubicación..."
            className="explore-search"
            id="explore-search"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="explore-search-clear"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <div className="explore-filters">
          <button
            className={`explore-filter-chip ${filterOpen === true ? "active" : ""}`}
            onClick={() => setFilterOpen(filterOpen === true ? null : true)}
          >
            <Clock className="w-3.5 h-3.5" />
            Abierto ahora
          </button>
          <button
            className={`explore-filter-chip ${filterDelivery ? "active" : ""}`}
            onClick={() => setFilterDelivery(!filterDelivery)}
          >
            <Truck className="w-3.5 h-3.5" />
            Con delivery
          </button>
          <button
            className={`explore-filter-chip ${filterOffers ? "active" : ""}`}
            onClick={() => setFilterOffers(!filterOffers)}
          >
            <Percent className="w-3.5 h-3.5" />
            Con ofertas
          </button>
          {activeFilterCount > 0 && (
            <button
              className="explore-filter-clear"
              onClick={() => {
                setSelectedTags([]);
                setFilterOpen(null);
                setFilterDelivery(false);
                setFilterOffers(false);
              }}
            >
              Limpiar filtros ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="explore-tags">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`explore-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="explore-results">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="explore-empty"
            >
              <UtensilsCrossed className="w-12 h-12 opacity-30" />
              <p>No encontramos negocios con esos filtros.</p>
              <button
                className="explore-filter-clear"
                onClick={() => {
                  setSearch("");
                  setSelectedTags([]);
                  setFilterOpen(null);
                  setFilterDelivery(false);
                  setFilterOffers(false);
                }}
              >
                Limpiar filtros
              </button>
            </motion.div>
          ) : (
            <div className="explore-grid">
              {filtered.map((t, i) => (
                <TenantCard key={t.id} tenant={t} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .explore-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e5e5e5;
          position: relative;
          overflow-x: hidden;
        }
        .explore-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(
              ellipse 80% 60% at 50% -20%,
              rgba(255, 107, 53, 0.08),
              transparent 70%
            ),
            radial-gradient(
              ellipse 60% 40% at 80% 100%,
              rgba(255, 107, 53, 0.04),
              transparent 60%
            );
          pointer-events: none;
          z-index: 0;
        }
        .explore-header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          background: rgba(10, 10, 10, 0.75);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .explore-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .explore-back {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a3a3a3;
          transition: all 0.2s;
          cursor: pointer;
          flex-shrink: 0;
          text-decoration: none;
        }
        .explore-back:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .explore-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          line-height: 1.2;
        }
        .explore-subtitle {
          font-size: 13px;
          color: #737373;
          margin: 2px 0 0 0;
        }

        /* Search & Filters */
        .explore-controls {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 20px 0;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .explore-search-wrap {
          position: relative;
        }
        .explore-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #525252;
          pointer-events: none;
        }
        .explore-search {
          width: 100%;
          padding: 14px 44px 14px 48px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          color: #e5e5e5;
          font-size: 15px;
          font-family: var(--font-sans), sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .explore-search::placeholder {
          color: #525252;
        }
        .explore-search:focus {
          border-color: rgba(255, 107, 53, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.08);
        }
        .explore-search-clear {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a3a3a3;
          cursor: pointer;
          transition: all 0.15s;
        }
        .explore-search-clear:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .explore-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .explore-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-sans), sans-serif;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: #a3a3a3;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .explore-filter-chip:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
          color: #e5e5e5;
        }
        .explore-filter-chip.active {
          background: rgba(255, 107, 53, 0.12);
          border-color: rgba(255, 107, 53, 0.3);
          color: #ff6b35;
        }
        .explore-filter-clear {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-sans), sans-serif;
          border-radius: 999px;
          border: none;
          background: none;
          color: #ff6b35;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .explore-filter-clear:hover {
          opacity: 0.8;
        }

        .explore-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .explore-tag {
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-sans), sans-serif;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          color: #737373;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .explore-tag:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #a3a3a3;
        }
        .explore-tag.active {
          background: rgba(255, 107, 53, 0.1);
          border-color: rgba(255, 107, 53, 0.25);
          color: #ff6b35;
        }

        /* Results */
        .explore-results {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          position: relative;
          z-index: 10;
        }
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .explore-empty {
          text-align: center;
          padding: 80px 20px;
          color: #525252;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .explore-empty p {
          font-size: 15px;
        }

        /* Card */
        .tenant-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
          position: relative;
        }
        .tenant-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 40px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 107, 53, 0.06);
          transform: translateY(-2px);
        }
        .tenant-card-banner {
          height: 120px;
          position: relative;
          overflow: hidden;
        }
        .tenant-card-banner-bg {
          position: absolute;
          inset: 0;
          object-fit: cover;
        }
        .tenant-card-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 40%,
            rgba(10, 10, 10, 0.9)
          );
        }
        .tenant-card-badges {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 6px;
          z-index: 2;
        }
        .tenant-badge {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .tenant-badge-open {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .tenant-badge-closed {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .tenant-badge-offers {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          border: 1px solid rgba(255, 107, 53, 0.3);
        }
        .tenant-card-body {
          padding: 16px 18px 18px;
          display: flex;
          gap: 14px;
        }
        .tenant-card-logo {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -32px;
          position: relative;
          z-index: 2;
        }
        .tenant-card-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .tenant-card-logo-fallback {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          font-family: var(--font-syne), sans-serif;
        }
        .tenant-card-info {
          flex: 1;
          min-width: 0;
        }
        .tenant-card-name {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tenant-card-tagline {
          font-size: 13px;
          color: #737373;
          margin: 3px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tenant-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
          font-size: 12px;
          color: #525252;
        }
        .tenant-card-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tenant-card-rating {
          color: #facc15;
        }
        .tenant-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 0 18px 16px;
        }
        .tenant-card-tag {
          padding: 3px 8px;
          font-size: 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: #737373;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        @media (max-width: 700px) {
          .explore-grid {
            grid-template-columns: 1fr;
          }
          .explore-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}

function TenantCard({
  tenant: t,
  index,
}: {
  tenant: TenantPreview;
  index: number;
}) {
  const isOpen = getTenantIsOpen(t);
  const hasDelivery = t.delivery_mode !== "none";
  const bannerColor = t.primary_color || "#ff6b35";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Link href={`/${t.slug}`} className="tenant-card">
        {/* Banner */}
        <div className="tenant-card-banner">
          {t.banner_url ? (
            <Image
              src={t.banner_url}
              alt={`Banner de ${t.name}`}
              fill
              className="tenant-card-banner-bg"
              sizes="(max-width: 700px) 100vw, 400px"
            />
          ) : (
            <div
              className="tenant-card-banner-bg"
              style={{
                background: `linear-gradient(135deg, ${bannerColor}22, ${bannerColor}08)`,
              }}
            />
          )}
          <div className="tenant-card-banner-overlay" />

          {/* Badges */}
          <div className="tenant-card-badges">
            <span
              className={`tenant-badge ${isOpen ? "tenant-badge-open" : "tenant-badge-closed"}`}
            >
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
            {t.activeCoupons > 0 && (
              <span className="tenant-badge tenant-badge-offers">
                <Percent className="w-3 h-3 inline mr-1" />
                {t.activeCoupons} oferta{t.activeCoupons !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="tenant-card-body">
          <div className="tenant-card-logo">
            {t.logo_url ? (
              <Image src={t.logo_url} alt={t.name} fill sizes="52px" />
            ) : (
              <span
                className="tenant-card-logo-fallback"
                style={{ color: bannerColor }}
              >
                {t.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="tenant-card-info">
            <h2 className="tenant-card-name">{t.name}</h2>
            {t.tagline && <p className="tenant-card-tagline">{t.tagline}</p>}
            <div className="tenant-card-meta">
              {t.rating && (
                <span className="tenant-card-meta-item tenant-card-rating">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {t.rating.avg.toFixed(1)} ({t.rating.count})
                </span>
              )}
              {t.address && (
                <span className="tenant-card-meta-item">
                  <MapPin className="w-3.5 h-3.5" />
                  {t.address.length > 30
                    ? t.address.slice(0, 30) + "…"
                    : t.address}
                </span>
              )}
              {hasDelivery && (
                <span className="tenant-card-meta-item">
                  <Truck className="w-3.5 h-3.5" />
                  Delivery
                </span>
              )}
              <span className="tenant-card-meta-item">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {t.productCount} producto{t.productCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {t.tags.length > 0 && (
          <div className="tenant-card-tags">
            {t.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tenant-card-tag">
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
