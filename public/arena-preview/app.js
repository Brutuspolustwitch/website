/**
 * ============================================================
 *  app.js — Main Application Logic (Plain JS version)
 * ============================================================
 *  Contains:
 *    1. SVG Icon definitions
 *    2. Live admin offer data
 *    3. Card HTML generation
 *    4. Age gate + flip + click handlers
 * ============================================================
 */

/* ==========================================================
 *  1. SVG ICONS (replacing Lucide React)
 * ========================================================== */
const ICONS = {
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  gift: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>',
  rotateCw: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
};


/* ==========================================================
 *  2. FRONT STATS LABELS (which 4 stats show on front)
 * ========================================================== */
const FRONT_STATS_LABELS = [
  'Dep. mínimo',
  'Valor do bónus',
  'Rodadas grátis',
  'Tempo de levant.',
];


/* ==========================================================
 *  3. LIVE OFFER DATA
 * ========================================================== */
// Public feed configuration lives on the app.js script tag in index.html.


function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function offerToCard(offer) {
  const color = /^#[0-9a-f]{6}$/i.test(offer.logoBg || '') ? offer.logoBg : '#383838';
  return {
    id: String(offer.id),
    name: String(offer.name || ''),
    headerColor: 'gladiator-header-live',
    statsColor: 'stats-badge-live',
    color,
    logoUrl: safeUrl(offer.logoUrl || offer.bannerUrl),
    logoScale: Math.max(0.5, Math.min(2, Number(offer.logoScale) || 1)),
    tagline: offer.headline || '',
    promoCode: offer.code && offer.code !== '—' ? offer.code : '',
    badgeText: offer.tags?.[0] || offer.badge || '',
    isFeatured: Boolean(offer.featured),
    affiliateLink: safeUrl(offer.url),
    ctaLabel: offer.ctaLabel || 'Registar Agora',
    stats: [
      { label: FRONT_STATS_LABELS[0], value: offer.minDeposit || '—' },
      { label: FRONT_STATS_LABELS[1], value: offer.bonusValue || '—' },
      { label: FRONT_STATS_LABELS[2], value: offer.freeSpins || '—' },
      { label: FRONT_STATS_LABELS[3], value: offer.withdrawTime || '—' },
      { label: 'Cashback', value: offer.cashback },
      { label: 'Licença', value: offer.license },
      { label: 'Estabelecido', value: offer.established },
    ].filter(stat => stat.value),
    backNotes: [offer.headline, ...(Array.isArray(offer.notes) ? offer.notes : []),
      ...(Array.isArray(offer.tags) ? offer.tags : [])].filter(Boolean),
  };
}



/* ==========================================================
 *  4. HELPER — Render card name (LollySpins special branding)
 * ========================================================== */
function renderCardName(name) { return escapeHTML(name); }

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}


/* ==========================================================
 *  5. CARD HTML GENERATOR
 * ========================================================== */
function createCardHTML(card) {
  const frontStats = card.stats
    ? card.stats.filter(s => FRONT_STATS_LABELS.includes(s.label))
    : [];
  const backStats = card.stats
    ? card.stats.filter(s => !FRONT_STATS_LABELS.includes(s.label))
    : [];
  const hasBackFace = !!(card.stats || card.termsAndConditions);
  const badgeClass = card.statsColor || 'stats-badge';
  const logoLargeClass = card.logoSize === 'large' ? ' logo-large' : '';
  const filterStyle = ` style="transform:scale(${card.logoScale});"`;

  /* --- Header content --- */
  let headerInner = '';

  if (card.isFeatured) {
    headerInner += `
      <div class="popular-badge">
        ${ICONS.star}
        <span>POPULAR</span>
      </div>`;
  }

  if (card.badgeText) {
    headerInner += `
      <div class="badge-text">${escapeHTML(card.badgeText)}</div>`;
  }

  if (card.logoUrl) {
    headerInner += `
      <img src="${escapeHTML(card.logoUrl)}" alt="${escapeHTML(card.name)}" class="card-logo${logoLargeClass}"${filterStyle}>`;
  } else {
    headerInner += `
      <h3 class="card-title">${renderCardName(card.name)}</h3>`;
  }

  /* --- Front stats grid --- */
  let frontStatsHTML = '';
  if (frontStats.length > 0) {
    frontStatsHTML = '<div class="stats-grid">';
    frontStats.forEach(stat => {
      frontStatsHTML += `
        <div class="${badgeClass} stat-item">
          <span class="stat-label">${escapeHTML(stat.label)}</span>
          <span class="stat-value">${escapeHTML(stat.value)}</span>
        </div>`;
    });
    frontStatsHTML += '</div>';
  }

  /* --- Tagline (only when no stats) --- */
  let taglineHTML = '';
  if (!card.stats) {
    taglineHTML = `<p class="tagline">${escapeHTML(card.tagline)}</p>`;
  }

  /* --- Perks list --- */
  let perksHTML = '';
  if (card.perks && card.perks.length > 0) {
    perksHTML = '<ul class="perks-list">';
    card.perks.forEach(perk => {
      perksHTML += `<li>${ICONS.check}<span>${escapeHTML(perk)}</span></li>`;
    });
    perksHTML += '</ul>';
  }

  /* --- Promo code box --- */
  let promoFrontHTML = '';
  if (card.promoCode) {
    promoFrontHTML = `
      <div class="code-badge">
        <div class="code-inner">
          <span class="code-label">Código</span>
          <span class="code-value">${escapeHTML(card.promoCode)}</span>
        </div>
        <span class="code-icon">${ICONS.gift}</span>
      </div>`;
  }

  /* --- T&C flip link --- */
  let tcFlipHTML = '';
  if (hasBackFace) {
    tcFlipHTML = `
      <p class="tc-link" data-flip>
        T&C Aplicam-se ${ICONS.rotateCw}
      </p>`;
  }

  /* --- Back body content --- */
  let backBodyHTML = '';

  if (card.stats && card.stats.length > 0) {
    backBodyHTML += '<p class="back-notice">+18 | T&C Apply</p>';

    if (backStats.length > 0) {
      backBodyHTML += '<div class="stats-grid">';
      backStats.forEach(stat => {
        backBodyHTML += `
          <div class="${badgeClass} stat-item">
            <span class="stat-label">${escapeHTML(stat.label)}</span>
            <span class="stat-value">${escapeHTML(stat.value)}</span>
          </div>`;
      });
      backBodyHTML += '</div>';
    }

    if (card.backNotes) {
      card.backNotes.forEach(note => {
        backBodyHTML += `<p class="back-note">• ${escapeHTML(note)}</p>`;
      });
    }

  } else if (card.termsAndConditions && card.termsAndConditions.length > 0) {
    backBodyHTML += '<h4 class="tc-title">Termos e Condições</h4>';
    backBodyHTML += '<ol class="tc-list">';
    card.termsAndConditions.forEach(term => {
      backBodyHTML += `<li>${escapeHTML(term)}</li>`;
    });
    backBodyHTML += '</ol>';

  } else {
    backBodyHTML += `<p class="back-tagline">${escapeHTML(card.tagline)}</p>`;
  }

  /* --- Back promo code --- */
  let promoBackHTML = '';
  if (card.promoCode) {
    promoBackHTML = `
      <div class="code-badge">
        <div class="code-inner">
          <span class="code-label">Código</span>
          <span class="code-value code-value-back">${escapeHTML(card.promoCode)}</span>
        </div>
        <span class="code-icon">${ICONS.gift}</span>
      </div>`;
  }

  /* --- Back header (same as front minus badges) --- */
  let backHeaderInner = '';
  if (card.logoUrl) {
    backHeaderInner = `
      <img src="${escapeHTML(card.logoUrl)}" alt="${escapeHTML(card.name)}" class="card-logo${logoLargeClass}"${filterStyle}>`;
  } else {
    backHeaderInner = `
      <h3 class="card-title">${renderCardName(card.name)}</h3>`;
  }

  /* --- Assemble the full card --- */
  return `
    <div class="card-flip-container" data-id="${escapeHTML(card.id)}" style="--offer-color:${card.color}" data-link="${escapeHTML(card.affiliateLink || '#')}">
      <div class="card-flip-inner">

        <!-- FRONT FACE -->
        <div class="card-flip-front gladiator-card">
          <div class="${card.headerColor} gladiator-header-pattern card-header">
            ${headerInner}
          </div>
          <div class="card-body">
            ${frontStatsHTML}
            ${taglineHTML}
            ${perksHTML}
            <div class="card-bottom">
              ${promoFrontHTML}
              <button class="btn-gladiator register-btn">${escapeHTML(card.ctaLabel)}</button>
              ${tcFlipHTML}
            </div>
          </div>
        </div>

        <!-- BACK FACE -->
        <div class="card-flip-back gladiator-card">
          <button class="close-btn" data-flip>${ICONS.x}</button>
          <div class="${card.headerColor} gladiator-header-pattern card-header">
            ${backHeaderInner}
          </div>
          <div class="card-body-back scrollbar-hidden">
            ${backBodyHTML}
            ${promoBackHTML}
            <div class="card-bottom">
              <a href="${escapeHTML(card.affiliateLink || '#')}" target="_blank" rel="noopener noreferrer"
                 class="btn-gladiator register-btn register-link"
                 onclick="event.stopPropagation();">
                ${escapeHTML(card.ctaLabel)}
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>`;
}


/* ==========================================================
 *  6. INITIALIZATION
 * ========================================================== */

// Preview receives unsaved form values; it never fetches or saves records.
window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.data?.type !== 'arena-offer-preview') return;
  const grid = document.getElementById('preview');
  const flipped = Boolean(grid.querySelector('.card-flipped'));
  grid.innerHTML = createCardHTML(offerToCard(event.data.offer));
  if (flipped) grid.querySelector('.card-flip-inner').classList.add('card-flipped');
});
document.getElementById('preview').addEventListener('click', event => {
  event.preventDefault();
  const trigger = event.target.closest('[data-flip]');
  if (trigger) trigger.closest('.card-flip-container').querySelector('.card-flip-inner').classList.toggle('card-flipped');
});
