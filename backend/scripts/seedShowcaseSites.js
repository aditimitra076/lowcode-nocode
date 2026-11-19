/**
 * Seeds 3 polished multi-page showcase sites with distinct visual systems.
 * Usage: node scripts/seedShowcaseSites.js
 */
import dns from 'dns'
import 'dotenv/config'
import mongoose from 'mongoose'

try {
  dns.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1'])
} catch {
  /* ignore */
}

import User from '../modules/User.js'
import Project from '../modules/Project.js'
import DataTable from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import MarketplaceListing from '../modules/MarketplaceListing.js'
import DeveloperProfile from '../modules/DeveloperProfile.js'

const EMAIL = '12adarshpandey12@gmail.com'
const PASSWORD = 'AdarshPass123'
const NAME = 'Adarsh Pandey'

/** Three totally different design systems */
const THEMES = {
  panda: {
    name: 'Panda Sanctuary',
    ink: '#1c1917',
    muted: '#57534e',
    accent: '#3f6212',
    accentDeep: '#1a2e05',
    soft: '#f5f0e6',
    softAlt: '#e8efe0',
    card: '#fffdf8',
    line: '#d6d3d1',
    heroBg: 'linear-gradient(180deg, #f5f0e6 0%, #e8efe0 100%)',
    radius: '28px',
    radiusSm: '18px',
    btnRadius: '999px',
    headingSize: '52px',
    sectionPad: '48px 28px',
    navStyle: 'soft',
  },
  humming: {
    name: 'Hummingbird Haven',
    ink: '#134e4a',
    muted: '#0f766e',
    accent: '#f97316',
    accentDeep: '#0d9488',
    soft: '#ecfeff',
    softAlt: '#fff7ed',
    card: '#ffffff',
    line: '#99f6e4',
    heroBg: 'linear-gradient(135deg, #ecfeff 0%, #fff7ed 55%, #fce7f3 100%)',
    radius: '24px',
    radiusSm: '16px',
    btnRadius: '14px',
    headingSize: '48px',
    sectionPad: '40px 24px',
    navStyle: 'pill',
  },
  car: {
    name: 'Apex Motors',
    ink: '#fafafa',
    muted: '#a1a1aa',
    accent: '#ef4444',
    accentDeep: '#111111',
    soft: '#0a0a0a',
    softAlt: '#171717',
    card: '#141414',
    line: '#27272a',
    heroBg: '#0a0a0a',
    radius: '6px',
    radiusSm: '4px',
    btnRadius: '4px',
    headingSize: '56px',
    sectionPad: '56px 28px',
    navStyle: 'sharp',
  },
}

const IMG = {
  panda1:
    'https://images.unsplash.com/photo-1564349683136-77e08bbdb7f5?auto=format&fit=crop&w=1600&q=80',
  panda2:
    'https://images.unsplash.com/photo-1527119522634-f0d0c21c8b8c?auto=format&fit=crop&w=1600&q=80',
  panda3:
    'https://images.unsplash.com/photo-1530595467537-0dbcdae294ca?auto=format&fit=crop&w=1600&q=80',
  panda4:
    'https://images.unsplash.com/photo-1463852246758-bad003f9fbb8?auto=format&fit=crop&w=1600&q=80',
  panda5:
    'https://images.unsplash.com/photo-1611003228941-98852ba62227?auto=format&fit=crop&w=1600&q=80',
  hum1:
    'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1600&q=80',
  hum2:
    'https://images.unsplash.com/photo-1497206367901-f7bed2851b79?auto=format&fit=crop&w=1600&q=80',
  hum3:
    'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1600&q=80',
  hum4:
    'https://images.unsplash.com/photo-1480044965905-02098d419e00?auto=format&fit=crop&w=1600&q=80',
  hum5:
    'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1600&q=80',
  car1:
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
  car2:
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  car3:
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80',
  car4:
    'https://images.unsplash.com/photo-1542362567-b07e54370788?auto=format&fit=crop&w=1600&q=80',
  car5:
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
}

function cid(prefix = 'cmp') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function node(type, props = {}, style = {}, children = []) {
  return { id: cid(type), type, props, style, children }
}

function heading(copy, style = {}) {
  return node('heading', { text: copy }, {
    fontSize: '42px',
    color: '#0f172a',
    textAlign: 'left',
    margin: '0 0 16px 0',
    width: '100%',
    lineHeight: '1.15',
    ...style,
  })
}

function text(copy, style = {}) {
  return node('text', { text: copy }, {
    fontSize: '16px',
    color: '#57534e',
    textAlign: 'left',
    margin: '0 0 18px 0',
    width: '100%',
    lineHeight: '1.7',
    ...style,
  })
}

function eyebrow(copy, color) {
  return text(copy, {
    fontSize: '12px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color,
    margin: '0 0 10px 0',
    fontWeight: '600',
  })
}

function image(src, style = {}, alt = '') {
  return node('image', { src, alt, align: 'left' }, {
    width: '100%',
    maxWidth: '100%',
    borderRadius: '18px',
    ...style,
  })
}

function button(label, pageId, style = {}) {
  return node('button', { text: label, linkType: 'page', href: '#', pageId }, {
    background: '#0f172a',
    color: '#ffffff',
    fontSize: '14px',
    padding: '14px 26px',
    borderRadius: '999px',
    margin: '0 12px 12px 0',
    display: 'inline-block',
    ...style,
  })
}

function spacer(height = '32px') {
  return node('spacer', {}, { height, width: '100%' })
}

function divider(color = '#e7e5e4') {
  return node('divider', {}, {
    borderColor: color,
    borderWidth: '1px',
    margin: '28px 0',
    width: '100%',
  })
}

function container(children, style = {}) {
  return node('container', {}, {
    background: 'transparent',
    padding: '0',
    width: '100%',
    maxWidth: '1120px',
    horizontalAlign: 'center',
    ...style,
  }, children)
}

/** Full-bleed section band */
function band(children, style = {}) {
  return node('container', {}, {
    width: '100%',
    maxWidth: '100%',
    horizontalAlign: 'center',
    padding: '0',
    ...style,
  }, [
    container(children, { padding: style.innerPad || '0', maxWidth: '1120px' }),
  ])
}

function row(children, style = {}) {
  return node('row', {}, {
    display: 'flex',
    gap: '24px',
    width: '100%',
    alignItems: 'stretch',
    ...style,
  }, children)
}

function column(children, style = {}) {
  return node('column', {}, {
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    minWidth: '0',
    gap: '10px',
    ...style,
  }, children)
}

function card(title, body, style = {}) {
  return node('card', { dataSource: 'static', title, text: body }, {
    background: '#ffffff',
    padding: '26px',
    borderRadius: '18px',
    border: '1px solid #e7e5e4',
    width: '100%',
    color: style.color || '#1c1917',
    ...style,
  })
}

function page(id, name, path, components) {
  return { id, name, path, components }
}

function siteChrome(t, pagesMeta, current, brand) {
  const navButtons = pagesMeta
    .filter((p) => p.id !== current)
    .map((p) => {
      if (t.navStyle === 'sharp') {
        return button(p.name.toUpperCase(), p.id, {
          background: 'transparent',
          color: t.muted,
          border: `1px solid ${t.line}`,
          borderRadius: t.btnRadius,
          padding: '10px 14px',
          fontSize: '11px',
          letterSpacing: '0.14em',
          margin: '0 8px 8px 0',
        })
      }
      if (t.navStyle === 'pill') {
        return button(p.name, p.id, {
          background: t.card,
          color: t.accentDeep,
          border: `2px solid ${t.line}`,
          borderRadius: t.btnRadius,
          padding: '10px 16px',
          fontSize: '13px',
          margin: '0 8px 8px 0',
        })
      }
      return button(p.name, p.id, {
        background: t.softAlt,
        color: t.accent,
        border: `1px solid ${t.line}`,
        borderRadius: t.btnRadius,
        padding: '10px 16px',
        fontSize: '13px',
        margin: '0 8px 8px 0',
      })
    })

  return band(
    [
      eyebrow(brand, t.accent),
      heading(pagesMeta.find((p) => p.id === current)?.name || 'Page', {
        fontSize: '22px',
        color: t.ink,
        margin: '0 0 14px 0',
      }),
      row(navButtons, { gap: '4px', flexWrap: 'wrap' }),
      divider(t.line),
    ],
    {
      background: t.soft,
      padding: '22px 0 8px',
      innerPad: '0 24px',
    },
  )
}

function footer(t, ctaPage, ctaLabel) {
  return band(
    [
      spacer('20px'),
      divider(t.line),
      row(
        [
          column([
            heading('Stay with the story', {
              fontSize: '28px',
              color: t.ink,
              margin: '0 0 10px 0',
            }),
            text('Every page is built to feel like a real destination — not a wireframe.', {
              color: t.muted,
              margin: '0',
            }),
          ], { width: '60%' }),
          column([
            button(ctaLabel, ctaPage, {
              background: t.accent,
              color: '#fff',
              borderRadius: t.btnRadius,
              margin: '8px 0 0 0',
            }),
          ], { width: '40%' }),
        ],
        { alignItems: 'center' },
      ),
      spacer('28px'),
    ],
    { background: t.softAlt, padding: '12px 0 8px', innerPad: '0 24px' },
  )
}

function formSection(t, {
  title,
  intro,
  tableId,
  fieldKeys,
  submitLabel,
  successMessage,
}) {
  return band(
    [
      eyebrow('Get involved', t.accent),
      heading(title, { fontSize: '40px', color: t.ink }),
      text(intro, { color: t.muted, maxWidth: '640px' }),
      spacer('8px'),
      node('form', {
        tableId: String(tableId),
        fieldKeys,
        submitLabel,
        successMessage,
        redirectOnSuccess: 'none',
      }, {
        background: t.card,
        padding: '32px',
        borderRadius: t.radius,
        border: `1px solid ${t.line}`,
        width: '100%',
        maxWidth: '680px',
        color: t.ink,
      }),
      spacer('24px'),
    ],
    { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
  )
}

/* -------------------- PANDA: soft editorial nature -------------------- */
function buildPandaPages(tableIds) {
  const t = THEMES.panda
  const pagesMeta = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'about', name: 'About', path: '/about' },
    { id: 'habitats', name: 'Habitats', path: '/habitats' },
    { id: 'conservation', name: 'Conservation', path: '/conservation' },
    { id: 'gallery', name: 'Gallery', path: '/gallery' },
    { id: 'visit', name: 'Visit', path: '/visit' },
    { id: 'adopt', name: 'Adopt', path: '/adopt' },
    { id: 'stories', name: 'Stories', path: '/stories' },
  ]
  const chrome = (id) => siteChrome(t, pagesMeta, id, 'Panda Sanctuary · living archive')

  return [
    page('home', 'Home', '/', [
      chrome('home'),
      band(
        [
          row(
            [
              column([
                eyebrow('Sichuan · bamboo country', t.accent),
                heading('Quiet giants of the misted ridges', {
                  fontSize: t.headingSize,
                  color: t.ink,
                }),
                text(
                  'Panda Sanctuary is a public campus for forest recovery — dens, dawn walks, keeper science, and the soft comedy of bamboo breakfasts. Come for the pandas. Leave with a map of what the mountains still need.',
                  { fontSize: '18px', color: t.muted },
                ),
                button('Enter the sanctuary', 'about', {
                  background: t.accent,
                  borderRadius: t.btnRadius,
                  padding: '16px 28px',
                }),
                button('Plan a visit', 'visit', {
                  background: t.card,
                  color: t.accentDeep,
                  border: `1px solid ${t.line}`,
                  borderRadius: t.btnRadius,
                }),
              ], { width: '46%' }),
              column([
                image(IMG.panda1, { borderRadius: t.radius }, 'Giant panda'),
              ], { width: '54%' }),
            ],
            { alignItems: 'center', gap: '36px' },
          ),
        ],
        { background: t.soft, padding: '36px 0 48px', innerPad: '0 24px' },
      ),
      band(
        [
          eyebrow('Why it matters', t.accent),
          heading('Four truths from the ridge', { fontSize: '36px', color: t.ink }),
          spacer('12px'),
          row([
            column([card('Fewer than 2,000', 'Wild pandas survive in fragmented mountain corridors that still need stitching.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
            column([card('Bamboo clocks', 'Mast flowering can empty a range overnight — recovery is a long game.', {
              background: t.softAlt, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
          ]),
          spacer('16px'),
          row([
            column([card('Soft release', 'Nurseries teach wild manners before animals return to fog and cliff.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
            column([card('Village partners', 'Scholarships and eco-shares keep forests standing beside people.', {
              background: t.softAlt, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
          ]),
          spacer('28px'),
          image(IMG.panda3, { borderRadius: t.radius }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      band(
        [
          row(
            [
              column([
                image(IMG.panda2, { borderRadius: t.radiusSm }),
              ]),
              column([
                eyebrow('This season', t.accent),
                heading('Dawn walks & nursery tours', { fontSize: '34px', color: t.ink }),
                text('Small groups, quiet boots, keepers who know every creak of the bamboo. Book a day on the mountain or sponsor a year of care.'),
                button('Reserve a day', 'visit', { background: t.accentDeep, borderRadius: t.btnRadius }),
                button('Adopt symbolically', 'adopt', {
                  background: 'transparent',
                  color: t.accent,
                  border: `1px solid ${t.accent}`,
                  borderRadius: t.btnRadius,
                }),
              ]),
            ],
            { alignItems: 'center', gap: '32px' },
          ),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'stories', 'Read keeper stories'),
    ]),

    page('about', 'About', '/about', [
      chrome('about'),
      band(
        [
          eyebrow('Our origin', t.accent),
          heading('Born as a field station. Grown into a public home.', {
            fontSize: '46px', color: t.ink,
          }),
          text(
            'We started with radio collars and rice dinners. Today the campus holds dens, a research loft, village classrooms, and trails designed so visitors leave knowing what bamboo forests need next — not just a photo.',
            { fontSize: '18px', color: t.muted },
          ),
          spacer('20px'),
          row([
            column([image(IMG.panda4, { borderRadius: t.radius })]),
            column([
              card('Mission', 'Reconnect corridors, train keepers, and tell honest recovery stories.', {
                background: t.card, borderRadius: t.radiusSm, marginBottom: '14px',
              }),
              card('Method', 'Science in the open — phenology, genetics, and community led patrols.', {
                background: t.softAlt, borderRadius: t.radiusSm, marginBottom: '14px',
              }),
              card('Promise', 'No fairy tales. Numbers rise when neighbors win too.', {
                background: t.card, borderRadius: t.radiusSm,
              }),
            ]),
          ]),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      band(
        [
          heading('A day on campus', { fontSize: '34px', color: t.ink }),
          text('Morning fog walks, midday nursery observation, afternoon village tea with rangers.'),
          spacer('12px'),
          image(IMG.panda5, { borderRadius: t.radius }),
          spacer('20px'),
          button('See habitats', 'habitats', { background: t.accent, borderRadius: t.btnRadius }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'conservation', 'Explore conservation'),
    ]),

    page('habitats', 'Habitats', '/habitats', [
      chrome('habitats'),
      band(
        [
          eyebrow('Where they live', t.accent),
          heading('Bamboo is architecture', { fontSize: '46px', color: t.ink }),
          text('Altitude, moisture, and quiet decide everything. These landscapes are mosaics — not postcards.'),
          spacer('16px'),
          row([
            column([
              image(IMG.panda4, { borderRadius: t.radiusSm }),
              spacer('12px'),
              card('Cloud forests', 'Cool slopes where arrow bamboo thrives and dens stay dry through monsoon.', {
                background: t.card, borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.panda5, { borderRadius: t.radiusSm }),
              spacer('12px'),
              card('Valley nurseries', 'Protected dens for cubs through the first fragile winters.', {
                background: t.card, borderRadius: t.radiusSm,
              }),
            ]),
          ]),
          spacer('24px'),
          row([
            column([
              image(IMG.panda2, { borderRadius: t.radiusSm }),
              spacer('12px'),
              card('Ridge corridors', 'Narrow green bridges that keep genetics flowing between populations.', {
                background: t.softAlt, borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.panda1, { borderRadius: t.radiusSm }),
              spacer('12px'),
              card('River edges', 'Cooling water and soft soils for night foraging routes.', {
                background: t.softAlt, borderRadius: t.radiusSm,
              }),
            ]),
          ]),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'gallery', 'Open the gallery'),
    ]),

    page('conservation', 'Conservation', '/conservation', [
      chrome('conservation'),
      band(
        [
          eyebrow('Impact', t.accent),
          heading('Conservation that compounds', { fontSize: '46px', color: t.ink }),
          text('Corridors, anti-snare patrols, and livelihood swaps — the unglamorous work that keeps forests standing.'),
          spacer('18px'),
          row([
            column([card('Land', 'Lease and restore strips that reconnect isolated groups.', {
              background: t.card, borderRadius: t.radius, padding: '32px',
            })]),
            column([card('Science', 'Open GPS and bamboo datasets for partner labs.', {
              background: t.softAlt, borderRadius: t.radius, padding: '32px',
            })]),
            column([card('People', 'Scholarships and tourism shares for ridge villages.', {
              background: t.card, borderRadius: t.radius, padding: '32px',
            })], { width: '33%' }),
          ]),
          spacer('28px'),
          image(IMG.panda3, { borderRadius: t.radius }),
          spacer('20px'),
          text('Support arrives as trail fees, adoptions, and research residencies — every path funds another hectare.'),
          button('Adopt a panda', 'adopt', { background: t.accentDeep, borderRadius: t.btnRadius }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'visit', 'Visit the campus'),
    ]),

    page('gallery', 'Gallery', '/gallery', [
      chrome('gallery'),
      band(
        [
          eyebrow('Field notes in pictures', t.accent),
          heading('A slower kind of looking', { fontSize: '44px', color: t.ink }),
          text('Moments from dens, dawn patrols, and the soft chaos of nursery play.'),
          spacer('16px'),
          row([
            column([image(IMG.panda1, { borderRadius: t.radiusSm })]),
            column([image(IMG.panda2, { borderRadius: t.radiusSm })]),
          ]),
          spacer('16px'),
          row([
            column([image(IMG.panda3, { borderRadius: t.radiusSm })]),
            column([image(IMG.panda4, { borderRadius: t.radiusSm })]),
          ]),
          spacer('16px'),
          image(IMG.panda5, { borderRadius: t.radius }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'stories', 'Read the stories'),
    ]),

    page('visit', 'Visit', '/visit', [
      chrome('visit'),
      band(
        [
          row(
            [
              column([
                eyebrow('Come quietly', t.accent),
                heading('Reserve a sanctuary day', { fontSize: '42px', color: t.ink }),
                text('Dawn walks or nursery tours. We reply within one business day with trail notes, weather, and packing tips.'),
                image(IMG.panda5, { borderRadius: t.radiusSm }),
              ]),
              column([
                node('form', {
                  tableId: String(tableIds.visits),
                  fieldKeys: 'name,email,date,partySize,notes',
                  submitLabel: 'Request visit',
                  successMessage: 'Thanks — a keeper coordinator will confirm your slot.',
                  redirectOnSuccess: 'none',
                }, {
                  background: t.card,
                  padding: '28px',
                  borderRadius: t.radius,
                  border: `1px solid ${t.line}`,
                  width: '100%',
                }),
              ]),
            ],
            { gap: '32px', alignItems: 'flex-start' },
          ),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'adopt', 'Or adopt instead'),
    ]),

    page('adopt', 'Adopt', '/adopt', [
      chrome('adopt'),
      formSection(t, {
        title: 'Symbolic adoption',
        intro: 'Sponsor a named panda’s care for a year. Seasonal letters, a digital certificate, and a clear ledger of where funds go.',
        tableId: tableIds.adoptions,
        fieldKeys: 'name,email,pandaName,tier,message',
        submitLabel: 'Start adoption',
        successMessage: 'Adoption request received — welcome to the bamboo circle.',
      }),
      band(
        [
          row([
            column([card('Seed tier', 'Quarterly updates + certificate.', { background: t.card, borderRadius: t.radiusSm })]),
            column([card('Grove tier', 'Plus a private virtual keeper call.', { background: t.softAlt, borderRadius: t.radiusSm })]),
          ]),
        ],
        { background: t.softAlt, padding: '32px 0', innerPad: '0 24px' },
      ),
      footer(t, 'home', 'Back to home'),
    ]),

    page('stories', 'Stories', '/stories', [
      chrome('stories'),
      band(
        [
          eyebrow('From the loft', t.accent),
          heading('Keeper stories', { fontSize: '44px', color: t.ink }),
          text('Short field notes from people who know every creak of the bamboo.'),
          spacer('12px'),
          node('list', {
            dataSource: 'api',
            tableId: String(tableIds.stories),
            itemField: 'title',
          }, {
            width: '100%',
            padding: '20px 24px',
            background: t.card,
            borderRadius: t.radiusSm,
            border: `1px solid ${t.line}`,
            color: t.ink,
          }),
          spacer('20px'),
          node('table', {
            dataSource: 'api',
            tableId: String(tableIds.stories),
            columns: 'title,author,season',
          }, { width: '100%', background: t.card, borderRadius: t.radiusSm, padding: '12px' }),
          spacer('24px'),
          image(IMG.panda1, { borderRadius: t.radius }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'visit', 'Visit after reading'),
    ]),
  ]
}

/* -------------------- HUMMINGBIRD: bright kinetic -------------------- */
function buildHummingPages(tableIds) {
  const t = THEMES.humming
  const pagesMeta = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'species', name: 'Species', path: '/species' },
    { id: 'migration', name: 'Migration', path: '/migration' },
    { id: 'garden', name: 'Garden', path: '/garden' },
    { id: 'photo', name: 'Photo', path: '/photo' },
    { id: 'feeders', name: 'Feeders', path: '/feeders' },
    { id: 'sighting', name: 'Sighting', path: '/sighting' },
    { id: 'join', name: 'Join', path: '/join' },
  ]
  const chrome = (id) => siteChrome(t, pagesMeta, id, 'Hummingbird Haven · nectar network')

  return [
    page('home', 'Home', '/', [
      chrome('home'),
      band(
        [
          row(
            [
              column([
                eyebrow('Citizen science + color', t.accent),
                heading('Iridescence at wingbeat speed', {
                  fontSize: t.headingSize,
                  color: t.ink,
                }),
                text(
                  'A living field guide for hummingbirds — species maps, bloom calendars, feeder science, and a public sighting wall that updates with every flash of turquoise.',
                  { fontSize: '18px', color: t.muted },
                ),
                button('Meet the species', 'species', {
                  background: t.accent,
                  borderRadius: t.btnRadius,
                  padding: '16px 26px',
                }),
                button('Log a sighting', 'sighting', {
                  background: t.accentDeep,
                  borderRadius: t.btnRadius,
                }),
              ], { width: '48%' }),
              column([
                image(IMG.hum1, { borderRadius: t.radius, border: `4px solid ${t.line}` }),
              ], { width: '52%' }),
            ],
            { alignItems: 'center', gap: '28px' },
          ),
        ],
        { background: t.heroBg, padding: '40px 0 52px', innerPad: '0 24px' },
      ),
      band(
        [
          heading('Hover physics & nectar routes', { fontSize: '36px', color: t.ink }),
          spacer('10px'),
          row([
            column([card('50+ beats / sec', 'Wings trace a figure-eight so they can pause mid-air like living drones.', {
              background: '#ccfbf1', borderRadius: t.radiusSm, border: 'none',
            })]),
            column([card('Bloom calendars', 'We publish when salvia, penstemon, and trumpet vine peak on your route.', {
              background: '#ffedd5', borderRadius: t.radiusSm, border: 'none',
            })]),
            column([card('Feeder ethics', '1:4 sugar, no dye, scrub weekly — tiny rules, huge survival impact.', {
              background: '#fce7f3', borderRadius: t.radiusSm, border: 'none',
            })], { width: '33%' }),
          ]),
          spacer('28px'),
          image(IMG.hum2, { borderRadius: t.radius }),
        ],
        { background: '#ffffff', padding: t.sectionPad, innerPad: '0 24px' },
      ),
      band(
        [
          row(
            [
              column([
                eyebrow('This week', t.accent),
                heading('Garden with the blur in mind', { fontSize: '34px', color: t.ink }),
                text('Layer tubular natives, skip pesticides, and leave a shallow drip bath. Then tell us what showed up.'),
                button('Garden guide', 'garden', { background: t.accentDeep, borderRadius: t.btnRadius }),
                button('Join volunteers', 'join', { background: t.accent, borderRadius: t.btnRadius }),
              ]),
              column([image(IMG.hum5, { borderRadius: t.radiusSm })]),
            ],
            { alignItems: 'center' },
          ),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'photo', 'Photography tips'),
    ]),

    page('species', 'Species', '/species', [
      chrome('species'),
      band(
        [
          eyebrow('Field portraits', t.accent),
          heading('Signature hummingbirds', { fontSize: '44px', color: t.ink }),
          text('Know the flash before you name it — gorget color, route, and temperament.'),
          spacer('16px'),
          row([
            column([
              image(IMG.hum1, { borderRadius: t.radiusSm }),
              spacer('10px'),
              card('Ruby-throated', 'Atlantic flyway jewel — fierce at feeders, gone by frost.', {
                background: '#ccfbf1', border: 'none', borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.hum3, { borderRadius: t.radiusSm }),
              spacer('10px'),
              card('Anna’s', 'Year-round coastal resident with a rose-pink flare.', {
                background: '#ffedd5', border: 'none', borderRadius: t.radiusSm,
              }),
            ]),
          ]),
          spacer('18px'),
          row([
            column([
              image(IMG.hum4, { borderRadius: t.radiusSm }),
              spacer('10px'),
              card('Rufous', 'Long-haul migrant with a temper to match the mileage.', {
                background: '#fce7f3', border: 'none', borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.hum5, { borderRadius: t.radiusSm }),
              spacer('10px'),
              card('Broad-billed', 'Desert washes that flash turquoise each spring.', {
                background: '#e0e7ff', border: 'none', borderRadius: t.radiusSm,
              }),
            ]),
          ]),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'migration', 'Follow migration'),
    ]),

    page('migration', 'Migration', '/migration', [
      chrome('migration'),
      band(
        [
          heading('Sky rivers of nectar', { fontSize: '44px', color: t.ink }),
          text('From Mexico to Canada, hummingbirds surf bloom pulses. Lawn monocultures and late freezes decide who arrives.'),
          spacer('16px'),
          image(IMG.hum2, { borderRadius: t.radius }),
          spacer('20px'),
          row([
            column([card('Spring push', 'Gulf crossings timed to early blooms and warm fronts.', {
              background: t.card, borderRadius: t.radiusSm, border: `2px solid ${t.line}`,
            })]),
            column([card('Fall fuel', 'Insects plus sugar water — migration is a calorie problem.', {
              background: t.softAlt, borderRadius: t.radiusSm, border: `2px solid #fed7aa`,
            })]),
          ]),
          spacer('20px'),
          button('Report what you see', 'sighting', { background: t.accent, borderRadius: t.btnRadius }),
        ],
        { background: '#ffffff', padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'feeders', 'Feeder checklist'),
    ]),

    page('garden', 'Garden', '/garden', [
      chrome('garden'),
      band(
        [
          eyebrow('Plant lists that work', t.accentDeep),
          heading('Plant for the blur', { fontSize: '44px', color: t.ink }),
          text('Tubular blooms, staggered seasons, no pesticides, and a drip bath in shade.'),
          spacer('14px'),
          row([
            column([card('Salvia & penstemon', 'Reliable nectar from spring into frost — the backbone bed.', {
              background: '#ccfbf1', border: 'none', borderRadius: t.radius, padding: '30px',
            })]),
            column([card('Native vines', 'Trumpet creeper and coral honeysuckle for vertical fuel.', {
              background: '#ffedd5', border: 'none', borderRadius: t.radius, padding: '30px',
            })]),
          ]),
          spacer('18px'),
          image(IMG.hum5, { borderRadius: t.radius }),
          spacer('16px'),
          card('Layout tip', 'Cluster three feeder-adjacent beds instead of one lonely pot — birds prefer circuits.', {
            background: '#fce7f3', border: 'none', borderRadius: t.radiusSm,
          }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'join', 'Volunteer in the garden'),
    ]),

    page('photo', 'Photo', '/photo', [
      chrome('photo'),
      band(
        [
          heading('Photographing light itself', { fontSize: '44px', color: t.ink }),
          text('High shutter, backlight the gorget, wait for the hover pause. Miss a hundred, keep three.'),
          spacer('14px'),
          row([
            column([image(IMG.hum1, { borderRadius: t.radiusSm })]),
            column([image(IMG.hum3, { borderRadius: t.radiusSm })]),
          ]),
          spacer('14px'),
          row([
            column([image(IMG.hum4, { borderRadius: t.radiusSm })]),
            column([image(IMG.hum2, { borderRadius: t.radiusSm })]),
          ]),
          spacer('18px'),
          card('Settings cheat', '1/2000s+, continuous AF, slight overexposure so feathers don’t crush to black.', {
            background: t.softAlt, border: 'none', borderRadius: t.radiusSm,
          }),
        ],
        { background: '#ffffff', padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'sighting', 'Share a sighting'),
    ]),

    page('feeders', 'Feeders', '/feeders', [
      chrome('feeders'),
      band(
        [
          heading('Clean nectar, happy birds', { fontSize: '42px', color: t.ink }),
          text('1:4 white sugar to water. No honey. No dye. Scrub weekly. Shade the bottle.'),
          spacer('14px'),
          row([
            column([card('Many small > one giant', 'Multiple stations reduce territorial wars at the spout.', {
              background: '#ccfbf1', border: 'none', borderRadius: t.radiusSm,
            })]),
            column([card('Near cover', 'Place within a short dash of shrubs so birds can flee hawks.', {
              background: '#ffedd5', border: 'none', borderRadius: t.radiusSm,
            })]),
          ]),
          spacer('18px'),
          image(IMG.hum4, { borderRadius: t.radius }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'garden', 'Build the garden'),
    ]),

    page('sighting', 'Sighting', '/sighting', [
      chrome('sighting'),
      band(
        [
          row(
            [
              column([
                eyebrow('Field desk', t.accent),
                heading('Report a sighting', { fontSize: '40px', color: t.ink }),
                text('Help map seasonal pulses. Species guesses welcome — location and date matter most.'),
                image(IMG.hum3, { borderRadius: t.radiusSm }),
              ]),
              column([
                node('form', {
                  tableId: String(tableIds.sightings),
                  fieldKeys: 'name,email,species,location,date,notes',
                  submitLabel: 'Submit sighting',
                  successMessage: 'Sighting logged — thank you, field partner.',
                  redirectOnSuccess: 'none',
                }, {
                  background: t.card,
                  padding: '28px',
                  borderRadius: t.radius,
                  border: `2px solid ${t.line}`,
                  width: '100%',
                }),
              ]),
            ],
            { gap: '28px' },
          ),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'join', 'Join the network'),
    ]),

    page('join', 'Join', '/join', [
      chrome('join'),
      formSection(t, {
        title: 'Join the nectar network',
        intro: 'Garden days, school talks, migration alerts — pick what fits your week.',
        tableId: tableIds.volunteers,
        fieldKeys: 'name,email,city,interest,availability',
        submitLabel: 'Join us',
        successMessage: 'You’re on the list — watch for a welcome note.',
      }),
      band(
        [
          heading('Recent sightings', { fontSize: '32px', color: t.ink }),
          spacer('10px'),
          node('card', {
            dataSource: 'api',
            tableId: String(tableIds.sightings),
            titleField: 'species',
            textField: 'location',
          }, { width: '100%' }),
        ],
        { background: '#ffffff', padding: '36px 0', innerPad: '0 24px' },
      ),
      footer(t, 'home', 'Back to home'),
    ]),
  ]
}

/* -------------------- CARS: dark luxury automotive -------------------- */
function buildCarPages(tableIds) {
  const t = THEMES.car
  const darkCard = (title, body, style = {}) =>
    card(title, body, {
      background: t.card,
      color: t.ink,
      border: `1px solid ${t.line}`,
      borderRadius: t.radiusSm,
      ...style,
    })
  const pagesMeta = [
    { id: 'home', name: 'Home', path: '/' },
    { id: 'models', name: 'Models', path: '/models' },
    { id: 'electric', name: 'Electric', path: '/electric' },
    { id: 'performance', name: 'Performance', path: '/performance' },
    { id: 'showroom', name: 'Showroom', path: '/showroom' },
    { id: 'testdrive', name: 'Test drive', path: '/test-drive' },
    { id: 'service', name: 'Service', path: '/service' },
    { id: 'about', name: 'About', path: '/about' },
  ]
  const chrome = (id) => siteChrome(t, pagesMeta, id, 'Apex Motors · private atelier')

  return [
    page('home', 'Home', '/', [
      chrome('home'),
      band(
        [
          row(
            [
              column([
                eyebrow('Limited volumes · obsessive finish', t.accent),
                heading('Drive the silhouette', {
                  fontSize: t.headingSize,
                  color: t.ink,
                  letterSpacing: '-0.02em',
                }),
                text(
                  'Apex is an independent house for performance and electric machines — configure under daylight LEDs, book a specialist drive, meet the shop floor that knows every chassis number.',
                  { fontSize: '17px', color: t.muted },
                ),
                button('VIEW MODELS', 'models', {
                  background: t.accent,
                  borderRadius: t.btnRadius,
                  padding: '16px 28px',
                  letterSpacing: '0.08em',
                  fontSize: '12px',
                }),
                button('BOOK A DRIVE', 'testdrive', {
                  background: 'transparent',
                  color: t.ink,
                  border: `1px solid ${t.line}`,
                  borderRadius: t.btnRadius,
                  letterSpacing: '0.08em',
                  fontSize: '12px',
                }),
              ], { width: '44%' }),
              column([
                image(IMG.car1, { borderRadius: t.radius }, 'Apex GT'),
              ], { width: '56%' }),
            ],
            { alignItems: 'center', gap: '36px' },
          ),
        ],
        { background: t.soft, padding: '48px 0 56px', innerPad: '0 24px' },
      ),
      band(
        [
          row([
            column([darkCard('Grand Touring', 'Quiet cabins, long legs, evening light on chrome.', {
              background: t.card, color: t.ink, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
            column([darkCard('Track DNA', 'Brake feel and aero that still behave in rain.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })]),
            column([darkCard('Atelier build', 'Small volumes. Technicians on first-name terms with every VIN.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`,
            })], { width: '33%' }),
          ]),
          spacer('32px'),
          image(IMG.car2, { borderRadius: t.radius }),
          spacer('24px'),
          button('SERVICE DESK', 'service', {
            background: t.accentDeep,
            border: `1px solid ${t.line}`,
            borderRadius: t.btnRadius,
            letterSpacing: '0.1em',
            fontSize: '12px',
          }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'showroom', 'Open showroom'),
    ]),

    page('models', 'Models', '/models', [
      chrome('models'),
      band(
        [
          eyebrow('The line', t.accent),
          heading('Four machines. No filler.', { fontSize: '48px', color: t.ink }),
          spacer('18px'),
          row([
            column([
              image(IMG.car1, { borderRadius: t.radiusSm }),
              spacer('12px'),
              darkCard('Apex GT', 'Front-engine grace with modern carbon details.', {
                background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.car3, { borderRadius: t.radiusSm }),
              spacer('12px'),
              darkCard('Apex Pulse', 'Compact electric sprint with city manners.', {
                background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
              }),
            ]),
          ]),
          spacer('18px'),
          row([
            column([
              image(IMG.car4, { borderRadius: t.radiusSm }),
              spacer('12px'),
              darkCard('Apex Ridge', 'All-weather tourer for mountain weekends.', {
                background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
              }),
            ]),
            column([
              image(IMG.car5, { borderRadius: t.radiusSm }),
              spacer('12px'),
              darkCard('Apex Forge', 'Limited run — forged wheels, track package.', {
                background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
              }),
            ]),
          ]),
          spacer('24px'),
          button('BOOK TEST DRIVE', 'testdrive', {
            background: t.accent, borderRadius: t.btnRadius, letterSpacing: '0.1em', fontSize: '12px',
          }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'electric', 'Electric chapter'),
    ]),

    page('electric', 'Electric', '/electric', [
      chrome('electric'),
      band(
        [
          heading('Electrified without the sermon', { fontSize: '46px', color: t.ink }),
          text('Instant torque, honesty-rated range, leather that still smells like leather — not plastic futurism.', {
            color: t.muted, fontSize: '17px',
          }),
          spacer('18px'),
          image(IMG.car3, { borderRadius: t.radius }),
          spacer('22px'),
          row([
            column([darkCard('Charge', '11 kW AC + 180 kW DC curve tuned for real road trips.', {
              background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '30px',
            })]),
            column([darkCard('Regen', 'One-pedal calm in the city; glide mode on the highway.', {
              background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '30px',
            })]),
          ]),
          spacer('20px'),
          button('CONFIGURE PULSE', 'testdrive', {
            background: t.accent, borderRadius: t.btnRadius, letterSpacing: '0.08em', fontSize: '12px',
          }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'performance', 'Performance specs'),
    ]),

    page('performance', 'Performance', '/performance', [
      chrome('performance'),
      band(
        [
          eyebrow('Numbers with manners', t.accent),
          heading('Poetry that still brakes', { fontSize: '46px', color: t.ink }),
          text('We chase lap times only when they improve everyday confidence — sightlines, heat, wet grip.'),
          spacer('16px'),
          row([
            column([darkCard('0–60', '3.4 s in Forge trim with launch control.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`, padding: '32px',
            })]),
            column([darkCard('Chassis', 'Adaptive dampers + mechanical LSD.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`, padding: '32px',
            })]),
            column([darkCard('Aero', 'Active elements that stay quiet on the commute.', {
              background: t.card, borderRadius: t.radiusSm, border: `1px solid ${t.line}`, padding: '32px',
            })], { width: '33%' }),
          ]),
          spacer('24px'),
          image(IMG.car5, { borderRadius: t.radius }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'showroom', 'See inventory'),
    ]),

    page('showroom', 'Showroom', '/showroom', [
      chrome('showroom'),
      band(
        [
          heading('Showroom light', { fontSize: '46px', color: t.ink }),
          text('Walk the floor. Sit the seats. Configure paint under daylight LEDs.', { color: t.muted }),
          spacer('16px'),
          row([
            column([image(IMG.car2, { borderRadius: t.radiusSm })]),
            column([image(IMG.car4, { borderRadius: t.radiusSm })]),
          ]),
          spacer('22px'),
          eyebrow('Live inventory', t.accent),
          node('table', {
            dataSource: 'api',
            tableId: String(tableIds.inventory),
            columns: 'model,trim,color,status',
          }, {
            width: '100%',
            background: t.card,
            borderRadius: t.radiusSm,
            border: `1px solid ${t.line}`,
            padding: '16px',
            color: t.ink,
          }),
        ],
        { background: t.softAlt, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'testdrive', 'Book a drive'),
    ]),

    page('testdrive', 'Test drive', '/test-drive', [
      chrome('testdrive'),
      band(
        [
          row(
            [
              column([
                eyebrow('Specialist routes', t.accent),
                heading('Book a test drive', { fontSize: '42px', color: t.ink }),
                text('Pick a model and day. We confirm duration, route, and insurance notes.', { color: t.muted }),
                image(IMG.car1, { borderRadius: t.radiusSm }),
              ]),
              column([
                node('form', {
                  tableId: String(tableIds.drives),
                  fieldKeys: 'name,email,phone,model,date,notes',
                  submitLabel: 'Request drive',
                  successMessage: 'Request received — expect a call within 24 hours.',
                  redirectOnSuccess: 'none',
                }, {
                  background: t.card,
                  padding: '28px',
                  borderRadius: t.radiusSm,
                  border: `1px solid ${t.line}`,
                  width: '100%',
                  color: t.ink,
                }),
              ]),
            ],
            { gap: '32px' },
          ),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'service', 'Need service instead?'),
    ]),

    page('service', 'Service', '/service', [
      chrome('service'),
      formSection(t, {
        title: 'Schedule service',
        intro: 'Maintenance, software, or track prep. Drop-off and loaner options on request.',
        tableId: tableIds.service,
        fieldKeys: 'name,email,vin,serviceType,date,notes',
        submitLabel: 'Book service',
        successMessage: 'Service request logged — the desk will confirm.',
      }),
      band(
        [
          image(IMG.car4, { borderRadius: t.radius }),
          spacer('16px'),
          text('Technicians book by chassis — not by queue ticket. Bring the story of the noise.', {
            color: t.muted,
          }),
        ],
        { background: t.softAlt, padding: '32px 0', innerPad: '0 24px' },
      ),
      footer(t, 'about', 'About Apex'),
    ]),

    page('about', 'About', '/about', [
      chrome('about'),
      band(
        [
          eyebrow('House story', t.accent),
          heading('Built like a private atelier', { fontSize: '48px', color: t.ink }),
          text(
            'Independent. Small volumes. Obsessive finishes. The people on the floor know every chassis number — and they will tell you when a track day is a bad idea.',
            { color: t.muted, fontSize: '17px' },
          ),
          spacer('18px'),
          image(IMG.car1, { borderRadius: t.radius }),
          spacer('22px'),
          row([
            column([darkCard('Design', 'Silhouettes first. Screens second.', {
              background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
            })]),
            column([darkCard('Craft', 'Hand-finished interiors, measured twice.', {
              background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm,
            })]),
          ]),
          spacer('20px'),
          button('MEET THE MODELS', 'models', {
            background: t.accent, borderRadius: t.btnRadius, letterSpacing: '0.1em', fontSize: '12px',
          }),
        ],
        { background: t.soft, padding: t.sectionPad, innerPad: '0 24px' },
      ),
      footer(t, 'home', 'Return home'),
    ]),
  ]
}

async function ensureUser() {
  let user = await User.findOne({ email: EMAIL })
  if (!user) {
    user = await User.create({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      role: 'Developer',
      status: 'Active',
    })
    console.log('Created user', EMAIL)
  } else {
    console.log('Using existing user', EMAIL, user.id)
  }

  await DeveloperProfile.findOneAndUpdate(
    { user: user._id },
    {
      $set: {
        user: user._id,
        displayName: 'Adarsh Pandey',
        title: 'Product designer & builder',
        bio: 'Building visual product experiences on VisualForge — nature, motion, and machines.',
        skills: ['Product design', 'No-code', 'Storytelling'],
        location: 'India',
        contactEmail: EMAIL,
        availableForHire: true,
        website: 'https://visualforge.app',
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
      },
    },
    { upsert: true, returnDocument: 'after' },
  )

  return user
}

async function createTable(projectId, name, fields, records = []) {
  const table = await DataTable.create({ project: projectId, name, fields })
  if (records.length) {
    await TableRecord.insertMany(records.map((data) => ({ table: table._id, data })))
  }
  return table
}

async function wipeOldShowcases(userId) {
  const names = ['Panda Sanctuary', 'Hummingbird Haven', 'Apex Motors']
  const existing = await Project.find({ owner: userId, name: { $in: names } })
  for (const project of existing) {
    const tables = await DataTable.find({ project: project._id }).select('_id')
    const tableIds = tables.map((t) => t._id)
    if (tableIds.length) {
      await TableRecord.deleteMany({ table: { $in: tableIds } })
      await DataTable.deleteMany({ _id: { $in: tableIds } })
    }
    await MarketplaceListing.deleteMany({ project: project._id })
    await Project.deleteOne({ _id: project._id })
  }
  if (existing.length) console.log('Removed previous showcase projects:', existing.length)
}

async function publish(project, user, description, tags, screenshots) {
  return MarketplaceListing.findOneAndUpdate(
    { project: project._id },
    {
      $set: {
        developer: user._id,
        description,
        tags,
        screenshots,
        status: 'Approved',
        reviewedAt: new Date(),
      },
      $unset: { rejectionReason: '' },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )
}

async function seedPanda(user) {
  const project = await Project.create({
    name: 'Panda Sanctuary',
    owner: user._id,
    pages: [page('home', 'Home', '/', [heading('Loading…')])],
  })

  const visits = await createTable(project._id, 'Visit Requests', [
    { key: 'name', label: 'Name', type: 'text', required: true, minLength: 2 },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'date', label: 'Preferred date', type: 'date', required: true },
    { key: 'partySize', label: 'Party size', type: 'number', required: true },
    { key: 'notes', label: 'Notes', type: 'text', required: false },
  ])
  const adoptions = await createTable(project._id, 'Adoptions', [
    { key: 'name', label: 'Name', type: 'text', required: true, minLength: 2 },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'pandaName', label: 'Panda name', type: 'text', required: true },
    { key: 'tier', label: 'Tier', type: 'text', required: true },
    { key: 'message', label: 'Message', type: 'text', required: false },
  ])
  const stories = await createTable(
    project._id,
    'Keeper Stories',
    [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'author', label: 'Author', type: 'text', required: true },
      { key: 'season', label: 'Season', type: 'text', required: true },
    ],
    [
      { title: 'Mei Mei’s first snow', author: 'Keeper Lin', season: 'Winter' },
      { title: 'Bamboo flowering watch', author: 'Dr. Rao', season: 'Spring' },
      { title: 'Night dens after rain', author: 'Keeper Ana', season: 'Monsoon' },
    ],
  )

  project.pages = buildPandaPages({
    visits: visits._id,
    adoptions: adoptions._id,
    stories: stories._id,
  })
  await project.save()

  const listing = await publish(
    project,
    user,
    'Soft editorial panda sanctuary — cream & sage design, multi-section pages, visit & adoption forms, keeper stories.',
    ['nature', 'pandas', 'conservation', 'education'],
    [IMG.panda1, IMG.panda2, IMG.panda3],
  )
  return { project, listing }
}

async function seedHumming(user) {
  const project = await Project.create({
    name: 'Hummingbird Haven',
    owner: user._id,
    pages: [page('home', 'Home', '/', [heading('Loading…')])],
  })

  const sightings = await createTable(
    project._id,
    'Sightings',
    [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'species', label: 'Species', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'notes', label: 'Notes', type: 'text', required: false },
    ],
    [
      {
        name: 'Sam',
        email: 'sam@example.com',
        species: 'Ruby-throated',
        location: 'Austin garden',
        date: '2026-04-12',
        notes: 'Male at salvia',
      },
      {
        name: 'Priya',
        email: 'priya@example.com',
        species: 'Anna’s',
        location: 'Coastal trail',
        date: '2026-05-02',
        notes: 'Hovering near feeder',
      },
    ],
  )
  const volunteers = await createTable(project._id, 'Volunteers', [
    { key: 'name', label: 'Name', type: 'text', required: true, minLength: 2 },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'interest', label: 'Interest', type: 'text', required: true },
    { key: 'availability', label: 'Availability', type: 'text', required: false },
  ])

  project.pages = buildHummingPages({
    sightings: sightings._id,
    volunteers: volunteers._id,
  })
  await project.save()

  const listing = await publish(
    project,
    user,
    'Bright kinetic hummingbird site — teal/coral palette, species & garden pages, sighting and volunteer forms.',
    ['birds', 'nature', 'garden', 'citizen-science'],
    [IMG.hum1, IMG.hum2, IMG.hum3],
  )
  return { project, listing }
}

async function seedCars(user) {
  const project = await Project.create({
    name: 'Apex Motors',
    owner: user._id,
    pages: [page('home', 'Home', '/', [heading('Loading…')])],
  })

  const drives = await createTable(project._id, 'Test Drives', [
    { key: 'name', label: 'Name', type: 'text', required: true, minLength: 2 },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: true },
    { key: 'model', label: 'Model', type: 'text', required: true },
    { key: 'date', label: 'Preferred date', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'text', required: false },
  ])
  const service = await createTable(project._id, 'Service Requests', [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'vin', label: 'VIN', type: 'text', required: true, minLength: 5 },
    { key: 'serviceType', label: 'Service type', type: 'text', required: true },
    { key: 'date', label: 'Preferred date', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'text', required: false },
  ])
  const inventory = await createTable(
    project._id,
    'Showroom Inventory',
    [
      { key: 'model', label: 'Model', type: 'text', required: true },
      { key: 'trim', label: 'Trim', type: 'text', required: true },
      { key: 'color', label: 'Color', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'text', required: true },
    ],
    [
      { model: 'Apex GT', trim: 'Signature', color: 'Graphite', status: 'Available' },
      { model: 'Apex Pulse', trim: 'City', color: 'Pearl', status: 'Demo' },
      { model: 'Apex Forge', trim: 'Track', color: 'Crimson', status: 'Limited' },
      { model: 'Apex Ridge', trim: 'Tour', color: 'Forest', status: 'Available' },
    ],
  )

  project.pages = buildCarPages({
    drives: drives._id,
    service: service._id,
    inventory: inventory._id,
  })
  await project.save()

  const listing = await publish(
    project,
    user,
    'Dark luxury automotive atelier — graphite/red UI, sharp geometry, showroom inventory, test-drive & service booking.',
    ['cars', 'automotive', 'electric', 'showroom'],
    [IMG.car1, IMG.car2, IMG.car5],
  )
  return { project, listing }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing')

  await mongoose.connect(uri)
  console.log('Connected')

  const user = await ensureUser()
  await wipeOldShowcases(user._id)

  const panda = await seedPanda(user)
  console.log('Panda Sanctuary', panda.project.id, 'listing', panda.listing.id)

  const hum = await seedHumming(user)
  console.log('Hummingbird Haven', hum.project.id, 'listing', hum.listing.id)

  const cars = await seedCars(user)
  console.log('Apex Motors', cars.project.id, 'listing', cars.listing.id)

  console.log('\nReseeded with larger, distinctly styled pages.')
  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await mongoose.disconnect()
  } catch {
    /* ignore */
  }
  process.exit(1)
})
