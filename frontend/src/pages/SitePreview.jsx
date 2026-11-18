import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchListing } from '../api/marketplaceApi';
import { StaticNode } from '../components/builder/ComponentNode';
import { useBuilderStore } from '../store/builderStore';
import './Builder.css';
import './SitePreview.css';

export default function SitePreview() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activePageId = useBuilderStore((state) => state.activePageId);
  const setActivePage = useBuilderStore((state) => state.setActivePage);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      const result = await fetchListing(listingId);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.message || 'Could not open this site.');
        setLoading(false);
        return;
      }

      const nextListing = result.data.listing || {};
      const nextPages = result.data.pages || nextListing.pages || [];
      setListing(nextListing);
      setPages(nextPages);

      useBuilderStore.setState({
        projectId: nextListing.projectId || 'draft',
        projectName: nextListing.name || 'Published site',
        pages: nextPages,
        activePageId: nextPages[0]?.id || null,
        previewing: true,
        selectedId: null,
        dropTarget: null,
      });

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
      useBuilderStore.setState({ previewing: false });
    };
  }, [listingId]);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) || pages[0] || null,
    [pages, activePageId],
  );

  return (
    <div className="vf-site">
      <header className="vf-site-bar">
        <button type="button" className="vf-site-back" onClick={() => navigate('/marketplace')}>
          ← Marketplace
        </button>

        <div className="vf-site-bar-center">
          <strong className="vf-site-name">{listing?.name || 'Published site'}</strong>
          {listing?.developer?.name ? (
            <span className="vf-site-by">by {listing.developer.name}</span>
          ) : null}
        </div>

        {pages.length > 1 ? (
          <nav className="vf-site-pages" aria-label="Site pages">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={page.id === activePage?.id ? 'is-active' : ''}
                onClick={() => setActivePage(page.id)}
              >
                {page.name}
              </button>
            ))}
          </nav>
        ) : (
          <span className="vf-site-bar-spacer" aria-hidden="true" />
        )}
      </header>

      <main className="vf-site-stage">
        {loading ? (
          <div className="vf-site-state">Loading site…</div>
        ) : error ? (
          <div className="vf-site-state vf-site-state-error">{error}</div>
        ) : !activePage ? (
          <div className="vf-site-state">This site has no pages yet.</div>
        ) : (
          <div className="vf-site-page">
            {(activePage.components || []).length === 0 ? (
              <div className="vf-site-state">This page is empty.</div>
            ) : (
              (activePage.components || []).map((node) => <StaticNode key={node.id} node={node} />)
            )}
          </div>
        )}
      </main>
    </div>
  );
}
