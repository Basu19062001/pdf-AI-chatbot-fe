import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="marketing-shell">
      <section className="hero-card hero-card--compact">
        <p className="eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <p className="hero-card__body">
          The route you requested is outside the current frontend surface area.
        </p>
        <div className="hero-card__actions">
          <Link className="button" to="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}

