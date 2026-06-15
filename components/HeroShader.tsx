"use client";

export default function HeroShader() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ background: "#0E1116" }}
    >
      {/* Aurora blobs — animated via CSS transform on compositor, zero CPU */}
      <div className="hero-aurora-blob hero-aurora-1" />
      <div className="hero-aurora-blob hero-aurora-2" />
      <div className="hero-aurora-blob hero-aurora-3" />

      {/* Vignettes */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "35%",
          background:
            "linear-gradient(to bottom, rgba(14,17,22,0.92), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "35%",
          background:
            "linear-gradient(to top, rgba(14,17,22,0.95), transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{
          width: "18%",
          background:
            "linear-gradient(to right, rgba(14,17,22,0.7), transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 pointer-events-none"
        style={{
          width: "18%",
          background:
            "linear-gradient(to left, rgba(14,17,22,0.7), transparent)",
        }}
      />
    </div>
  );
}
