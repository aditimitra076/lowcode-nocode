import { countNodes } from '../builder/treeUtils'
/**
 * Built-in approved blueprints shown when the marketplace API is unreachable.
 * Each entry mirrors the public marketplace listing shape, including the
 * developer's contact details (FR-43) and a page blueprint that viewers can
 * use as the starting point of their own project.
 */

let templateSequence = 0

function nid(prefix) {
  templateSequence += 1;
  return `${prefix}-${templateSequence}`;
}

function node(type, props = {}, style = {}, children = []) {
  return { id: nid(type), type, props, style, children };
}

const HEADING = { fontSize: '30px', color: '#f8fafc', textAlign: 'left', margin: '0 0 14px 0' }
const BODY_TEXT = {
  fontSize: '15px',
  color: '#94a3b8',
  textAlign: 'left',
  margin: '0 0 18px 0',
  lineHeight: '1.6',
}
const ROW = {
  background: 'transparent',
  padding: '4px',
  borderRadius: '10px',
  gap: '12px',
  marginBottom: '12px',
}
const CARD = {
  background: '#121824',
  padding: '18px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
}
const BUTTON = {
  background: '#6366f1',
  color: '#ffffff',
  fontSize: '14px',
  padding: '10px 18px',
  borderRadius: '8px',
}
const TABLE = { fontSize: '13px', color: '#cbd5e1', padding: '4px 0' }
const LIST = { fontSize: '14px', color: '#cbd5e1', padding: '4px 0' }
const FORM = {
  background: '#121824',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
}

function card(title, text) {
  return node('card', { title, text }, CARD)
}

function buildEcommercePages() {
  return [
    {
      id: nid('page'),
      name: 'Home',
      path: '/',
      components: [
        node('heading', { text: 'Urban Cart — modern commerce, ready to sell' }, HEADING),
        node(
          'text',
          {
            text: 'A complete storefront blueprint with product catalogues, cart collections and order-ready layout components.',
          },
          BODY_TEXT,
        ),
        node('row', {}, ROW, [
          card('Catalogue ready', 'Product cards bound to your catalog collection.'),
          card('Cart flows', 'Dynamic cart summary and checkout actions.'),
          card('Order webhooks', 'Automated order records and notifications.'),
        ]),
        node('button', { text: 'Browse best sellers', href: '/products' }, BUTTON),
      ],
    },
    {
      id: nid('page'),
      name: 'Products',
      path: '/products',
      components: [
        node('heading', { text: 'Featured products' }, HEADING),
        node(
          'table',
          { columns: 'Product, Category, Price, Stock', rows: '3' },
          TABLE,
        ),
        node(
          'list',
          {
            items: 'Filter by category\nSort by price or rating\nInventory-aware badges',
          },
          LIST,
        ),
      ],
    },
    {
      id: nid('page'),
      name: 'Cart',
      path: '/cart',
      components: [
        node('heading', { text: 'Your cart' }, HEADING),
        node('form', { submitText: 'Place order' }, FORM, [
          node('heading', { text: 'Checkout details', fontSize: '20px' }, { ...HEADING, fontSize: '20px' }),
          node(
            'text',
            { text: 'Shipping, delivery window and payment preference captured in one flow.' },
            { ...BODY_TEXT, margin: '0 0 12px 0' },
          ),
          node('button', { text: 'Continue to payment', href: '#' }, BUTTON),
        ]),
      ],
    },
  ]
}

function buildSaasPages() {
  return [
    {
      id: nid('page'),
      name: 'Dashboard',
      path: '/',
      components: [
        node('heading', { text: 'Customer onboarding & CRM portal' }, HEADING),
        node(
          'text',
          { text: 'Track onboarding progress, team permissions and client activity from one dashboard.' },
          BODY_TEXT,
        ),
        node('row', {}, ROW, [
          card('Active customers', 'Live count with permission-aware views.'),
          card('Onboarding steps', 'Automatic validation for every signup flow.'),
          card('Activity log', 'Client events captured for the whole team.'),
        ]),
        node('table', { columns: 'Customer, Owner, Stage, Last activity', rows: '3' }, TABLE),
      ],
    },
    {
      id: nid('page'),
      name: 'Onboarding',
      path: '/onboarding',
      components: [
        node('heading', { text: 'Onboard a new customer' }, HEADING),
        node('form', { submitText: 'Start onboarding' }, FORM, [
          node(
            'text',
            { text: 'Company details, team size and selected plan are validated before submission.' },
            { ...BODY_TEXT, margin: '0 0 12px 0' },
          ),
          node('button', { text: 'Create workspace', href: '#' }, BUTTON),
        ]),
      ],
    },
    {
      id: nid('page'),
      name: 'Contacts',
      path: '/contacts',
      components: [
        node('heading', { text: 'Client directory' }, HEADING),
        node('list', { items: 'Search by company or owner\nFilter by lifecycle stage\nExport account list' }, LIST),
        node('table', { columns: 'Name, Company, Permission, Status', rows: '3' }, TABLE),
      ],
    },
  ]
}

function buildHealthcarePages() {
  return [
    {
      id: nid('page'),
      name: 'Booking',
      path: '/',
      components: [
        node('heading', { text: 'Book a patient appointment' }, HEADING),
        node('form', { submitText: 'Book appointment' }, FORM, [
          node(
            'text',
            { text: 'Choose a department, preferred doctor and time slot. Availability stays in sync.' },
            { ...BODY_TEXT, margin: '0 0 12px 0' },
          ),
          node('button', { text: 'Check availability', href: '/doctors' }, BUTTON),
        ]),
      ],
    },
    {
      id: nid('page'),
      name: 'Doctors',
      path: '/doctors',
      components: [
        node('heading', { text: 'Doctor availability' }, HEADING),
        node('row', {}, ROW, [
          card('Dr. Amara', 'Cardiology · Mon, Wed, Fri'),
          card('Dr. Patel', 'Paediatrics · Tue, Thu'),
          card('Dr. Kim', 'Dermatology · Mon–Fri'),
        ]),
        node('table', { columns: 'Doctor, Speciality, Day, Slots', rows: '3' }, TABLE),
      ],
    },
    {
      id: nid('page'),
      name: 'Confirmation',
      path: '/confirmation',
      components: [
        node('heading', { text: 'Appointment confirmed' }, HEADING),
        node(
          'text',
          { text: 'A confirmation trigger emails the patient and reserves the slot in the schedule.' },
          BODY_TEXT,
        ),
        node('button', { text: 'Book another visit', href: '/' }, BUTTON),
      ],
    },
  ]
}

function buildRealEstatePages() {
  return [
    {
      id: nid('page'),
      name: 'Home',
      path: '/',
      components: [
        node('heading', { text: 'Find your next home' }, HEADING),
        node('text', { text: 'Interactive listings, agent directory and enquiry forms in one blueprint.' }, BODY_TEXT),
        node('image', { src: 'https://picsum.photos/seed/vf-realestate/900/420', alt: 'Featured property' }, {
          width: '100%',
          maxWidth: '640px',
          borderRadius: '12px',
          margin: '0 0 16px 0',
        }),
        node('row', {}, ROW, [
          card('Verified listings', 'Property cards bound to the listings table.'),
          card('Agent directory', 'Filter agents by region and specialty.'),
          card('Enquiry capture', 'Form submissions stored without a login.'),
        ]),
      ],
    },
    {
      id: nid('page'),
      name: 'Listings',
      path: '/listings',
      components: [
        node('heading', { text: 'Property listings' }, HEADING),
        node('table', { columns: 'Property, Location, Beds, Price', rows: '4' }, TABLE),
        node('list', { items: 'Filter by price band\nMap-friendly gallery cards\nSaved shortlists' }, LIST),
      ],
    },
    {
      id: nid('page'),
      name: 'Contact an agent',
      path: '/contact',
      components: [
        node('heading', { text: 'Talk to an agent' }, HEADING),
        node('form', { submitText: 'Send enquiry' }, FORM, [
          node('text', { text: 'Tell the agent which property you are interested in and when to call.' }, {
            ...BODY_TEXT,
            margin: '0 0 12px 0',
          }),
          node('button', { text: 'Request a callback', href: '#' }, BUTTON),
        ]),
      ],
    },
  ]
}

const SAMPLE_BLUEPRINTS = [
  {
    id: 'sample-ecommerce',
    name: 'E-Commerce Storefront & Inventory BaaS',
    description:
      'Full e-commerce schema with product catalogs, dynamic cart collections, customer order webhooks, and automated MongoDB CRUD endpoints.',
    tags: ['E-Commerce', 'MongoDB', 'CRUD API', 'Cart'],
    status: 'Approved',
    isSample: true,
    developer: {
      id: 'dev-sarah-chen',
      name: 'Sarah Chen',
      displayName: 'Sarah Chen',
      title: 'Senior Full-Stack Developer',
      bio: 'Builds conversion-focused storefronts and inventory systems. Ten years shipping React, Node and MongoDB products for retail teams.',
      skills: ['React', 'Node.js', 'MongoDB', 'Stripe', 'E-Commerce'],
      contact: {
        email: 'sarah.chen@urbanstack.dev',
        phone: '+1 (415) 555-0132',
        website: 'https://sarahchen.dev',
        portfolioUrl: 'https://sarahchen.dev/work',
        github: 'https://github.com/sarahchen',
        linkedin: 'https://linkedin.com/in/sarahchen',
        location: 'San Francisco, CA',
        availableForHire: true,
      },
    },
    buildPages: buildEcommercePages,
  },
  {
    id: 'sample-saas-crm',
    name: 'SaaS Customer Onboarding & CRM Portal',
    description:
      'Complete onboarding form flows with automatic validation, team collaborator permission matrix, and client activity logs.',
    tags: ['SaaS', 'Forms', 'Auth', 'CRM'],
    status: 'Approved',
    isSample: true,
    developer: {
      id: 'dev-marcus-vance',
      name: 'Marcus Vance',
      displayName: 'Marcus Vance',
      title: 'Product Engineer & CRM Specialist',
      bio: 'Designs onboarding and CRM workflows that sales teams actually use. Focused on validated forms, permissions and clear activity history.',
      skills: ['React', 'TypeScript', 'Express', 'Permissions', 'CRM'],
      contact: {
        email: 'marcus@vantagestudio.io',
        phone: '+1 (212) 555-0176',
        website: 'https://vantagestudio.io',
        portfolioUrl: 'https://vantagestudio.io/cases',
        github: 'https://github.com/marcusvance',
        linkedin: 'https://linkedin.com/in/marcusvance',
        location: 'New York, NY',
        availableForHire: true,
      },
    },
    buildPages: buildSaasPages,
  },
  {
    id: 'sample-healthcare',
    name: 'Healthcare Patient Booking & Appointments',
    description:
      'HIPAA-ready appointment booking interface connected to doctor availability tables with automated confirmation triggers.',
    tags: ['Healthcare', 'Booking', 'BaaS'],
    status: 'Approved',
    isSample: true,
    developer: {
      id: 'dev-elena-rostova',
      name: 'Elena Rostova',
      displayName: 'Elena Rostova',
      title: 'HealthTech Software Engineer',
      bio: 'Specialises in appointment scheduling, practitioner portals and careful data handling for healthcare products.',
      skills: ['React', 'Node.js', 'MongoDB', 'Scheduling', 'Accessibility'],
      contact: {
        email: 'elena@healthgrid.dev',
        phone: '+1 (617) 555-0119',
        website: 'https://elenarostova.dev',
        portfolioUrl: 'https://elenarostova.dev/projects',
        github: 'https://github.com/elenarostova',
        linkedin: 'https://linkedin.com/in/elenarostova',
        location: 'Boston, MA',
        availableForHire: false,
      },
    },
    buildPages: buildHealthcarePages,
  },
  {
    id: 'sample-real-estate',
    name: 'Real Estate Listings & Agent Directory',
    description:
      'Interactive card and table components bound to dynamic property listings with image upload capabilities and filters.',
    tags: ['Real Estate', 'Data Binding', 'Images'],
    status: 'Approved',
    isSample: true,
    developer: {
      id: 'dev-david-kalu',
      name: 'David Kalu',
      displayName: 'David Kalu',
      title: 'Front-End & Data Binding Engineer',
      bio: 'Creates listing-heavy interfaces with fast filtering, media uploads and clean component-to-table data binding.',
      skills: ['React', 'Vite', 'MongoDB', 'Image Uploads', 'Filtering'],
      contact: {
        email: 'david@havenrealty.com',
        phone: '+1 (305) 555-0148',
        website: 'https://davidkalu.dev',
        portfolioUrl: 'https://davidkalu.dev/listings',
        github: 'https://github.com/davidkalu',
        linkedin: 'https://linkedin.com/in/davidkalu',
        location: 'Miami, FL',
        availableForHire: true,
      },
    },
    buildPages: buildRealEstatePages,
  },
]

export function getSampleListings() {
  return SAMPLE_BLUEPRINTS.map((blueprint) => {
    const pages = blueprint.buildPages();
    return {
      ...blueprint,
      pages,
      pagesCount: pages.length,
      componentCount: pages.reduce((total, page) => total + countNodes(page.components), 0),
      screenshots: [],
    }
  })
}

export function getSampleTemplatePages(listingId) {
  const blueprint = SAMPLE_BLUEPRINTS.find((item) => item.id === listingId)
  return blueprint ? blueprint.buildPages() : null
}

export function getSampleListingById(listingId) {
  return getSampleListings().find((listing) => listing.id === listingId) || null
}
