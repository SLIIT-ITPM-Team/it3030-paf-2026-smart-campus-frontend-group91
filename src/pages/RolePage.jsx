const RolePage = ({ title, description }) => {
  return (
    <section id="center">
      <div className="status-card">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
};

export default RolePage;

