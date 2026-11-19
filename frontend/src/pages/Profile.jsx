import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, getStoredUser, saveProfile } from '../api/authApi';
import AppHeader from '../components/ui/AppHeader';
import { initials } from '../utils/text';
import './Home.css';
import './Screens.css';

const EMPTY = {
  displayName: '',
  title: '',
  bio: '',
  skills: '',
  location: '',
  contactEmail: '',
  phone: '',
  website: '',
  portfolioUrl: '',
  github: '',
  linkedin: '',
  availableForHire: true,
};

// The form is described as data: each section lists its fields.
const SECTIONS = [
  {
    title: 'About you',
    text: 'The name and the short introduction that visitors read first.',
    fields: [
      { key: 'displayName', label: 'Display name' },
      { key: 'title', label: 'Title', placeholder: 'Full-stack developer' },
      { key: 'bio', label: 'Bio', type: 'textarea', wide: true, hint: 'A few sentences about what you build.' },
      { key: 'skills', label: 'Skills', wide: true, placeholder: 'React, Node.js, MongoDB', hint: 'Separate the skills with commas.' },
      { key: 'location', label: 'Location', placeholder: 'City, Country' },
    ],
  },
  {
    title: 'Contact',
    text: 'How a visitor can reach you from one of your approved blueprints.',
    fields: [
      { key: 'contactEmail', label: 'Contact email', type: 'email', wide: true },
      { key: 'phone', label: 'Phone' },
      { key: 'website', label: 'Website', placeholder: 'https://' },
    ],
  },
  {
    title: 'Links',
    text: 'Your work and your profiles elsewhere.',
    fields: [
      { key: 'portfolioUrl', label: 'Portfolio URL', placeholder: 'https://' },
      { key: 'github', label: 'GitHub', placeholder: 'https://github.com/' },
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/' },
    ],
  },
];

function Field({ field, value, onChange }) {
  const Control = field.type === 'textarea' ? 'textarea' : 'input';
  return (
    <label className={`vf-field${field.wide ? ' vf-field-wide' : ''}`}>
      <span className="vf-field-label">{field.label}</span>
      <Control
        type={field.type === 'textarea' ? undefined : field.type || 'text'}
        rows={field.type === 'textarea' ? 4 : undefined}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
      {field.hint ? <span className="vf-field-hint">{field.hint}</span> : null}
    </label>
  );
}

/** How the profile looks to a visitor of the marketplace. */
function ProfilePreview({ form }) {
  const skills = form.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 8);
  const contact = [form.contactEmail, form.phone, form.location].filter(Boolean);

  return (
    <aside className="vf-profile-preview" aria-label="Preview of your public profile">
      <p className="vf-eyebrow">Preview</p>
      <div className="vf-profile-card">
        <span className="vf-profile-avatar">{initials(form.displayName) || '?'}</span>
        <h3>{form.displayName || 'Your name'}</h3>
        <p className="vf-profile-title">{form.title || 'Your title'}</p>
        {form.availableForHire ? <span className="vf-badge vf-badge-green">Available for hire</span> : null}
        {form.bio ? <p className="vf-profile-bio">{form.bio}</p> : null}
        {skills.length ? (
          <div className="vf-chip-row">
            {skills.map((skill) => (
              <span key={skill} className="vf-chip">
                {skill}
              </span>
            ))}
          </div>
        ) : null}
        {contact.length ? (
          <ul className="vf-profile-contact">
            {contact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState(null); // { text, type: 'info' | 'success' | 'error' }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { state: { from: '/profile' } });
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await fetchProfile();
      if (cancelled) return;
      if (!result.ok) {
        setMessage({ text: result.message, type: 'error' });
        setLoading(false);
        return;
      }
      const profile = result.data.profile || {};
      setForm({
        displayName: profile.displayName || user.name || '',
        title: profile.title || '',
        bio: profile.bio || '',
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
        location: profile.location || '',
        contactEmail: profile.contactEmail || user.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        portfolioUrl: profile.portfolioUrl || '',
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        availableForHire: profile.availableForHire !== false,
      });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per signed-in session
  }, [user?.id, navigate]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage({ text: 'Saving…', type: 'info' });
    const result = await saveProfile({ ...form, availableForHire: Boolean(form.availableForHire) });
    if (!result.ok) {
      setMessage({ text: result.message, type: 'error' });
      return;
    }
    setMessage({ text: 'Profile saved. This appears on your marketplace listings.', type: 'success' });
  };

  if (!user) return null;

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        <AppHeader section="Profile">
          <button type="button" className="vf-ghost-btn" onClick={() => navigate('/')}>
            Workspace
          </button>
        </AppHeader>

        <div className="vf-workspace">
          <div className="vf-workspace-head">
            <div>
              <p className="vf-eyebrow">Developer profile</p>
              <h1>Marketplace contact details</h1>
              <p className="vf-muted">Visitors see this when they open your approved blueprints.</p>
            </div>
          </div>

          {message ? (
            <div className={`vf-banner${message.type === 'error' ? ' vf-banner-error' : ''}${message.type === 'success' ? ' vf-banner-success' : ''}`} role="status">
              {message.text}
            </div>
          ) : null}
          {loading ? <p className="vf-muted">Loading profile…</p> : null}

          {!loading ? (
            <div className="vf-profile-layout">
              <form className="vf-profile-form" onSubmit={handleSave}>
                {SECTIONS.map((section) => (
                  <section key={section.title} className="vf-form-section">
                    <div className="vf-form-section-head">
                      <h2>{section.title}</h2>
                      <p>{section.text}</p>
                    </div>
                    <div className="vf-form-grid">
                      {section.fields.map((field) => (
                        <Field key={field.key} field={field} value={form[field.key]} onChange={setField} />
                      ))}
                    </div>
                  </section>
                ))}

                <section className="vf-form-section">
                  <div className="vf-form-section-head">
                    <h2>Availability</h2>
                    <p>Show visitors whether you are open to new work.</p>
                  </div>
                  <label className="vf-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(form.availableForHire)}
                      onChange={(event) => setField('availableForHire', event.target.checked)}
                    />
                    <span className="vf-switch-track" aria-hidden="true" />
                    <span>Available for hire</span>
                  </label>
                </section>

                <div className="vf-savebar">
                  <span className="vf-muted">Changes are shown on your listings after you save.</span>
                  <button type="submit" className="vf-primary-btn">
                    Save profile
                  </button>
                </div>
              </form>

              <ProfilePreview form={form} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
