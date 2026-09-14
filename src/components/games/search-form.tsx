export function SearchForm({
  defaultValue = "",
  size = "normal",
}: {
  defaultValue?: string;
  size?: "normal" | "large";
}) {
  return (
    <form
      className={`search-form ${size === "large" ? "search-form-large" : ""}`}
      action="/hledat"
      role="search"
    >
      <label className="sr-only" htmlFor={`game-search-${size}`}>
        Název PC hry
      </label>
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        id={`game-search-${size}`}
        name="q"
        defaultValue={defaultValue}
        minLength={2}
        maxLength={80}
        placeholder="Jakou hru hledáte?"
        autoComplete="off"
      />
      <button type="submit">
        Hledat nabídky <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
