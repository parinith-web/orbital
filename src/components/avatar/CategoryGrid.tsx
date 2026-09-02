/**
 * A wrapping grid of option tiles for a single avatar category (eyes,
 * mouth, hat). Replaces the old single-row horizontal carousel — all
 * options are visible at once, laid out responsively, with the page
 * scrolling vertically instead of the row scrolling horizontally.
 */
export function CategoryGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 py-1 px-1">
      {children}
    </div>
  );
}

export default CategoryGrid;
