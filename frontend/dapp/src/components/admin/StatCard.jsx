function StatCard({ title, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>

        <span className="stat-icon">▦</span>
      </div>

      <strong className="stat-value">{value}</strong>

      <span className="stat-description">
        {description}
      </span>
    </div>
  );
}

export default StatCard;