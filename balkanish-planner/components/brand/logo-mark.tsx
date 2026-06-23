type LogoMarkProps = {
  size?: number;
  color?: string;
  className?: string;
};

/**
 * Čipka-inspired "B" monogram: the brand glyph filled with a cross-stitch
 * texture instead of a solid fill, evoking the embroidered lace motif.
 * Swap for the official exported logo asset (/public/brand/logo.svg) once available.
 */
export function LogoMark({ size = 48, color = "#385048", className }: LogoMarkProps) {
  const id = "cipka-x";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="BabicADesigns B monogram"
    >
      <defs>
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <path
            d="M1,1 L6,6 M6,1 L1,6"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </pattern>
        <clipPath id="b-glyph-clip">
          <text
            x="6"
            y="82"
            fontSize="98"
            fontFamily="'Cormorant Garamond', Georgia, serif"
            fontWeight={700}
          >
            B
          </text>
        </clipPath>
      </defs>
      <g clipPath="url(#b-glyph-clip)">
        <rect width="100" height="100" fill={`url(#${id})`} />
      </g>
    </svg>
  );
}
