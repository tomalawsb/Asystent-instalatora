const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const PARSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['client', 'detectedType', 'distanceKm', 'distanceRate', 'freeKm', 'dateHint', 'items', 'excluded', 'uncertain', 'warnings', 'facts', 'options'],
  properties: {
    client: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'phone', 'address'],
      properties: {
        name: { type: 'string', description: 'Imię i nazwisko albo nazwa klienta. Puste, jeśli brak.' },
        phone: { type: 'string', description: 'Numer telefonu. Puste, jeśli brak.' },
        address: { type: 'string', description: 'Adres lub miejscowość montażu. Puste, jeśli brak.' }
      }
    },
    detectedType: {
      type: 'string',
      enum: ['Kamery CCTV', 'Anteny / Sygnał', 'Sieć / Wi‑Fi', 'Domofon', 'Alarm', 'Automatyka bram', 'Przewody / Okablowanie', 'Złącza / Akcesoria', 'Dopłaty / Trudne warunki', 'Serwis', '']
    },
    distanceKm: { type: 'number', description: 'Kilometry dojazdu. 0, jeśli brak.' },
    distanceRate: { type: 'number', description: 'Stawka za km. 0, jeśli brak.' },
    freeKm: { type: 'number', description: 'Darmowe km. -1, jeśli brak.' },
    dateHint: { type: 'string', description: 'Termin z tekstu, np. jutro, piątek, 2026-05-16. Puste, jeśli brak.' },
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
            enum: [
              'camera_mount', 'camera_material', 'junction_box', 'cable', 'cable_labor', 'drilling', 'remote_view',
              'switch_poe', 'recorder', 'disk', 'rj45_material', 'rj45_labor', 'wifi_extender', 'router_config',
              'network_device', 'other_labor', 'other_material', 'unknown'
            ]
          },
          name: { type: 'string', description: 'Krótka nazwa rozpoznanej pozycji. Może być pusta przy typach standardowych.' },
          category: { type: 'string', description: 'Najlepsza kategoria z cennika lub puste.' },
          quantity: { type: 'number', description: 'Ilość. Jeśli brak liczby, wpisz 1 i dodaj ostrzeżenie.' },
          unit: { type: 'string', description: 'szt, mb, usł, godz, pkt albo puste.' },
          cameraType: { type: 'string', enum: ['tube', 'dome', 'ptz', 'generic', 'none'] },
          connectivity: { type: 'string', enum: ['poe', 'wifi', 'lte', 'wired', 'unknown', 'none'] },
          difficulty: { type: 'string', enum: ['easy', 'standard', 'hard', 'unknown'] },
          includeInQuote: { type: 'boolean', description: 'False dla pozycji wykluczonych przez tekst, np. bez rejestratora.' },
          confidence: { type: 'number', description: '0..1 pewności rozpoznania.' },
          notes: { type: 'string', description: 'Krótka notatka, skąd wynika pozycja lub co sprawdzić.' }
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

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configured = String(env.ALLOWED_ORIGIN || '*').split(',').map(x => x.trim()).filter(Boolean);
  const allowOrigin = configured.includes('*') ? '*' : (configured.includes(origin) ? origin : (configured[0] || origin || '*'));
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function jsonResponse(request, env, payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function authorize(request, env) {
  const expected = String(env.PROXY_TOKEN || '').trim();
  if (!expected) return true;
  return request.headers.get('X-Proxy-Token') === expected;
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  const chunks = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (typeof content.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function buildPrompt(text, catalogHints) {
  const hints = Array.isArray(catalogHints) ? catalogHints.slice(0, 8) : [];
  return [
    'TEKST WIZYTY / TRANSkRYPCJA:',
    text,
    '',
    'SKRÓT CENNIKA APLIKACJI, jeśli podano:',
    JSON.stringify(hints).slice(0, 12000)
  ].join('\n');
}

async function parseWithOpenAI(request, env) {
  if (!authorize(request, env)) return jsonResponse(request, env, { ok: false, error: 'Brak dostępu do backendu AI.' }, 401);
  if (!env.OPENAI_API_KEY) return jsonResponse(request, env, { ok: false, error: 'Brakuje OPENAI_API_KEY w backendzie.' }, 500);

  const body = await request.json().catch(() => null);
  const text = String(body?.text || '').trim();
  if (!text) return jsonResponse(request, env, { ok: false, error: 'Brak tekstu do analizy.' }, 400);
  if (text.length > 12000) return jsonResponse(request, env, { ok: false, error: 'Tekst jest za długi. Skróć transkrypcję do najważniejszych informacji.' }, 413);

  const model = String(env.OPENAI_MODEL || 'gpt-4o-mini');
  const openAiPayload = {
    model,
    store: false,
    temperature: 0.1,
    max_output_tokens: 3500,
    input: [
      {
        role: 'system',
        content: [
          'Jesteś precyzyjnym parserem wycen instalatora w Polsce.',
          'Masz zwrócić tylko dane zgodne ze schematem JSON.',
          'Nie licz cen i nie wymyślaj cen. Aplikacja dopasuje ceny lokalnie z cennika.',
          'Rozpoznawaj klienta, adres, telefon, typ zlecenia, pozycje do wyceny i rzeczy wykluczone.',
          'Jeśli tekst mówi „bez rejestratora”, „nie trzeba rejestratora”, „bez dysku” itp., dodaj to do excluded i nie dodawaj tej pozycji do wyceny.',
          'Jeśli tekst mówi o kamerach, dodaj osobno montaż kamer i osobno materiał kamer, chyba że wyraźnie chodzi tylko o robociznę.',
          'Jeśli tekst mówi o przewodzie/kablu i metrach, dodaj osobno materiał cable oraz robociznę cable_labor.',
          'Jeśli ilość jest niepewna, wpisz najlepszą ostrożną ilość i dodaj ostrzeżenie.',
          'Dla zdań typu „wszystkie będą Wi-Fi” ustaw connectivity=wifi dla wszystkich kamer.',
          'Dla „podbitka”, „strych”, „drabina”, „trudne przeciąganie” ustaw difficulty=hard przy prowadzeniu przewodu albo dodaj ostrzeżenie.'
        ].join(' ')
      },
      { role: 'user', content: buildPrompt(text, body?.catalogHints) }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'installer_visit_parse',
        strict: true,
        schema: PARSE_SCHEMA
      }
    }
  };

  const openAiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(openAiPayload)
  });

  const data = await openAiResponse.json().catch(() => ({}));
  if (!openAiResponse.ok) {
    const message = data?.error?.message || `OpenAI HTTP ${openAiResponse.status}`;
    return jsonResponse(request, env, { ok: false, error: message }, openAiResponse.status);
  }

  const outputText = extractOutputText(data);
  let parsed;
  try {
    parsed = JSON.parse(outputText);
  } catch (error) {
    return jsonResponse(request, env, { ok: false, error: 'OpenAI nie zwróciło poprawnego JSON-a.', raw: outputText.slice(0, 1000) }, 502);
  }

  return jsonResponse(request, env, {
    ok: true,
    model: data.model || model,
    usage: data.usage || null,
    result: parsed
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (url.pathname === '/' || url.pathname === '/health') {
      if (!authorize(request, env)) return jsonResponse(request, env, { ok: false, error: 'Brak dostępu do backendu AI.' }, 401);
      return jsonResponse(request, env, {
        ok: true,
        service: 'pomocnik-instalatora-ai-parser',
        model: String(env.OPENAI_MODEL || 'gpt-4o-mini'),
        hasOpenAIKey: !!env.OPENAI_API_KEY
      });
    }
    if (url.pathname === '/parse' && request.method === 'POST') return parseWithOpenAI(request, env);
    return jsonResponse(request, env, { ok: false, error: 'Nie znaleziono endpointu.' }, 404);
  }
};
