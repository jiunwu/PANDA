/** Geometric SVG arrows render consistently instead of becoming emoji on iOS. */
export default function LandingArrow({ direction = "right" }) {
  const paths = {
    right: "M4 10h12m-5-5 5 5-5 5",
    external: "M5 15 15 5M5 5h10v10",
    up: "M10 16V4m-5 5 5-5 5 5",
  };
  return (
    <svg
      className="lp-arrow"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={paths[direction] || paths.right}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
