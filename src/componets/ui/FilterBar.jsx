import "./FilterBar.css";

function FilterBar({ label, options, value, onChange }) {
  return (
    <div className="filter-bar" role="group" aria-label={label}>
      {options.map((option) => {
        const isActive = option === value;

        return (
          <button
            key={option}
            type="button"
            className={`filter-bar__item ${isActive ? "is-active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default FilterBar;