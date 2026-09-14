export default function Loader({ label = "Loading" }) {
  return (
    <div className="center-loader">
      <span className="spinner" />
      {label}…
    </div>
  );
}
