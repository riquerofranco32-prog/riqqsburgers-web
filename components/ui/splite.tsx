"use client";

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  // Convert .splinecode URL to Spline embed URL
  // https://prod.spline.design/{id}/scene.splinecode → https://my.spline.design/{id}/
  const embedUrl = scene
    .replace("https://prod.spline.design/", "https://my.spline.design/")
    .replace("/scene.splinecode", "/");

  return (
    <div className={className} style={{ position: "relative" }}>
      <iframe
        src={embedUrl}
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline 3D Scene"
        style={{ display: "block", border: "none" }}
        loading="lazy"
      />
    </div>
  );
}
