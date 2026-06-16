import { useEffect, useState } from 'react';
import { listFaqPages, type FaqPage } from '../../api/faqApi';
import './Faq.css';

function renderMarkdown(text: string): string {
  return text
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1} (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (m) => m.startsWith('<') ? m : m)
    .trim();
}

export function FaqPublicPage() {
  const [pages, setPages] = useState<FaqPage[]>([]);
  const [selected, setSelected] = useState<FaqPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listFaqPages()
      .then((ps) => {
        setPages(ps);
        if (ps.length > 0) setSelected(ps[0]);
      })
      .catch(() => setError('Failed to load help pages.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="faq-state">Loading…</p>;
  if (error) return <p className="faq-error">{error}</p>;
  if (pages.length === 0) return <p className="faq-state">No help pages published yet.</p>;

  return (
    <div className="faq-shell">
      <nav className="faq-sidebar">
        <p className="faq-sidebar-label">Help & Documentation</p>
        {pages.map((page) => (
          <button
            key={page.id}
            className={`faq-nav-item${selected?.id === page.id ? ' faq-nav-item--active' : ''}`}
            onClick={() => setSelected(page)}
          >
            {page.title}
          </button>
        ))}
      </nav>

      <article className="faq-content">
        {selected && (
          <>
            <h1 className="faq-title">{selected.title}</h1>
            <p className="faq-meta">
              Last updated {new Date(selected.updatedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div
              className="faq-body"
              dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(selected.content)}</p>` }}
            />
          </>
        )}
      </article>
    </div>
  );
}
