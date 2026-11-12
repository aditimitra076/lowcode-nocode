import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  StoreIcon,
  SignInIcon,
  ArrowRightIcon,
} from '../components/ui/Icons';
import { getStoredUser } from '../api/authApi';
import './Marketplace.css';

const SAMPLE_APPROVED_PROJECTS = [
  {
    id: 'proj-1',
    name: 'E-Commerce Storefront & Inventory BaaS',
    developer: 'Sarah Chen (Senior Dev)',
    description:
      'Full e-commerce schema with product catalogs, dynamic cart collections, customer order webhooks, and automated MongoDB CRUD endpoints.',
    tags: ['E-Commerce', 'MongoDB', 'CRUD API', 'Cart'],
    pagesCount: 6,
    tablesCount: 4,
    status: 'Approved',
  },
  {
    id: 'proj-2',
    name: 'SaaS Customer Onboarding & CRM Portal',
    developer: 'Marcus Vance',
    description:
      'Complete onboarding form flows with automatic validation, team collaborator permission matrix, and client activity logs.',
    tags: ['SaaS', 'Forms', 'Auth', 'CRM'],
    pagesCount: 8,
    tablesCount: 5,
    status: 'Approved',
  },
  {
    id: 'proj-3',
    name: 'Healthcare Patient Booking & Appointments',
    developer: 'Elena Rostova',
    description:
      'HIPAA-ready appointment booking interface connected to doctor availability tables with automated confirmation triggers.',
    tags: ['Healthcare', 'Booking', 'BaaS'],
    pagesCount: 5,
    tablesCount: 3,
    status: 'Approved',
  },
  {
    id: 'proj-4',
    name: 'Real Estate Listings & Agent Directory',
    developer: 'David Kalu',
    description:
      'Interactive card and table components bound to dynamic property listings with image upload capabilities and filters.',
    tags: ['Real Estate', 'Data Binding', 'Images'],
    pagesCount: 7,
    tablesCount: 4,
    status: 'Approved',
  },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const user = getStoredUser();

  const allTags = ['All', 'E-Commerce', 'SaaS', 'Healthcare', 'Real Estate', 'BaaS', 'CRUD API'];

  const filteredProjects = SAMPLE_APPROVED_PROJECTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.developer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || p.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="vf-market-wrapper">
      <div className="vf-market-container">
        {/* Navigation Bar */}
        <header className="vf-market-navbar">
          <div className="vf-market-brand" onClick={() => navigate('/')}>
            <div className="vf-market-logo-box">
              <CubeIcon className="vf-icon-cube" stroke="#c4b5fd" />
            </div>
            <div>
              <div className="vf-market-brand-title">VisualForge Studio</div>
              <div className="vf-market-brand-sub">Developer Marketplace (FR-41)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Logged in as <strong>{user.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="vf-nav-primary-btn"
                  style={{ padding: '7px 13px', fontSize: '12px' }}
                >
                  My Workspace (FR-04)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="vf-nav-primary-btn"
              >
                <SignInIcon className="vf-icon-tab" />
                <span>Sign In to Workspace (FR-02)</span>
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="vf-market-hero">
          <div className="vf-visitor-badge">
            <StoreIcon className="vf-icon-store" color="#10b981" />
            <span>PUBLIC VISITOR ACCESS • NO AUTH REQUIRED (FR-41)</span>
          </div>
          <h1 className="vf-market-hero-title">
            Explore Verified Blueprints & Schema Blueprints
          </h1>
          <p className="vf-market-hero-desc">
            Inspect live MongoDB schema components and public microservice blueprints built
            by verified developers and approved by administrators (FR-46).
          </p>
        </section>

        {/* Search & Filter Bar (FR-42) */}
        <section className="vf-market-filters-row">
          <input
            type="text"
            className="vf-search-input"
            placeholder="Search templates, schemas, or developers (FR-42)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="vf-tags-container">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className="vf-tag-chip"
                style={{
                  background: selectedTag === tag ? '#1e2638' : '#121824',
                  borderColor: selectedTag === tag ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                  color: selectedTag === tag ? '#ffffff' : '#94a3b8',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Grid of Approved Projects */}
        <div className="vf-market-grid">
          {filteredProjects.map((proj) => (
            <div key={proj.id} className="vf-market-card">
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                    }}
                  >
                    BaaS Blueprint
                  </span>
                  <span
                    style={{
                      color: '#10b981',
                      fontSize: '10.5px',
                      fontWeight: 600,
                    }}
                  >
                    ● Verified (FR-46)
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 5px 0',
                  }}
                >
                  {proj.name}
                </h3>

                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#818cf8',
                    marginBottom: '10px',
                    fontWeight: 500,
                  }}
                >
                  By {proj.developer} (FR-43)
                </div>

                <p
                  style={{
                    fontSize: '12.5px',
                    lineHeight: 1.48,
                    color: '#8692a6',
                    margin: '0 0 14px 0',
                  }}
                >
                  {proj.description}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '5px',
                    marginBottom: '14px',
                  }}
                >
                  {proj.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: '#0a0e16',
                        color: '#94a3b8',
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {proj.pagesCount} Pages • {proj.tablesCount} CRUD Tables
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/auth/login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <span>Clone Template</span>
                    <ArrowRightIcon className="vf-icon-arrow" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
