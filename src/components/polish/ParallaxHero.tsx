/** Static hero frame — parallax drift removed for a calmer, simpler screen. */
export function ParallaxHero({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg">{children}</div>;
}
