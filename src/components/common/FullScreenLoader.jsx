export function FullScreenLoader({ label }) {
  return (
    <div className="fullscreen-loader" role="status" aria-live="polite">
      <div className="loader-orb" />
      <p>{label}</p>
    </div>
  );
}

