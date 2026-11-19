import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  StoreIcon,
  SignInIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  MapPinIcon,
  LinkedinIcon,
  ExternalLinkIcon,
  CloseIcon,
  TemplateIcon,
  AlertCircleIcon,
} from '../components/ui/Icons';
import { getStoredUser } from '../api/authApi';
import { cloneListing, fetchListing, fetchListings } from '../api/marketplaceApi';
import './Marketplace.css';
import { initials } from '../utils/text';
import { countNodes } from '../builder/treeUtils';

function normalizeDeveloper(developer = {}) {
  const contact = developer.contact || {};

  return {
    id: developer.id || '',
    name: developer.name || developer.displayName || 'Marketplace Developer',
    displayName: developer.displayName || developer.name || '',
    title: developer.title || '',
    bio: developer.bio || '',
    skills: Array.isArray(developer.skills) ? developer.skills : [],
    email: contact.email || developer.email || '',
    phone: contact.phone || developer.phone || '',
    website: contact.website || developer.website || '',
    portfolioUrl: contact.portfolioUrl || developer.portfolioUrl || '',
    github: contact.github || developer.github || '',
    linkedin: contact.linkedin || developer.linkedin || '',
    location: contact.location || developer.location || '',
    availableForHire: Boolean(
      contact.availableForHire ?? developer.availableForHire ?? false,
    ),
  };
}

function normalizeListing(listing = {}) {
  const developer = normalizeDeveloper(listing.developer);
  const pages = Array.isArray(listing.pages) ? listing.pages : [];

  return {
    ...listing,
    name: listing.name || 'Untitled project',
    description: listing.description || '',
    tags: Array.isArray(listing.tags) ? listing.tags : [],
    screenshots: Array.isArray(listing.screenshots) ? listing.screenshots : [],
    status: listing.status || 'Approved',
    developer,
    pages,
    pagesCount: listing.pagesCount ?? pages.length ?? 0,
    componentCount:
      listing.componentCount ??
      pages.reduce((total, page) => total + countNodes(page.components), 0),
    tablesCount:
      listing.tablesCount ??
      pages.reduce(
        (total, page) =>
          total + (page.components || []).reduce((sum, node) => sum + countType(node, 'table'), 0),
        0,
      ),
  };
}

function countType(node, type) {
  return (node.children || []).reduce(
    (total, child) => total + (child.type === type ? 1 : 0) + countType(child, type),
    node.type === type ? 1 : 0,
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selected, setSelected] = useState(null);
  const [cloneId, setCloneId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const user = getStoredUser();

  const loadListings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const result = await fetchListings();

    if (result.ok) {
      setListings((result.data.listings || []).map(normalizeListing));
      setLoading(false);
      return;
    }

    setListings([]);
    setLoadError(result.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    if (!selected) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelected(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  const allTags = useMemo(
    () => ['All', ...new Set(listings.flatMap((listing) => listing.tags))],
    [listings],
  );

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return listings.filter((project) => {
      const matchesTag = selectedTag === 'All' || project.tags.includes(selectedTag);
      const matchesSearch =
        !term ||
        project.name.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.developer.name.toLowerCase().includes(term) ||
        project.developer.title.toLowerCase().includes(term) ||
        project.developer.email.toLowerCase().includes(term) ||
        project.tags.some((tag) => tag.toLowerCase().includes(term));

      return matchesTag && matchesSearch;
    });
  }, [listings, searchTerm, selectedTag]);

  const openDetails = useCallback(async (project) => {
    setSelected({ listing: project, pages: [], loading: true, error: null });

    const result = await fetchListing(project.id);

    if (result.ok) {
      setSelected((current) =>
        current
          ? {
              ...current,
              listing: normalizeListing(result.data.listing),
              pages: result.data.pages || [],
              loading: false,
              error: null,
            }
          : current,
      );
      return;
    }

    setSelected((current) =>
      current ? { ...current, loading: false, error: result.message } : current,
    );
  }, []);

  const handleUseTemplate = useCallback(
    async (project) => {
      setActionMessage(null);

      if (!user) {
        navigate('/auth/login', { state: { from: '/marketplace' } });
        return;
      }

      if (cloneId) return;
      setCloneId(project.id);

      try {
        const result = await cloneListing(project.id);
        if (!result.ok) {
          setActionMessage({ type: 'error', text: result.message });
          return;
        }
        navigate(`/builder/${result.data.project.id}`, { replace: true });
      } finally {
        setCloneId(null);
      }
    },
    [cloneId, navigate, user],
  );

  const selectedDeveloper = selected?.listing?.developer;

  return (
    <div className="vf-market-wrapper">
      <div className="vf-market-container">
        {/* Navigation Bar */}
        <header className="vf-market-navbar">
          <div className="vf-market-brand" onClick={() => navigate('/')}>
            <div className="vf-market-logo-box">
              <CubeIcon className="vf-icon-cube" stroke="#0b0b0c" />
            </div>
            <div>
              <div className="vf-market-brand-title">VisualForge Studio</div>
              <div className="vf-market-brand-sub">Developer marketplace</div>
            </div>
          </div>

          <div className="vf-market-nav-actions">
            {user ? (
              <div className="vf-market-nav-user">
                <span className="vf-market-user-label">
                  Logged in as <strong>{user.name}</strong>
                </span>
                <button type="button" onClick={() => navigate('/')} className="vf-nav-primary-btn">
                  My workspace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="vf-nav-primary-btn"
              >
                <SignInIcon className="vf-icon-tab" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </header>

        <section className="vf-market-hero">
          <div className="vf-visitor-badge">
            <StoreIcon className="vf-icon-store" color="#10b981" />
            <span>Public access · no login required</span>
          </div>
          <h1 className="vf-market-hero-title">Explore verified blueprints</h1>
          <p className="vf-market-hero-desc">
            Browse approved projects, see the developer behind each listing, and use a blueprint as
            the starting point of your own workspace.
          </p>
        </section>

        <section className="vf-market-filters-row">
          <input
            type="text"
            className="vf-search-input"
            placeholder="Search templates, developers or tags…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="vf-tags-container">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`vf-tag-chip${selectedTag === tag ? ' is-active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="vf-market-state">Loading approved blueprints…</div>
        ) : loadError ? (
          <div className="vf-market-state vf-market-state-error">
            <AlertCircleIcon className="vf-icon-alert" color="#f87171" />
            <p>{loadError}</p>
            <button type="button" className="vf-market-secondary-btn" onClick={loadListings}>
              Retry
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="vf-market-state">
            <p>No blueprints match your search. Try clearing the filters.</p>
          </div>
        ) : (
          <div className="vf-market-grid">
            {filteredProjects.map((proj) => (
              <article key={proj.id} className="vf-market-card">
                <div className="vf-market-card-body">
                  <div className="vf-market-card-top">
                    <span className="vf-market-pill">BaaS Blueprint</span>
                    <span className="vf-market-verified">
                      <span className="vf-market-verified-dot">●</span> Verified
                    </span>
                  </div>

                  <h3 className="vf-market-card-title">{proj.name || 'Untitled blueprint'}</h3>

                  <p className="vf-market-byline">
                    By <span>{proj.developer.name || 'Developer'}</span>
                    {proj.developer.title ? ` · ${proj.developer.title}` : ''}
                  </p>

                  <p className="vf-market-description">
                    {proj.description?.trim() ||
                      'Approved blueprint ready to clone into your workspace.'}
                  </p>

                  <div className="vf-market-contact-strip">
                    <span className="vf-market-avatar">{initials(proj.developer.name)}</span>
                    <div className="vf-market-contact-lines">
                      {proj.developer.email ? (
                        <a
                          href={`mailto:${proj.developer.email}`}
                          title={`Email ${proj.developer.name}`}
                        >
                          <MailIcon className="vf-icon-contact" color="#38bdf8" />
                          <span>{proj.developer.email}</span>
                        </a>
                      ) : null}
                      {proj.developer.phone ? (
                        <a
                          href={`tel:${proj.developer.phone.replace(/[^+\d]/g, '')}`}
                          title={`Call ${proj.developer.name}`}
                        >
                          <PhoneIcon className="vf-icon-contact" color="#34d399" />
                          <span>{proj.developer.phone}</span>
                        </a>
                      ) : null}
                      {proj.developer.location ? (
                        <span className="vf-market-location">
                          <MapPinIcon className="vf-icon-contact" color="#a78bfa" />
                          <span>{proj.developer.location}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {(proj.tags || []).length ? (
                    <div className="vf-market-tag-row">
                      {proj.tags.map((tag) => (
                        <span key={tag} className="vf-market-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="vf-market-card-footer">
                  <span className="vf-market-counts">
                    {proj.pagesCount} pages · {proj.tablesCount} tables
                  </span>
                  <div className="vf-market-card-actions">
                    <button
                      type="button"
                      className="vf-market-ghost-btn"
                      onClick={() => navigate(`/site/${proj.id}`)}
                    >
                      Visit
                    </button>
                    <button
                      type="button"
                      className="vf-market-ghost-btn"
                      onClick={() => openDetails(proj)}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      className="vf-market-clone-btn"
                      disabled={cloneId === proj.id}
                      onClick={() => handleUseTemplate(proj)}
                    >
                      <TemplateIcon className="vf-icon-contact" color="#ffffff" />
                      <span>{cloneId === proj.id ? 'Adding…' : 'Use Template'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Project & developer detail dialog */}
      {selected ? (
        <div
          className="vf-market-modal-overlay"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="vf-market-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selected.listing.name}
          >
            <button
              type="button"
              className="vf-market-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              <CloseIcon className="vf-icon-close" color="#94a3b8" />
            </button>

            {selected.loading ? (
              <div className="vf-market-state">Loading blueprint…</div>
            ) : selected.error ? (
              <div className="vf-market-state vf-market-state-error">
                <AlertCircleIcon className="vf-icon-alert" color="#f87171" />
                <p>{selected.error}</p>
              </div>
            ) : (
              <>
                <div className="vf-market-modal-head">
                  <div className="vf-market-pill">Approved blueprint</div>
                  <h2>{selected.listing.name}</h2>
                  <p>{selected.listing.description}</p>
                </div>

                <div className="vf-market-stat-grid">
                  <div className="vf-market-stat">
                    <strong>{selected.listing.pagesCount}</strong>
                    <span>Pages</span>
                  </div>
                  <div className="vf-market-stat">
                    <strong>{selected.listing.componentCount}</strong>
                    <span>Components</span>
                  </div>
                  <div className="vf-market-stat">
                    <strong>{selected.listing.tablesCount}</strong>
                    <span>Tables</span>
                  </div>
                  <div className="vf-market-stat">
                    <strong>{selected.listing.screenshots.length}</strong>
                    <span>Screenshots</span>
                  </div>
                </div>

                {selected.listing.screenshots.length ? (
                  <section className="vf-market-modal-section">
                    <h3>Screenshots</h3>
                    <div className="vf-market-shot-grid">
                      {selected.listing.screenshots.map((url) => (
                        <a
                          key={url}
                          className="vf-market-shot"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img src={url} alt="" />
                        </a>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="vf-market-modal-section">
                  <h3>Blueprint pages</h3>
                  <div className="vf-market-page-list">
                    {selected.pages.length ? (
                      selected.pages.map((page) => (
                        <div key={page.id} className="vf-market-page-item">
                          <span className="vf-market-page-name">{page.name}</span>
                          <span className="vf-market-page-path">{page.path}</span>
                          <span className="vf-market-page-count">
                            {(page.components || []).length} top-level
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="vf-market-empty-inline">This blueprint has no stored pages.</p>
                    )}
                  </div>
                </section>

                {/* Developer information with contact details (FR-43) */}
                <section className="vf-developer-card">
                  <div className="vf-developer-card-head">
                    <span className="vf-market-avatar vf-market-avatar-lg">
                      {initials(selectedDeveloper?.name)}
                    </span>
                    <div>
                      <h3>{selectedDeveloper?.displayName || selectedDeveloper?.name}</h3>
                      <p className="vf-developer-title">{selectedDeveloper?.title}</p>
                      <div className="vf-developer-meta">
                        {selectedDeveloper?.location ? (
                          <span>
                            <MapPinIcon className="vf-icon-contact" color="#a78bfa" />
                            {selectedDeveloper.location}
                          </span>
                        ) : null}
                        {selectedDeveloper?.availableForHire ? (
                          <span className="vf-developer-available">Available for hire</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {selectedDeveloper?.bio ? <p className="vf-developer-bio">{selectedDeveloper.bio}</p> : null}

                  {selectedDeveloper?.skills?.length ? (
                    <div className="vf-developer-skills">
                      {selectedDeveloper.skills.map((skill) => (
                        <span key={skill} className="vf-developer-skill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="vf-developer-contacts">
                    {selectedDeveloper?.email ? (
                      <a className="vf-contact-row" href={`mailto:${selectedDeveloper.email}`}>
                        <MailIcon className="vf-icon-contact" color="#38bdf8" />
                        <span>{selectedDeveloper.email}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                    {selectedDeveloper?.phone ? (
                      <a
                        className="vf-contact-row"
                        href={`tel:${selectedDeveloper.phone.replace(/[^+\d]/g, '')}`}
                      >
                        <PhoneIcon className="vf-icon-contact" color="#34d399" />
                        <span>{selectedDeveloper.phone}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                    {selectedDeveloper?.website ? (
                      <a
                        className="vf-contact-row"
                        href={selectedDeveloper.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <GlobeIcon className="vf-icon-contact" color="#818cf8" />
                        <span>{selectedDeveloper.website}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                    {selectedDeveloper?.portfolioUrl ? (
                      <a
                        className="vf-contact-row"
                        href={selectedDeveloper.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <TemplateIcon className="vf-icon-contact" color="#c084fc" />
                        <span>{selectedDeveloper.portfolioUrl}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                    {selectedDeveloper?.github ? (
                      <a
                        className="vf-contact-row"
                        href={selectedDeveloper.github}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <GithubMark />
                        <span>{selectedDeveloper.github}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                    {selectedDeveloper?.linkedin ? (
                      <a
                        className="vf-contact-row"
                        href={selectedDeveloper.linkedin}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkedinIcon className="vf-icon-contact" color="#60a5fa" />
                        <span>{selectedDeveloper.linkedin}</span>
                        <ExternalLinkIcon className="vf-icon-contact vf-contact-external" color="#64748b" />
                      </a>
                    ) : null}
                  </div>
                </section>

                <div className="vf-market-modal-actions">
                  <button
                    type="button"
                    className="vf-market-ghost-btn"
                    onClick={() => navigate(`/site/${selected.listing.id}`)}
                  >
                    Visit site
                  </button>
                  <button
                    type="button"
                    className="vf-market-secondary-btn"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="vf-market-clone-btn vf-market-clone-btn-lg"
                    disabled={cloneId === selected.listing.id}
                    onClick={() => handleUseTemplate(selected.listing)}
                  >
                    <TemplateIcon className="vf-icon-contact" color="#ffffff" />
                    <span>
                      {cloneId === selected.listing.id
                        ? 'Adding to workspace…'
                        : user
                          ? 'Use This Template'
                          : 'Sign In & Use Template'}
                    </span>
                  </button>
                </div>

                {actionMessage ? (
                  <p className={`vf-market-action-message vf-market-action-${actionMessage.type}`}>
                    {actionMessage.text}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GithubMark() {
  return (
    <svg className="vf-icon-contact" viewBox="0 0 24 24" fill="#e2e8f0" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12.02C2 16.44 4.86 20.2 8.84 21.53C9.34 21.62 9.52 21.31 9.52 21.05C9.52 20.81 9.51 20.02 9.51 19.18C6.73 19.78 6.14 17.83 6.14 17.83C5.69 16.69 5.03 16.38 5.03 16.38C4.12 15.76 5.1 15.77 5.1 15.77C6.11 15.85 6.64 16.89 6.64 16.89C7.54 18.42 9 17.98 9.56 17.73C9.65 17.07 9.91 16.63 10.2 16.38C7.97 16.13 5.63 15.26 5.63 11.42C5.63 10.32 6.02 9.42 6.66 8.72C6.56 8.47 6.22 7.45 6.76 6.08C6.76 6.08 7.6 5.81 9.51 7.1C10.31 6.88 11.16 6.77 12.01 6.77C12.86 6.77 13.71 6.88 14.51 7.1C16.42 5.81 17.26 6.08 17.26 6.08C17.8 7.45 17.46 8.47 17.36 8.72C18 9.42 18.39 10.32 18.39 11.42C18.39 15.28 16.04 16.12 13.81 16.37C14.17 16.69 14.5 17.31 14.5 18.26C14.5 19.62 14.49 20.72 14.49 21.05C14.49 21.31 14.67 21.63 15.18 21.52C19.15 20.19 22 16.44 22 12.02C22 6.48 17.52 2 12 2Z" />
    </svg>
  );
}
