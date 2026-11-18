import React from 'react';

export function CubeIcon({ className = "vf-icon-cube", stroke = "#a78bfa" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <path
        d="M16 2.5L28 9.5V22.5L16 29.5L4 22.5V9.5L16 2.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Isometric center vertices */}
      <path
        d="M16 2.5V16M28 9.5L16 16M4 9.5L16 16M16 16V29.5"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner floating cube highlight */}
      <circle cx="16" cy="16" r="2" fill={stroke} />
    </svg>
  );
}

export function TerminalIcon({ className = "vf-icon-terminal", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="4" />
      <path d="M6 9L10 12L6 15" />
      <path d="M13 15H18" />
    </svg>
  );
}

export function SignInIcon({ className = "vf-icon-tab", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" />
      <path d="M10 17L15 12L10 7" />
      <path d="M15 12H3" />
    </svg>
  );
}

export function UserPlusIcon({ className = "vf-icon-tab", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M20 8V14M17 11H23" />
    </svg>
  );
}

export function UserIcon({ className = "vf-icon-input", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function AtIcon({ className = "vf-icon-input", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8V12C16 13.6569 17.3431 15 19 15C20.6569 15 22 13.6569 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C14.8624 22 17.4475 20.803 19.2625 18.8837" />
    </svg>
  );
}

export function KeyIcon({ className = "vf-icon-input", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2L15 8" />
      <path d="M19 4L22 7" />
      <path d="M16.5 6.5L18 8" />
      <circle cx="7.5" cy="16.5" r="5.5" />
      <circle cx="7.5" cy="16.5" r="2" />
    </svg>
  );
}

export function EyeIcon({ className = "vf-icon-eye", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = "vf-icon-eye", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88C9.33 10.43 9 11.18 9 12C9 13.66 10.34 15 12 15C12.82 15 13.57 14.67 14.12 14.12" />
      <path d="M2 2L22 22" />
      <path d="M6.71 6.71C4.84 8.07 3.32 9.87 2 12C2 12 5.64 19 12 19C14.07 19 16 18.25 17.65 17.06" />
      <path d="M10.73 5.08C11.15 5.03 11.57 5 12 5C18.36 5 22 12 22 12C21.28 13.2 20.35 14.33 19.23 15.26" />
    </svg>
  );
}

export function LightningIcon({ className = "vf-icon-btn", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={color}
    >
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
    </svg>
  );
}

export function GithubIcon({ className = "vf-icon-github", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={color}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017C2 16.442 4.865 20.198 8.84 21.527C9.34 21.62 9.52 21.31 9.52 21.045C9.52 20.806 9.51 20.02 9.51 19.176C6.73 19.782 6.14 17.834 6.14 17.834C5.69 16.685 5.03 16.381 5.03 16.381C4.12 15.761 5.1 15.774 5.1 15.774C6.11 15.845 6.64 16.885 6.64 16.885C7.54 18.423 9 17.98 9.56 17.728C9.65 17.074 9.91 16.63 10.2 16.381C7.97 16.128 5.63 15.264 5.63 11.417C5.63 10.321 6.02 9.421 6.66 8.72C6.56 8.468 6.22 7.447 6.76 6.075C6.76 6.075 7.6 5.807 9.51 7.103C10.31 6.88 11.16 6.769 12.01 6.765C12.86 6.769 13.71 6.88 14.51 7.103C16.42 5.807 17.26 6.075 17.26 6.075C17.8 7.447 17.46 8.468 17.36 8.72C18 9.421 18.39 10.321 18.39 11.417C18.39 15.275 16.04 16.124 13.81 16.371C14.17 16.685 14.5 17.306 14.5 18.257C14.5 19.623 14.49 20.722 14.49 21.045C14.49 21.314 14.67 21.628 15.18 21.524C19.147 20.187 22 16.438 22 12.017C22 6.484 17.522 2 12 2Z"
      />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "vf-icon-shield", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22S4 18 4 12V5L12 2L20 5V12C20 18 12 22 12 22Z" />
      <path d="M9 12L11 14L15 10" />
    </svg>
  );
}

export function StoreIcon({ className = "vf-icon-store", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9L4.5 3H19.5L21 9" />
      <path d="M3 9C3 10.6569 4.34315 12 6 12C7.65685 12 9 10.6569 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9C15 10.6569 16.3431 12 18 12C19.6569 12 21 10.6569 21 9" />
      <path d="M5 12V21H19V12" />
      <path d="M9 21V15H15V21" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "vf-icon-arrow", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12H19M19 12L13 6M19 12L13 18" />
    </svg>
  );
}

export function AlertCircleIcon({ className = "vf-icon-alert", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function CheckIcon({ className = "vf-icon-check", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CloseIcon({ className = "vf-icon-close", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MailIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7L12 13L21 7" />
    </svg>
  );
}

export function PhoneIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92V20C22 20.55 21.55 21 21 21C11.61 20.93 3.07 12.39 3 3C3 2.45 3.45 2 4 2H7.09C7.59 2 8 2.37 8.07 2.86L8.68 6.14C8.75 6.63 8.44 7.09 7.97 7.26L5.8 8C7.24 11.1 10.9 14.76 14 16.2L14.74 14.03C14.91 13.56 15.37 13.25 15.86 13.32L19.14 13.93C19.63 14 20 14.41 20 14.91L22 16.92Z" />
    </svg>
  );
}

export function GlobeIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12H21" />
      <path d="M12 3C14.5 5.5 15.5 8.5 15.5 12C15.5 15.5 14.5 18.5 12 21C9.5 18.5 8.5 15.5 8.5 12C8.5 8.5 9.5 5.5 12 3Z" />
    </svg>
  );
}

export function MapPinIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10C20 16 12 21 12 21C12 21 4 16 4 10C4 6.13 7.58 3 12 3C16.42 3 20 6.13 20 10Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function LinkedinIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color}>
      <path d="M20.45 20.45H16.9V14.88C16.9 13.55 16.87 11.84 15.02 11.84C13.14 11.84 12.86 13.27 12.86 14.78V20.45H9.31V9H12.72V10.58H12.77C13.25 9.69 14.4 8.75 16.13 8.75C19.75 8.75 20.45 11.1 20.45 14.16V20.45ZM5.34 7.43C4.2 7.43 3.28 6.5 3.28 5.36C3.28 4.22 4.2 3.29 5.34 3.29C6.47 3.29 7.39 4.22 7.39 5.36C7.39 6.5 6.47 7.43 5.34 7.43ZM7.12 20.45H3.56V9H7.12V20.45Z" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4H20V10" />
      <path d="M20 4L11 13" />
      <path d="M18 14V19C18 19.55 17.55 20 17 20H5C4.45 20 4 19.55 4 19V7C4 6.45 4.45 6 5 6H10" />
    </svg>
  );
}

export function TemplateIcon({ className = "vf-icon-contact", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9H21" />
      <path d="M9 21V9" />
    </svg>
  );
}

export function DatabaseIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5.5" rx="8" ry="3" />
      <path d="M4 5.5V12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12V5.5" />
      <path d="M4 12V18.5C4 20.16 7.58 21.5 12 21.5C16.42 21.5 20 20.16 20 18.5V12" />
    </svg>
  );
}

export function FormIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8H16" />
      <path d="M8 12H16" />
      <path d="M8 16H13" />
    </svg>
  );
}

export function UsersIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19C4 15.7 6.2 14 9 14C11.8 14 14 15.7 14.5 19" />
      <path d="M16 5.5C17.9 5.9 19.3 7.4 19.5 9.4" />
      <path d="M16.5 14.2C18.9 14.7 20.5 16.2 20.8 18.4" />
    </svg>
  );
}

export function LayersIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L21 8L12 13L3 8L12 3Z" />
      <path d="M3 12.5L12 17.5L21 12.5" />
      <path d="M3 17L12 22L21 17" />
    </svg>
  );
}

export function RocketIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15.5C10.6 14.1 9.8 12.2 9.8 10.1C9.8 6.4 12.9 3.5 16.9 3.5C17.3 3.5 17.7 3.5 18.1 3.6C18.2 4 18.2 4.4 18.1 4.8C17.6 8.2 15.4 11 12 15.5Z" />
      <path d="M8.7 13.8C7.9 14.1 7.2 14.5 6.6 15.1L4 17.7C3.6 18.1 3.9 18.8 4.5 18.8L8 18.3" />
      <path d="M10.5 18.5C10.9 17.8 11.3 17.2 11.9 16.6L14.5 14" />
      <path d="M4 20.5C4.6 19 5.4 17.9 6.6 17" />
      <circle cx="14.5" cy="9.5" r="1.5" />
    </svg>
  );
}

export function ImageIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="M4 17L9 12.5L13 16L16.5 13L20 16.5" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "vf-icon-feature", color = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7" />
      <path d="M8 7H17V16" />
    </svg>
  );
}
