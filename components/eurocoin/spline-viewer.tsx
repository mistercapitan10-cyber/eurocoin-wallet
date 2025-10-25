"use client";

import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline/next"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surfaceAlt">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  ),
});

interface SplineViewerProps {
  scene: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SplineViewer({ scene, className, style }: SplineViewerProps): JSX.Element {
  return (
    <div className={className} style={style}>
      <Spline scene={scene} />
    </div>
  );
}
