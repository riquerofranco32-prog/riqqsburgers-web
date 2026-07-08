"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Truck,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import type { Restaurant } from "@/lib/getRestaurant";

interface BusinessProfileSectionProps {
  restaurant: Restaurant;
}

export function BusinessProfileSection({
  restaurant,
}: BusinessProfileSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const hasRating = restaurant.rating && restaurant.rating.count > 0;
  const hasDelivery = restaurant.delivery_mode !== "none";
  const isPremium =
    (restaurant as { plan?: string }).plan === "pro" ||
    (restaurant as { plan?: string }).plan === "growth";

  return (
    <div className="biz-profile">
      {/* Quick info row — always visible */}
      <div className="biz-profile-quick">
        {hasRating && (
          <div className="biz-profile-chip biz-profile-rating">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{restaurant.rating!.avg.toFixed(1)}</span>
            <span className="biz-profile-muted">
              ({restaurant.rating!.count})
            </span>
          </div>
        )}
        {restaurant.address && (
          <div className="biz-profile-chip">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {restaurant.address.length > 25
                ? restaurant.address.slice(0, 25) + "…"
                : restaurant.address}
            </span>
          </div>
        )}
        {hasDelivery && (
          <div className="biz-profile-chip">
            <Truck className="w-3.5 h-3.5" />
            Delivery
          </div>
        )}
        {restaurant.prep_time_minutes && (
          <div className="biz-profile-chip">
            <Clock className="w-3.5 h-3.5" />
            ~{restaurant.prep_time_minutes} min
          </div>
        )}
        <button
          className="biz-profile-toggle"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Ocultar detalles" : "Ver más detalles"}
          aria-expanded={expanded}
        >
          {expanded ? "Menos" : "Más info"}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="biz-profile-expanded">
              {/* Rating stars */}
              {hasRating && (
                <div className="biz-profile-detail">
                  <div className="biz-profile-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-4 h-4 ${
                          n <= Math.round(restaurant.rating!.avg)
                            ? "biz-star-filled"
                            : "biz-star-empty"
                        }`}
                      />
                    ))}
                    <span className="biz-profile-rating-text">
                      {restaurant.rating!.avg.toFixed(1)} de 5 ·{" "}
                      {restaurant.rating!.count} reseña
                      {restaurant.rating!.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* Address */}
              {restaurant.address && (
                <div className="biz-profile-detail">
                  <MapPin className="w-4 h-4 biz-detail-icon" />
                  <span>{restaurant.address}</span>
                </div>
              )}

              {/* Schedule */}
              {restaurant.schedule && (
                <div className="biz-profile-detail">
                  <Clock className="w-4 h-4 biz-detail-icon" />
                  <span>{restaurant.schedule}</span>
                </div>
              )}

              {/* Product count */}
              {restaurant.menu.categories.length > 0 && (
                <div className="biz-profile-detail">
                  <UtensilsCrossed className="w-4 h-4 biz-detail-icon" />
                  <span>
                    {restaurant.menu.categories.reduce(
                      (sum, c) => sum + c.items.length,
                      0,
                    )}{" "}
                    productos en {restaurant.menu.categories.length} categoría
                    {restaurant.menu.categories.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Verified badge */}
              {isPremium && (
                <div className="biz-profile-detail biz-profile-verified">
                  <Shield className="w-4 h-4" />
                  <span>Negocio verificado</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .biz-profile {
          margin: 8px 0 4px;
        }
        .biz-profile-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .biz-profile-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
        }
        .biz-profile-rating {
          color: #facc15;
        }
        .biz-profile-muted {
          color: rgba(255, 255, 255, 0.35);
        }
        .biz-profile-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          font-family: var(--font-sans), sans-serif;
          border-radius: 999px;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }
        .biz-profile-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.7);
        }

        .biz-profile-expanded {
          padding: 14px 0 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .biz-profile-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
        }
        .biz-detail-icon {
          color: rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }
        .biz-profile-stars {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .biz-star-filled {
          color: #facc15;
          fill: #facc15;
        }
        .biz-star-empty {
          color: rgba(255, 255, 255, 0.15);
        }
        .biz-profile-rating-text {
          margin-left: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        .biz-profile-verified {
          color: #4ade80;
        }
        .biz-profile-verified svg {
          fill: rgba(74, 222, 128, 0.2);
        }
      `}</style>
    </div>
  );
}
