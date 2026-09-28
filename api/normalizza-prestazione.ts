export const config = { runtime: 'edge' }

// Vercel Edge Function — traduce il testo libero scritto dal paziente
// (anche con errori, dialetto, termini non tecnici) nel codice prestazione
// standard del nostro catalogo, così la Pipeline può incrociarlo subito con
// le strutture candidate invece di partire da zero ogni volta.
//
// Variabili d'ambiente richieste su Vercel:
// - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (già presenti, riusate qui)
// - ANTHROPIC_API_KEY (nuova, SENZA prefisso VITE_ — resta segreta lato server)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string
// Modello veloce ed economico: sufficiente per un compito di classificazione
// su un catalogo di poche decine di voci. Aggiornabile in futuro.
const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest'

interface Prestazione {
  codice: string
  nome: string
  categoria: string | null
  sinonimi: string[]
}

interface Esito {
  codice: string | null
  confidence: 'alta' | 'media' | 'bassa'
  nota: string
}

function withCors(res: Response): Response {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

function json(body: Esito | { error: string }, status = 200): Response {
  return withCors(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  )
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }))
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let testo = ''
  try {
    const body = await request.json()
    testo = String(body?.testo || '').trim()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  if (!testo) {
    return json({ codice: null, confidence: 'bassa', nota: 'testo vuoto' })
  }

  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('normalizza-prestazione: variabili d’ambiente mancanti')
    return json({ codice: null, confidence: 'bassa', nota: 'configurazione server incompleta' })
  }

  try {
    const catalogoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/prestazioni?select=codice,nome,categoria,sinonimi`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    if (!catalogoRes.ok) throw new Error('catalogo prestazioni non raggiungibile')
    const catalogo = (await catalogoRes.json()) as Prestazione[]

    const elenco = catalogo
      .map((p) => `${p.codice} :: ${p.nome}${p.sinonimi?.length ? ' (sinonimi: ' + p.sinonimi.join(', ') + ')' : ''}`)
      .join('\n')

    const prompt = `Sei un assistente che aiuta un operatore sanitario italiano a capire di quale prestazione ha bisogno un paziente, a partire da quello che il paziente ha scritto (anche con errori di battitura, termini dialettali o non tecnici, o scritto da una persona anziana poco pratica di informatica).

Catalogo prestazioni disponibili (codice interno :: nome):
${elenco}

Testo scritto dal paziente:
"""
${testo}
"""

Rispondi SOLO con un oggetto JSON valido, senza nessun altro testo prima o dopo, in questo formato esatto:
{"codice": "<uno dei codici del catalogo sopra, oppure null>", "confidence": "alta" | "media" | "bassa", "nota": "<spiegazione breve in italiano, max 15 parole>"}

Se il testo è ambiguo o non corrisponde chiaramente a nessuna voce del catalogo, restituisci "codice": null con "confidence": "bassa" invece di indovinare a caso.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('Anthropic API error', aiRes.status, errText)
      return json({ codice: null, confidence: 'bassa', nota: 'errore servizio IA' })
    }

    const aiJson = await aiRes.json()
    const rawText: string = aiJson?.content?.[0]?.text ?? ''

    let parsed: { codice: string | null; confidence?: string; nota?: string }
    try {
      const match = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match ? match[0] : rawText)
    } catch {
      console.error('normalizza-prestazione: risposta IA non interpretabile', rawText)
      return json({ codice: null, confidence: 'bassa', nota: 'risposta IA non interpretabile' })
    }

    // Non ci fidiamo ciecamente del modello: il codice deve esistere
    // davvero nel nostro catalogo, altrimenti l'inserimento fallirebbe
    // comunque (foreign key) e avremmo solo un errore meno chiaro.
    const codiceValido = catalogo.some((p) => p.codice === parsed.codice)

    return json({
      codice: codiceValido ? (parsed.codice as string) : null,
      confidence: (parsed.confidence as Esito['confidence']) || 'bassa',
      nota: parsed.nota || '',
    })
  } catch (err) {
    console.error('normalizza-prestazione error', err)
    return json({ codice: null, confidence: 'bassa', nota: 'errore interno' })
  }
}
