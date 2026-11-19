import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  SignInIcon,
  StoreIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  DatabaseIcon,
  FormIcon,
  UsersIcon,
  LayersIcon,
  RocketIcon,
  ImageIcon,
  TemplateIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
} from '../components/ui/Icons';
import { getStoredUser, clearSession } from '../api/authApi';
import { fetchProjects, deleteProject } from '../api/projectApi';
import { fetchListings } from '../api/marketplaceApi';
import { getSampleListings } from '../data/marketplaceTemplates';
import { initials } from '../utils/text';
import './Home.css';
import './HomeLanding.css';

function formatUpdatedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

const CURRENT_YEAR = new Date().getFullYear();

const FEATURES = [
  {
    icon: LayersIcon,
    tint: 'lavender',
    title: 'Visual drag-and-drop builder',
    text: 'Compose pages from headings, forms, tables, images and containers. Edit text, spacing, colour and alignment from one property panel.',
    large: true,
  },
  {
    icon: DatabaseIcon,
    tint: 'sky',
    title: 'Generated MongoDB CRUD APIs',
    text: 'Define tables and fields visually — create, read, update and delete endpoints are generated for you.',
  },
  {
    icon: FormIcon,
    tint: 'mint',
    title: 'Validated forms & data binding',
    text: 'Point lists, tables and cards at real data. Forms validate input before it reaches your table.',
  },
  {
    icon: ImageIcon,
    tint: 'peach',
    title: 'Files, images & uploads',
    text: 'Upload media, bind it to components and keep everything attached to the project.',
  },
  {
    icon: UsersIcon,
    tint: 'sand',
    title: 'Team collaboration',
    text: 'Invite collaborators with editor or viewer permissions and work on the same project together.',
  },
  {
    icon: TemplateIcon,
    tint: 'lavender',
    title: 'Developer marketplace',
    text: 'Publish approved blueprints, browse what others built, contact developers and reuse templates.',
    large: true,
  },
];

const STEPS = [
  {
    icon: LayersIcon,
    step: '01',
    title: 'Design the page',
    text: 'Drag components onto the canvas and tune every detail in the property panel. No code required.',
  },
  {
    icon: DatabaseIcon,
    step: '02',
    title: 'Connect your data',
    text: 'Create tables and fields, then bind components to the generated API. Forms store real records.',
  },
  {
    icon: RocketIcon,
    step: '03',
    title: 'Publish & share',
    text: 'Preview responsively, save, and submit the project to the marketplace when it is ready.',
  },
];

const STACK = ['React', 'Node.js', 'Express', 'MongoDB', 'JWT auth', 'REST APIs'];

// Facts about the product that are true in the current version.
const HIGHLIGHTS = [
  { value: '14', label: 'drag-and-drop component types' },
  { value: '5', label: 'field types with validation' },
  { value: 'CRUD', label: 'API generated for every table' },
  { value: '2', label: 'team roles: Editor and Viewer' },
];

const ROLES = [
  { name: 'Developer', text: 'Builds projects, defines tables and publishes finished work to the marketplace.' },
  { name: 'Team member', text: 'Works on a shared project as an Editor, or looks at it as a Viewer.' },
  { name: 'Administrator', text: 'Reviews marketplace listings, manages accounts and reads the activity log.' },
  { name: 'Visitor', text: 'Browses and searches approved blueprints without needing an account.' },
];

const FAQ = [
  {
    q: 'Do I need to write code?',
    a: 'No. You build pages by drag and drop, and the create, read, update and delete APIs for your tables are generated for you.',
  },
  {
    q: 'Which database does it use?',
    a: 'MongoDB, through Mongoose. The tables you define are stored as documents and every value is checked against its field type.',
  },
  {
    q: 'Who can see my projects?',
    a: 'Only you and the people you add as collaborators. A project appears in the marketplace only after an administrator approves it.',
  },
  {
    q: 'How does the marketplace review work?',
    a: 'You submit a project with a description and tags. An administrator approves it, or rejects it with a reason so you can improve it and submit it again.',
  },
  {
    q: 'Can I work with a team?',
    a: 'Yes. Add registered users by email as Editors, who can change pages and tables, or as Viewers, who can open and preview the project.',
  },
  {
    q: 'Is it free?',
    a: 'VisualForge Studio is a course project built with open-source tools, and it is free to use.',
  },
];

function BuilderMock() {
  return (
    <div className="vf-hero-visual" aria-hidden="true">
      <div className="vf-mock-window">
        <div className="vf-mock-titlebar">
          <span className="vf-mock-dot" />
          <span className="vf-mock-dot" />
          <span className="vf-mock-dot" />
          <span className="vf-mock-url">visualforge.studio/builder</span>
          <span className="vf-mock-live">
            <i /> Live preview
          </span>
        </div>
        <div className="vf-mock-body">
          <aside className="vf-mock-panel">
            <div className="vf-mock-panel-head">Components</div>
            {['Heading', 'Text', 'Image', 'Button', 'Table', 'Form'].map((item) => (
              <div key={item} className="vf-mock-panel-item">
                <span className="vf-mock-thumb" />
                {item}
              </div>
            ))}
          </aside>
          <main className="vf-mock-canvas">
            <div className="vf-mock-nav">
              <span className="vf-mock-logo" />
              <strong className="vf-mock-brand">Northwind Store</strong>
              <span className="vf-mock-navlinks">
                <i>Shop</i>
                <i>About</i>
                <i>Contact</i>
              </span>
            </div>
            <div className="vf-mock-hero vf-mock-selected">
              <h4 className="vf-mock-heading">Handmade goods, delivered.</h4>
              <p className="vf-mock-copy">Browse the catalogue and order in two clicks.</p>
              <div className="vf-mock-button">Shop now</div>
            </div>
            <div className="vf-mock-table">
              <div className="vf-mock-row vf-mock-row-head">
                <span>Product</span>
                <span>Price</span>
                <span>Stock</span>
              </div>
              {[
                ['Ceramic mug', '$14', '38'],
                ['Linen apron', '$29', '12'],
                ['Oak board', '$45', '7'],
              ].map(([name, price, stock]) => (
                <div key={name} className="vf-mock-row">
                  <span>{name}</span>
                  <span>{price}</span>
                  <span>{stock}</span>
                </div>
              ))}
            </div>
          </main>
          <aside className="vf-mock-props">
            <div className="vf-mock-panel-head">Properties</div>
            <div className="vf-mock-prop-label">Text</div>
            <div className="vf-mock-input">Handmade goods…</div>
            <div className="vf-mock-prop-label">Font size</div>
            <div className="vf-mock-input vf-mock-input-short">32 px</div>
            <div className="vf-mock-prop-label">Colour</div>
            <div className="vf-mock-swatches">
              <span />
              <span />
              <span />
              <span />
            </div>
          </aside>
        </div>
      </div>

      <div className="vf-float-card vf-float-api">
        <span className="vf-float-icon vf-float-icon-sky">
          <DatabaseIcon className="vf-icon-feature" color="#116dff" />
        </span>
        <div>
          <strong>API generated</strong>
          <span>GET /api/products · 200 OK</span>
        </div>
      </div>

      <div className="vf-float-card vf-float-publish">
        <span className="vf-float-icon vf-float-icon-mint">
          <StoreIcon className="vf-icon-feature" color="#0f8a5f" />
        </span>
        <div>
          <strong>Published</strong>
          <span>Listed in the marketplace</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  // null means "not loaded yet", so loading is derived instead of set in an effect.
  const [projects, setProjects] = useState(null);
  const [projectsError, setProjectsError] = useState(null);
  const [featuredBlueprints, setFeaturedBlueprints] = useState([]);
  const sampleBlueprints = useMemo(() => getSampleListings().slice(0, 3), []);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchListings().then((result) => {
      if (cancelled) return;
      if (result.ok) setFeaturedBlueprints((result.data.listings || []).slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    if (!Array.isArray(projects)) return { count: 0, pages: 0, components: 0 };
    return {
      count: projects.length,
      pages: projects.reduce((sum, project) => sum + (project.pageCount || 0), 0),
      components: projects.reduce((sum, project) => sum + (project.componentCount || 0), 0),
    };
  }, [projects]);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setProjects(null);
    setProjectsError(null);
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setDeletingId(project.id);
    const result = await deleteProject(project.id);
    setDeletingId(null);
    if (!result.ok) {
      setProjectsError(result.message);
      return;
    }
    setProjects((current) => (current || []).filter((item) => item.id !== project.id));
  };

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;

    fetchProjects().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProjects(result.data.projects || []);
      } else {
        setProjects([]);
        setProjectsError(result.message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        {/* Top navigation */}
        <header className="vf-site-nav">
          <div className="vf-site-brand" onClick={() => navigate('/')}>
            <span className="vf-site-logo">
              <CubeIcon className="vf-icon-cube" stroke="#0b0b0c" />
            </span>
            <span className="vf-site-wordmark">VisualForge</span>
          </div>

          {!user ? (
            <nav className="vf-site-links" aria-label="Primary">
              <a href="#product">Product</a>
              <a href="#how">How it works</a>
              <a href="#marketplace">Marketplace</a>
              <a href="#faq">FAQ</a>
            </nav>
          ) : null}

          <div className="vf-site-actions">
            {user ? (
              <>
                <span className="vf-user-chip">
                  <span className="vf-user-chip-avatar">{initials(user.name)}</span>
                  <span className="vf-user-chip-text">
                    <strong>{user.name}</strong>
                    <span>{user.role}</span>
                  </span>
                </span>
                <button type="button" className="vf-ghost-btn" onClick={() => navigate('/profile')}>
                  Profile
                </button>
                {user.role === 'Admin' ? (
                  <button type="button" className="vf-ghost-btn" onClick={() => navigate('/admin')}>
                    Admin
                  </button>
                ) : null}
                <button type="button" className="vf-ghost-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="vf-ghost-btn vf-ghost-btn-quiet"
                  onClick={() => navigate('/auth/login')}
                >
                  <SignInIcon className="vf-icon-tab" />
                  <span>Sign in</span>
                </button>
                <button
                  type="button"
                  className="vf-primary-btn"
                  onClick={() => navigate('/auth/register')}
                >
                  <span>Get started</span>
                  <ArrowRightIcon className="vf-icon-arrow" />
                </button>
              </>
            )}
          </div>
        </header>

        {user ? (
          /* Authenticated developer workspace */
          <div className="vf-workspace">
            <div className="vf-workspace-head">
              <div>
                <p className="vf-eyebrow">Developer workspace</p>
                <h1>Welcome back, {user.name.split(' ')[0]}.</h1>
                <p className="vf-muted">
                  Signed in as <strong>{user.email}</strong>. Pick a project or start something new.
                </p>
              </div>
              <div className="vf-workspace-actions">
                <button
                  type="button"
                  className="vf-ghost-btn vf-ghost-btn-lg"
                  onClick={() => navigate('/marketplace')}
                >
                  <StoreIcon className="vf-icon-tab" />
                  <span>Marketplace</span>
                </button>
                <button
                  type="button"
                  className="vf-primary-btn vf-primary-btn-lg"
                  onClick={() => navigate('/builder')}
                >
                  <span>New project</span>
                  <ArrowRightIcon className="vf-icon-arrow" />
                </button>
              </div>
            </div>

            {projectsError ? (
              <div className="vf-banner vf-banner-error">{projectsError}</div>
            ) : null}

            <div className="vf-stat-grid">
              <div className="vf-stat-card">
                <span className="vf-stat-label">Projects</span>
                <strong>{totals.count}</strong>
                <span className="vf-stat-hint">Saved in your workspace</span>
              </div>
              <div className="vf-stat-card">
                <span className="vf-stat-label">Pages</span>
                <strong>{totals.pages}</strong>
                <span className="vf-stat-hint">Across all projects</span>
              </div>
              <div className="vf-stat-card">
                <span className="vf-stat-label">Components</span>
                <strong>{totals.components}</strong>
                <span className="vf-stat-hint">Placed on canvases</span>
              </div>
              <div className="vf-stat-card vf-stat-card-accent">
                <span className="vf-stat-label">Marketplace</span>
                <strong>Live</strong>
                <button
                  type="button"
                  className="vf-stat-link"
                  onClick={() => navigate('/marketplace')}
                >
                  Browse blueprints <ArrowUpRightIcon className="vf-icon-feature" />
                </button>
              </div>
            </div>

            <div className="vf-section-head">
              <h2>Your projects</h2>
              <button type="button" className="vf-text-btn" onClick={() => navigate('/builder')}>
                + New project
              </button>
            </div>

            {projects === null ? (
              <div className="vf-projects-loading">Loading your projects…</div>
            ) : projects.length === 0 ? (
              <div className="vf-empty-state">
                <span className="vf-empty-icon">
                  <LayersIcon className="vf-icon-feature" color="#116dff" />
                </span>
                <h3>No projects yet</h3>
                <p>Create your first app, or start from an approved blueprint in the marketplace.</p>
                <div className="vf-empty-actions">
                  <button
                    type="button"
                    className="vf-primary-btn"
                    onClick={() => navigate('/builder')}
                  >
                    Create a project
                  </button>
                  <button
                    type="button"
                    className="vf-ghost-btn"
                    onClick={() => navigate('/marketplace')}
                  >
                    Explore blueprints
                  </button>
                </div>
              </div>
            ) : (
              <div className="vf-project-grid">
                {projects.map((proj) => (
                  <article key={proj.id} className="vf-project-card">
                    <div className="vf-project-card-top">
                      <span className="vf-project-badge">
                        <CheckIcon className="vf-icon-check" color="#0f8a5f" />
                        Saved project
                      </span>
                      <span className="vf-project-date">{formatUpdatedAt(proj.updatedAt)}</span>
                    </div>
                    <h3>{proj.name}</h3>
                    <p className="vf-project-meta">
                      {proj.pageCount} pages · {proj.componentCount} components
                    </p>
                    <div className="vf-project-card-foot">
                      <button
                        type="button"
                        className="vf-outline-btn"
                        onClick={() =>
                          navigate(`/builder/${proj.id}`, { state: { projectName: proj.name } })
                        }
                      >
                        Open in builder
                        <ArrowUpRightIcon className="vf-icon-feature" />
                      </button>
                      <button
                        type="button"
                        className="vf-ghost-btn"
                        disabled={deletingId === proj.id}
                        onClick={() => handleDeleteProject(proj)}
                      >
                        {deletingId === proj.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Public landing page */
          <main className="vf-landing">
            {/* Hero */}
            <section className="vf-hero">
              <div className="vf-hero-copy">
                <span className="vf-hero-badge">
                  <i className="vf-badge-dot" />
                  Visual app platform · No code required
                </span>
                <h1>
                  Build a working web app
                  <br />
                  <span className="vf-hero-accent">without writing code.</span>
                </h1>
                <p className="vf-hero-sub">
                  Design pages visually, connect real data, and ship with generated MongoDB APIs —
                  all in one calm, professional workspace.
                </p>
                <div className="vf-hero-cta">
                  <button
                    type="button"
                    className="vf-primary-btn vf-primary-btn-xl"
                    onClick={() => navigate('/auth/register')}
                  >
                    <span>Start building free</span>
                    <ArrowRightIcon className="vf-icon-arrow" />
                  </button>
                  <button
                    type="button"
                    className="vf-ghost-btn vf-ghost-btn-xl"
                    onClick={() => navigate('/marketplace')}
                  >
                    <StoreIcon className="vf-icon-tab" />
                    <span>Explore blueprints</span>
                  </button>
                </div>
                <ul className="vf-hero-proof">
                  {['Free to start', 'No credit card', 'Open-source stack'].map((point) => (
                    <li key={point}>
                      <CheckIcon className="vf-icon-check" color="#0f8a5f" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <BuilderMock />
            </section>

            {/* Technology strip */}
            <section className="vf-strip">
              <span className="vf-strip-label">Built on a stack you already know</span>
              <div className="vf-strip-items">
                {STACK.map((tech) => (
                  <span key={tech} className="vf-strip-chip">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* Facts */}
            <section className="vf-facts" aria-label="Product facts">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="vf-fact">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </section>

            {/* Feature bento */}
            <section id="product" className="vf-section">
              <div className="vf-section-intro vf-section-intro-center">
                <p className="vf-eyebrow">The product</p>
                <h2>Everything you need to go from idea to live app.</h2>
                <p className="vf-muted">
                  One workspace for the page you see and the backend that powers it — explained in
                  plain language, with sensible defaults at every step.
                </p>
              </div>

              <div className="vf-feature-grid">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <article
                      key={feature.title}
                      className={`vf-feature-card vf-tint-${feature.tint}${
                        feature.large ? ' vf-feature-card-lg' : ''
                      }`}
                    >
                      <span className="vf-feature-icon">
                        <Icon className="vf-icon-feature" color="#0b0b0c" />
                      </span>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* How it works */}
            <section id="how" className="vf-section">
              <div className="vf-dark-panel">
                <div className="vf-section-intro">
                  <p className="vf-eyebrow vf-eyebrow-light">How it works</p>
                  <h2>Three steps. Zero boilerplate.</h2>
                  <p className="vf-muted vf-muted-light">
                    From a blank canvas to a published blueprint — no setup, no configuration files.
                  </p>
                </div>
                <div className="vf-step-grid">
                  {STEPS.map((step) => {
                    const Icon = step.icon;
                    return (
                      <article key={step.step} className="vf-step-card">
                        <div className="vf-step-top">
                          <span className="vf-step-icon">
                            <Icon className="vf-icon-feature" color="#ffffff" />
                          </span>
                          <span className="vf-step-number">{step.step}</span>
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Marketplace preview */}
            <section id="marketplace" className="vf-section">
              <div className="vf-split">
                <div className="vf-split-copy">
                  <p className="vf-eyebrow">Blueprint marketplace</p>
                  <h2>Start from work that is already proven.</h2>
                  <p className="vf-muted">
                    Every listing is reviewed by an administrator and shows the developer behind it.
                    Open a blueprint, see how it is built, contact the developer, then use it as the
                    starting point of your own project.
                  </p>
                  <button
                    type="button"
                    className="vf-primary-btn vf-primary-btn-lg"
                    onClick={() => navigate('/marketplace')}
                  >
                    <span>Browse all blueprints</span>
                    <ArrowRightIcon className="vf-icon-arrow" />
                  </button>
                </div>
                <div className="vf-split-cards">
                  {featuredBlueprints.length === 0 ? (
                    <>
                      {sampleBlueprints.map((sample) => (
                        <article key={sample.id} className="vf-sample-card">
                          <div className="vf-sample-top">
                            <h3>{sample.name}</h3>
                            <span className="vf-sample-badge">Sample</span>
                          </div>
                          <p>{sample.description}</p>
                          <div className="vf-sample-meta">
                            <span>{sample.pagesCount} pages</span>
                            <span>{sample.componentCount} components</span>
                            {(sample.tags || []).slice(0, 2).map((tag) => (
                              <span key={tag}>#{tag}</span>
                            ))}
                          </div>
                        </article>
                      ))}
                      <p className="vf-muted vf-sample-note">
                        These are examples. Approved projects of real developers appear here.
                      </p>
                    </>
                  ) : (
                    featuredBlueprints.map((blueprint) => (
                      <article key={blueprint.id} className="vf-blueprint-row">
                        <div className="vf-blueprint-main">
                          <h3>{blueprint.name}</h3>
                          <div className="vf-blueprint-tags">
                            {(blueprint.tags || []).slice(0, 3).map((tag) => (
                              <span key={tag}>#{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="vf-blueprint-dev">
                          <span className="vf-blueprint-avatar">
                            {initials(blueprint.developer?.name)}
                          </span>
                          <div>
                            <strong>{blueprint.developer?.name || 'Developer'}</strong>
                            <span>{blueprint.developer?.title || ''}</span>
                          </div>
                        </div>
                        <div className="vf-blueprint-contact">
                          {blueprint.developer?.contact?.email ? (
                            <span>
                              <MailIcon className="vf-icon-contact" color="#116dff" />
                              {blueprint.developer.contact.email}
                            </span>
                          ) : null}
                          {blueprint.developer?.contact?.phone ? (
                            <span>
                              <PhoneIcon className="vf-icon-contact" color="#0f8a5f" />
                              {blueprint.developer.contact.phone}
                            </span>
                          ) : null}
                          {blueprint.developer?.contact?.location ? (
                            <span>
                              <MapPinIcon className="vf-icon-contact" color="#7c5cff" />
                              {blueprint.developer.contact.location}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Roles */}
            <section id="roles" className="vf-section">
              <div className="vf-section-intro vf-section-intro-center">
                <p className="vf-eyebrow">Who it is for</p>
                <h2>One platform, four kinds of people.</h2>
                <p className="vf-muted">
                  Each role sees only what it needs, and every permission is checked on the server.
                </p>
              </div>
              <div className="vf-role-grid">
                {ROLES.map((role) => (
                  <article key={role.name} className="vf-role-card">
                    <h3>{role.name}</h3>
                    <p>{role.text}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="vf-section">
              <div className="vf-section-intro vf-section-intro-center">
                <p className="vf-eyebrow">Questions</p>
                <h2>Good to know before you start.</h2>
              </div>
              <div className="vf-faq">
                {FAQ.map((item) => (
                  <details key={item.q} className="vf-faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="vf-cta-band">
              <h2>Your next app is a few drags away.</h2>
              <p>Create a free account, open the builder and ship something today.</p>
              <div className="vf-cta-actions">
                <button
                  type="button"
                  className="vf-primary-btn vf-primary-btn-xl"
                  onClick={() => navigate('/auth/register')}
                >
                  <span>Get started free</span>
                  <ArrowRightIcon className="vf-icon-arrow" />
                </button>
                <button
                  type="button"
                  className="vf-ghost-btn vf-ghost-btn-xl"
                  onClick={() => navigate('/auth/login')}
                >
                  <SignInIcon className="vf-icon-tab" />
                  <span>Sign in</span>
                </button>
              </div>
            </section>
          </main>
        )}

        {/* Footer */}
        <footer className="vf-footer">
          <div className="vf-footer-top">
            <div className="vf-footer-brand">
              <span className="vf-site-logo vf-site-logo-dark">
                <CubeIcon className="vf-icon-cube" stroke="#ffffff" />
              </span>
              <div>
                <strong>VisualForge Studio</strong>
                <p>Visual builder with backend-as-a-service.</p>
              </div>
            </div>
            <div className="vf-footer-links">
              <div>
                <span>Product</span>
                <button type="button" onClick={() => navigate(user ? '/builder' : '/auth/register')}>
                  Builder
                </button>
                <button type="button" onClick={() => navigate('/marketplace')}>
                  Marketplace
                </button>
                <a
                  href="#product"
                  onClick={(event) => {
                    if (user) {
                      event.preventDefault();
                      navigate('/');
                    }
                  }}
                >
                  Features
                </a>
              </div>
              <div>
                <span>Account</span>
                {user ? (
                  <>
                    <button type="button" onClick={() => navigate('/')}>Workspace</button>
                    <button type="button" onClick={() => navigate('/profile')}>Profile</button>
                    <button type="button" onClick={handleLogout}>Sign out</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => navigate('/auth/login')}>Sign in</button>
                    <button type="button" onClick={() => navigate('/auth/register')}>
                      Create account
                    </button>
                  </>
                )}
              </div>
              <div>
                <span>Project</span>
                <button type="button" onClick={() => navigate('/marketplace')}>
                  Approved blueprints
                </button>
                <a href="https://react.dev" target="_blank" rel="noreferrer">React</a>
                <a href="https://www.mongodb.com" target="_blank" rel="noreferrer">MongoDB</a>
              </div>
            </div>
          </div>
          <div className="vf-footer-bottom">
            <span>© {CURRENT_YEAR} VisualForge Studio. All rights reserved.</span>
            <span>MCA capstone project · Designed &amp; engineered with an open-source stack.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
