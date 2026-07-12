"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Percent,
  Tag,
  ArrowRight,
  Copy,
  Check,
  Ticket,
} from "lucide-react";
import type { PublicOffer } from "@/lib/coupons";

function fmtDiscount(offer: PublicOffer): string {
  return offer.discount_type === "percent"
    ? `${offer.discount_value}% OFF`
    : `$${offer.discount_value.toLocaleString("es-AR")} OFF`;
}

function fmtMinOrder(amount: number | null): string | null {
  if (!amount) return null;
  return `Pedido mín. $${amount.toLocaleString("es-AR")}`;
}

type FilterType = "all" | "percent" | "fixed";

export default function OffersClient({ offers }: { offers: PublicOffer[] }) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return offers;
    return offers.filter((o) => o.discount_type === filter);
  }, [offers, filter]);

  // Group by business
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { business: PublicOffer["business"]; offers: PublicOffer[] }
    >();
    for (const o of filtered) {
      const key = o.business.slug;
      if (!map.has(key)) {
        map.set(key, { business: o.business, offers: [] });
      }
      map.get(key)!.offers.push(o);
    }
    return Array.from(map.values());
  }, [filtered]);

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="offers-page">
      <div className="offers-bg" />

      {/* Header */}
      <header className="offers-header">
        <div className="offers-header-inner">
          <Link href="/" className="offers-back" aria-label="Volver a Takefyy">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="offers-title">Ofertas y descuentos</h1>
            <p className="offers-subtitle">
              {offers.length} oferta{offers.length !== 1 ? "s" : ""} activa
              {offers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="offers-controls">
        <div className="offers-filters">
          {(
            [
              ["all", "Todas"],
              ["percent", "% Descuento"],
              ["fixed", "$ Monto fijo"],
            ] as [FilterType, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={`offers-filter-chip ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="offers-content">
        <AnimatePresence mode="popLayout">
          {grouped.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="offers-empty"
            >
              <Ticket className="w-12 h-12 opacity-30" />
              <p>No hay ofertas activas en este momento.</p>
              <Link href="/explorar" className="offers-explore-link">
                Explorá negocios <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="offers-groups">
              {grouped.map((group, gi) => (
                <motion.div
                  key={group.business.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(gi * 0.08, 0.4) }}
                  className="offers-group"
                >
                  {/* Business header */}
                  <div className="offers-group-header">
                    <div className="offers-group-logo">
                      {group.business.logo_url ? (
                        <Image
                          src={group.business.logo_url}
                          alt={group.business.name}
                          fill
                          sizes="44px"
                        />
                      ) : (
                        <span
                          className="offers-group-logo-fallback"
                          style={{
                            color: group.business.primary_color || "#ff6b35",
                          }}
                        >
                          {group.business.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="offers-group-info">
                      <h2 className="offers-group-name">
                        {group.business.name}
                      </h2>
                      <p className="offers-group-count">
                        {group.offers.length} oferta
                        {group.offers.length !== 1 ? "s" : ""} disponible
                        {group.offers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/${group.business.slug}`}
                      className="offers-group-cta"
                    >
                      Ver menú <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Offer cards */}
                  <div className="offers-cards">
                    {group.offers.map((o, oi) => (
                      <motion.div
                        key={o.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: Math.min(gi * 0.08 + oi * 0.04, 0.5),
                        }}
                        className="offer-card"
                      >
                        <div className="offer-card-left">
                          <div
                            className="offer-card-discount"
                            style={{
                              background: `linear-gradient(135deg, ${group.business.primary_color || "#ff6b35"}, ${group.business.primary_color || "#ff6b35"}aa)`,
                            }}
                          >
                            <Percent className="w-4 h-4" />
                            <span>{fmtDiscount(o)}</span>
                          </div>
                        </div>
                        <div className="offer-card-center">
                          <div className="offer-card-code-wrap">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="offer-card-code">{o.code}</span>
                            <button
                              className="offer-card-copy"
                              onClick={(e) => {
                                e.preventDefault();
                                copyCode(o.id, o.code);
                              }}
                              aria-label={`Copiar código ${o.code}`}
                            >
                              {copiedId === o.id ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {fmtMinOrder(o.min_order_amount) && (
                            <p className="offer-card-condition">
                              {fmtMinOrder(o.min_order_amount)}
                            </p>
                          )}
                          {o.expires_at && (
                            <p className="offer-card-condition">
                              Vence{" "}
                              {new Date(o.expires_at).toLocaleDateString(
                                "es-AR",
                              )}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/${group.business.slug}`}
                          className="offer-card-use"
                        >
                          Usar
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .offers-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e5e5e5;
          position: relative;
        }
        .offers-bg {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(
              ellipse 80% 50% at 20% -10%,
              rgba(255, 107, 53, 0.06),
              transparent 60%
            ),
            radial-gradient(
              ellipse 60% 40% at 90% 100%,
              rgba(250, 204, 21, 0.04),
              transparent 60%
            );
          pointer-events: none;
        }
        .offers-header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          background: rgba(10, 10, 10, 0.75);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .offers-header-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .offers-back {
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
        .offers-back:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .offers-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          line-height: 1.2;
        }
        .offers-subtitle {
          font-size: 13px;
          color: #737373;
          margin: 2px 0 0 0;
        }

        .offers-controls {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 20px 0;
          position: relative;
          z-index: 10;
        }
        .offers-filters {
          display: flex;
          gap: 8px;
        }
        .offers-filter-chip {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-sans), sans-serif;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: #a3a3a3;
          cursor: pointer;
          transition: all 0.2s;
        }
        .offers-filter-chip:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #e5e5e5;
        }
        .offers-filter-chip.active {
          background: rgba(255, 107, 53, 0.12);
          border-color: rgba(255, 107, 53, 0.3);
          color: #ff6b35;
        }

        .offers-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 20px 60px;
          position: relative;
          z-index: 10;
        }
        .offers-empty {
          text-align: center;
          padding: 80px 20px;
          color: #525252;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .offers-empty p {
          font-size: 15px;
        }
        .offers-explore-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #ff6b35;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: opacity 0.15s;
        }
        .offers-explore-link:hover {
          opacity: 0.8;
        }

        .offers-groups {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .offers-group {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }
        .offers-group-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .offers-group-logo {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .offers-group-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .offers-group-logo-fallback {
          font-size: 18px;
          font-weight: 800;
          font-family: var(--font-syne), sans-serif;
        }
        .offers-group-info {
          flex: 1;
          min-width: 0;
        }
        .offers-group-name {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .offers-group-count {
          font-size: 12px;
          color: #737373;
          margin: 2px 0 0 0;
        }
        .offers-group-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #ff6b35;
          text-decoration: none;
          border-radius: 999px;
          border: 1px solid rgba(255, 107, 53, 0.2);
          background: rgba(255, 107, 53, 0.06);
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .offers-group-cta:hover {
          background: rgba(255, 107, 53, 0.12);
          border-color: rgba(255, 107, 53, 0.35);
        }

        .offers-cards {
          padding: 12px 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .offer-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s;
        }
        .offer-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .offer-card-left {
          flex-shrink: 0;
        }
        .offer-card-discount {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }
        .offer-card-center {
          flex: 1;
          min-width: 0;
        }
        .offer-card-code-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #e5e5e5;
          font-size: 14px;
        }
        .offer-card-code {
          font-family: monospace;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .offer-card-copy {
          background: rgba(255, 255, 255, 0.06);
          border: none;
          border-radius: 6px;
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #737373;
          cursor: pointer;
          transition: all 0.15s;
        }
        .offer-card-copy:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #e5e5e5;
        }
        .offer-card-condition {
          font-size: 12px;
          color: #525252;
          margin: 4px 0 0 0;
        }
        .offer-card-use {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          border-radius: 10px;
          background: #ff6b35;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .offer-card-use:hover {
          background: #e55a25;
          transform: translateX(2px);
        }

        @media (max-width: 600px) {
          .offer-card {
            flex-wrap: wrap;
          }
          .offer-card-use {
            width: 100%;
            justify-content: center;
          }
          .offers-group-cta {
            display: none;
          }
          .offers-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
