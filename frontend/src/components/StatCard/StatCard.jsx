import './StatCard.css';

function StatCard({ icon, label, value, description, color = "purple" }) {
  return (
    <div className={`nx-stat-card nx-stat-card--${color}`}>
      <div className="nx-stat-card__icon-wrapper">
        <span className="nx-stat-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="nx-stat-card__content">
        <h3 className="nx-stat-card__label">{label}</h3>
        <div className="nx-stat-card__value">{value ?? "--"}</div>
        {description && (
          <p className="nx-stat-card__desc">{description}</p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
