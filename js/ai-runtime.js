/*
 * Pomocnik Instalatora — konfiguracja AI-first.
 * AI jest podstawowym silnikiem analizy. Parser lokalny działa tylko awaryjnie.
 */

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const AI_ITEM_TYPES = [
  'camera_mount', 'camera_material', 'camera_config', 'junction_box',
  'cable', 'cable_labor', 'drilling', 'remote_view',
  'switch_poe', 'recorder', 'disk', 'rj45_material', 'rj45_labor',
  'wifi_extender', 'router_config', 'wifi_config', 'router_material',
  'network_device', 'wireless_bridge', 'bridge_config', 'mount_material',
  'mount_labor_roof', 'mount_labor_wall', 'auxiliary_materials',
  'surge_protection', 'network_test', 'other_labor', 'other_material', 'unknown'
];

const AI_ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'type', 'name', 'category', 'quantity', 'unit', 'cameraType', 'connectivity',
    'difficulty', 'includeInQuote', 'confidence', 'notes', 'variantId',
    'priceNet', 'priceGross', 'priceCurrency', 'priceSource',
    'priceSourceLabel', 'priceSourceUrl', 'priceConfidence'
  ],
  properties: {
    type: { type: 'string', enum: AI_ITEM_TYPES },
    name: { type: 'string' },
    category: { type: 'string' },
    quantity: { type: 'number' },
    unit: { type: 'string' },
    cameraType: { type: 'string', enum: ['tube', 'dome', 'ptz', 'generic', 'none'] },
    connectivity: { type: 'string', enum: ['poe', 'wifi', 'lte', 'wired', 'wireless_bridge', 'unknown', 'none'] },
    difficulty: { type: 'string', enum: ['easy', 'standard', 'hard', 'unknown'] },
    includeInQuote: { type: 'boolean' },
    confidence: { type: 'number' },
    notes: { type: 'string' },
    variantId: { type: 'string' },
    priceNet: { type: 'number' },
    priceGross: { type: 'number' },
    priceCurrency: { type: 'string' },
    priceSource: { type: 'string', enum: ['local_catalog', 'input_text', 'web', 'estimate', 'none'] },
    priceSourceLabel: { type: 'string' },
    priceSourceUrl: { type: 'string' },
    priceConfidence: { type: 'number' }
  }
};

const AI_PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'documentType', 'analysisSummary', 'client', 'detectedType', 'distanceKm',
    'distanceRate', 'freeKm', 'dateHint', 'items', 'excluded', 'uncertain',
    'warnings', 'facts', 'options', 'variants', 'recommendedVariantId',
    'priceResearchUsed'
  ],
  properties: {
    documentType: {
      type: 'string',
      enum: ['visit_transcript', 'existing_quote', 'quote_review', 'new_quote_proposal', 'mixed_document']
    },
    analysisSummary: { type: 'string' },
    client: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'phone', 'address'],
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' }
      }
    },
    detectedType: {
      type: 'string',
      enum: ['Kamery CCTV', 'Anteny / Sygnał', 'Sieć / Wi‑Fi', 'Domofon', 'Alarm', 'Automatyka bram', 'Przewody / Okablowanie', 'Złącza / Akcesoria', 'Dopłaty / Trudne warunki', 'Serwis', '']
    },
    distanceKm: { type: 'number' },
    distanceRate: { type: 'number' },
    freeKm: { type: 'number' },
    dateHint: { type: 'string' },
    items: { type: 'array', maxItems: 80, items: AI_ITEM_SCHEMA },
    excluded: { type: 'array', maxItems: 30, items: { type: 'string' } },
    uncertain: { type: 'array', maxItems: 40, items: { type: 'string' } },
    warnings: { type: 'array', maxItems: 40, items: { type: 'string' } },
    facts: { type: 'array', maxItems: 40, items: { type: 'string' } },
    options: { type: 'array', maxItems: 30, items: { type: 'string' } },
    variants: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'description', 'recommended', 'totalNet', 'totalGross'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          recommended: { type: 'boolean' },
          totalNet: { type: 'number' },
          totalGross: { type: 'number' }
        }
      }
    },
    recommendedVariantId: { type: 'string' },
    priceResearchUsed: { type: 'boolean' }
  }
};

const AI_MODEL_OPTIONS = [
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini — szybki i dokładny' },
  { value: 'gpt-4.1', label: 'gpt-4.1 — dokładniejszy' },
  { value: 'gpt-5.5', label: 'gpt-5.5 — najmocniejszy' }
];

function normalizeAiCatalogPriceImport(value) {
  const allowed = new Set(['quote_only', 'after_accept', 'automatic']);
  return allowed.has(String(value || '')) ? String(value) : 'after_accept';
}

function fillAiExtraSettings(settings = loadSettings()) {
  if ($('aiParserMode')) $('aiParserMode').value = 'ai';
  if ($('aiUseWebSearch')) $('aiUseWebSearch').checked = settings.aiUseWebSearch !== false;
  if ($('aiCatalogPriceImport')) $('aiCatalogPriceImport').value = normalizeAiCatalogPriceImport(settings.aiCatalogPriceImport);
}

const initForm_before_ai_first = initForm;
initForm = function() {
  initForm_before_ai_first();
  fillAiExtraSettings(loadSettings());
  renderAiParserStatus();
};

const refreshFormAfterBackupImport_before_ai_first = refreshFormAfterBackupImport;
refreshFormAfterBackupImport = function() {
  refreshFormAfterBackupImport_before_ai_first();
  fillAiExtraSettings(loadSettings());
  renderAiParserStatus();
};

const acceptParserPreview_before_ai_prices = acceptParserPreview;
acceptParserPreview = function() {
  if (pendingParse?.result?.parserReport?.parser?.startsWith('OpenAI')) {
    const settings = loadSettings();
    if (normalizeAiCatalogPriceImport(settings.aiCatalogPriceImport) === 'after_accept') {
      const saved = saveAiPricesToCatalog(pendingParse.result.items || []);
      if (saved > 0) pendingParse.result.learnedApplied = [
        ...(pendingParse.result.learnedApplied || []),
        `Do cennika dopisano ${saved} cen rozpoznanych przez AI.`
      ];
    }
  }
  return acceptParserPreview_before_ai_prices();
};

/* Bezpośrednie wywołanie starej funkcji analizy również przechodzi przez AI-first. */
const analyzeVoiceCommandFromField_local_fallback = analyzeVoiceCommandFromField;
analyzeVoiceCommandFromField = function() {
  return analyzeVoiceCommandWithAiFromField();
};

function aiSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || ''), location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

const quoteItemBadgesHtml_before_ai_sources = quoteItemBadgesHtml;
quoteItemBadgesHtml = function(item) {
  const base = quoteItemBadgesHtml_before_ai_sources(item);
  if (item?.parserSource !== 'ai') return base;
  const labels = {
    local_catalog: 'cena: cennik lokalny',
    input_text: 'cena: z tekstu',
    web: 'cena: internet',
    estimate: 'cena: szacunek AI',
    none: 'brak ceny'
  };
  const source = String(item.aiPriceSource || 'none');
  const sourceLabel = labels[source] || labels.none;
  const title = String(item.aiPriceSourceLabel || '').trim();
  const link = aiSafeHttpUrl(item.aiPriceSourceUrl);
  const extra = `<span class="item-badge ai-price-source ${escapeAttr(source)}" title="${escapeAttr(title)}">${escapeHtml(sourceLabel)}</span>` +
    (link ? `<a class="item-badge ai-price-link" href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer">źródło</a>` : '');
  return base.replace('</div>', `${extra}</div>`);
};

const renderParserPreview_before_ai_variants = renderParserPreview;
renderParserPreview = function(raw, result) {
  renderParserPreview_before_ai_variants(raw, result);
  const variants = Array.isArray(result?.aiVariants) ? result.aiVariants : [];
  if (variants.length < 2) return;
  const content = $('parserPreviewContent');
  if (!content) return;
  const selector = document.createElement('section');
  selector.className = 'ai-variant-selector';
  selector.innerHTML = `
    <div>
      <strong>Wariant wyceny</strong>
      <small>AI wykryło kilka logicznych wersji oferty. Wybierz wariant przed zatwierdzeniem.</small>
    </div>
    <div class="ai-variant-buttons">
      ${variants.map(variant => `
        <button type="button" class="btn ${variant.id === result.selectedAiVariantId ? 'btn-primary' : 'btn-soft'}" data-ai-variant="${escapeAttr(variant.id)}">
          ${escapeHtml(variant.name)}${variant.recommended ? ' — rekomendowany' : ''}
        </button>`).join('')}
    </div>`;
  content.prepend(selector);
  selector.querySelectorAll('[data-ai-variant]').forEach(button => {
    button.addEventListener('click', () => {
      if (!pendingParse) return;
      const chosen = pendingParse.result.aiVariants.find(row => row.id === button.dataset.aiVariant);
      if (!chosen) return;
      pendingParse.result.selectedAiVariantId = chosen.id;
      pendingParse.result.items = structuredCloneSafe(chosen.items || []);
      renderParserPreview(pendingParse.raw, pendingParse.result);
      showInfo(`Wybrano wariant: ${chosen.name}. Sprawdź pozycje i ceny przed zatwierdzeniem.`);
    });
  });
};
