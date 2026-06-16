import './Placeholder.css';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <h2>{title}</h2>
      <p>This module is on the GRC Fortress roadmap and hasn't been built yet.</p>
    </div>
  );
}
