/* Konfiguracja i podpięcie trybu AI, wykonywane po lokalnych poprawkach. */

/* AI bez backendu: klucz OpenAI zapisywany lokalnie, test klucza i wybór modelu. */
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const AI_PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['client', 'detectedType', 'distanceKm', 'distanceRate', 'freeKm', 'dateHint', 'items', 'excluded', 'uncertain', 'warnings', 'facts', 'options'],
  properties: {
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
    items: {
      type: 'array',
      maxItems: 40,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'category', 'quantity', 'unit', 'cameraType', 'connectivity', 'difficulty', 'includeInQuote', 'confidence', 'notes'],
        properties: {
          type: {
            type: 'string',
            enum: ['camera_mount', 'camera_material', 'junction_box', 'cable', 'cable_labor', 'drilling', 'remote_view', 'switch_poe', 'recorder', 'disk', 'rj45_material', 'rj45_labor', 'wifi_extender', 'router_config', 'network_device', 'other_labor', 'other_material', 'unknown']
          },
          name: { type: 'string' },
          category: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          cameraType: { type: 'string', enum: ['tube', 'dome', 'ptz', 'generic', 'none'] },
          connectivity: { type: 'string', enum: ['poe', 'wifi', 'lte', 'wired', 'unknown', 'none'] },
          difficulty: { type: 'string', enum: ['easy', 'standard', 'hard', 'unknown'] },
          includeInQuote: { type: 'boolean' },
          confidence: { type: 'number' },
          notes: { type: 'string' }
        }
      }
    },
    excluded: { type: 'array', maxItems: 20, items: { type: 'string' } },
    uncertain: { type: 'array', maxItems: 30, items: { type: 'string' } },
    warnings: { type: 'array', maxItems: 30, items: { type: 'string' } },
    facts: { type: 'array', maxItems: 30, items: { type: 'string' } },
    options: { type: 'array', maxItems: 20, items: { type: 'string' } }
  }
};


const AI_MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini — tańszy / szybki' },
  { value: 'gpt-4o', label: 'gpt-4o — dokładniejszy' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini — nowszy mały model' },
  { value: 'gpt-4.1', label: 'gpt-4.1 — mocniejszy model' }
];








const readSettingsFromForm_v37_before_ai = readSettingsFromForm;
readSettingsFromForm = function() {
  return aiReadSettingsFromFormPatch(readSettingsFromForm_v37_before_ai());
};

const initForm_v37_before_ai = initForm;
initForm = function() {
  initForm_v37_before_ai();
  const settings = loadSettings();
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
};

const refreshFormAfterBackupImport_v37_before_ai = refreshFormAfterBackupImport;
refreshFormAfterBackupImport = function() {
  refreshFormAfterBackupImport_v37_before_ai();
  const settings = loadSettings();
  if ($('aiParserMode')) $('aiParserMode').value = settings.aiParserMode || 'local';
  if ($('aiOpenAiKey')) $('aiOpenAiKey').value = settings.aiOpenAiKey || '';
  fillAiModelSelect();
  if ($('aiModel')) $('aiModel').value = normalizeAiModel(settings.aiModel || 'gpt-4o-mini');
  renderAiParserStatus();
};







const analyzeVoiceCommandFromField_v37_local = analyzeVoiceCommandFromField;
analyzeVoiceCommandFromField = function() {
  const settings = loadSettings();
  if (normalizeAiParserMode(settings.aiParserMode) === 'ai') return analyzeVoiceCommandWithAiFromField();
  return analyzeVoiceCommandFromField_v37_local();
};














