import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.CHAT_MODEL || 'claude-haiku-4-5'

type DemoFacts = {
  brand: string
  web: string
  products: string[]
}

const DEMOS: Record<string, DemoFacts> = {
  praziarnicka: {
    brand: 'Pražiarnička by Caffè Vita',
    web: 'https://praziarnicka.sk/eshop',
    products: [
      'Paganini blend – vyvážený espresso blend, vhodný aj do mlieka',
      'Brazil Santos – jemná 100 % arabica, čokoládová, nízka acidita',
      'Puccini blend – výraznejší blend s hustou krémou',
      'Cuba Serrano Lavado – sladká arabica s kakaom a orechmi',
      'Bezkofeínová Brazil – jemná káva bez kofeínu',
    ],
  },
  diamonds: {
    brand: 'Diamonds Roastery',
    web: 'https://diroastery.sk/kategoria-produktu/kava/',
    products: [
      'Brazília Fazenda Pereira – sladký čokoládový profil',
      'Kongo Kisunga – ovocnejšia výberová káva na filter',
      'Keňa Mugaya AB – svieža a výrazná filtrovaná káva',
      'Kolumbia Kumanday Reserve – jemná sladká káva s citrusovou dochuťou',
      'Kolumbia El Buho Decaf – plná bezkofeínová káva',
    ],
  },
  kaffa: {
    brand: 'Kaffa Roastery',
    web: 'https://kaffaroastery.sk/',
    products: [
      'Mokka Espresso Blend – 80 % arabica a 20 % robusta, espresso a mliečne nápoje',
      'Colombia Quebraditas Peach – moderný ovocný profil',
      'Kenya Kabingara Estate – svieža káva na filter',
      'Costa Rica Hacienda Sonora – sladká a vyvážená',
      'Colombia Finca El Diviso Decaf – výberová bezkofeínová káva',
    ],
  },
  vitazov: {
    brand: 'Káva Víťazov',
    web: 'https://kavavitazov.sk/obchod/',
    products: [
      'Office Blend – silná, menej kyslá káva s vyšším kofeínom',
      'Victory Blend – 100 % arabica signature blend',
      'Brazília – sladká čokoládová arabica',
      'Etiópia – svieža výberová arabica na filter',
      'Bezkofeínová – 100 % arabica bez kofeínu',
    ],
  },
  concept: {
    brand: 'Concept Coffee Roasters',
    web: 'https://www.conceptcoffee.sk/',
    products: [
      'Weithaga AA – Kenya – svieža káva na filter',
      'Nemba – Burundi – sladká a ovocná',
      'Gedicho – Ethiopia – kvetinová a ľahká',
      'Berry Blast – Colombia – výrazný bobuľový profil',
      'Summerjam – Colombia – sladká sezónna káva',
    ],
  },
  jolka: {
    brand: 'Pražiareň Jolka',
    web: 'https://www.praziarenjolka.sk/shop/',
    products: [
      'Zmes Jolka – čokoládová, orechová, nízka acidita, vhodná do mlieka',
      'Zmes Čokoláda – sladký klasický profil',
      'Ethiopia SIDAMO GR.2 – citrus, jazmín a bergamot, light roast',
      'Vietnam Lang Biang Anaerobic Natural – intenzívna ovocná káva',
      'El Salvador SHG EP – vyvážená stredoamerická káva',
    ],
  },
}

function allowCors(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '')
  const allowed =
    origin === '' ||
    /^https:\/\/([a-z0-9-]+\.)?mojchatbot\.sk$/i.test(origin) ||
    /^https:\/\/.*\.vercel\.app$/i.test(origin) ||
    /^https:\/\/danielvendzur-code\.github\.io$/i.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)

  res.setHeader('Access-Control-Allow-Origin', allowed && origin ? origin : 'https://mojchatbot.sk')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Cache-Control', 'no-store')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(req, res)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const demo = DEMOS[String(body.demoId || '')]
    if (!demo) return res.status(400).json({ error: 'Unknown demo' })

    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (message: unknown): message is { role: 'user' | 'assistant'; content: unknown } =>
              Boolean(
                message &&
                  typeof message === 'object' &&
                  ('role' in message) &&
                  ((message as { role?: unknown }).role === 'user' ||
                    (message as { role?: unknown }).role === 'assistant') &&
                  ('content' in message),
              ),
          )
          .slice(-10)
          .map((message: { role: 'user' | 'assistant'; content: unknown }) => ({
            role: message.role,
            content: String(message.content || '').slice(0, 700),
          }))
          .filter((message: { content: string }) => message.content.trim())
      : []

    if (!messages.length || messages.at(-1)?.role !== 'user') {
      return res.status(400).json({ error: 'Missing user message' })
    }

    const system = [
      `Ste stručný online kávový poradca pre ${demo.brand}.`,
      'Odpovedajte po slovensky, prirodzene a maximálne v 2 až 3 krátkych vetách.',
      'Vždy vykajte. Nepoužívajte markdownové odrážky ani vymyslené fakty, ceny, kontakty alebo produkty.',
      'Ak otázku nemožno zodpovedať z údajov nižšie, povedzte to a odporučte chuťový kvíz alebo oficiálny e-shop.',
      'Pri odporúčaní stručne vysvetlite dôvod podľa prípravy, acidity, mlieka alebo kofeínu.',
      `Oficiálny e-shop: ${demo.web}`,
      `Overené produkty:\n- ${demo.products.join('\n- ')}`,
    ].join('\n\n')

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 280,
        temperature: 0.25,
        system,
        messages,
      }),
    })

    if (!apiResponse.ok) {
      const detail = await apiResponse.text()
      console.error('Coffee Anthropic API error', apiResponse.status, detail)
      return res.status(502).json({ error: 'AI unavailable' })
    }

    const data = (await apiResponse.json()) as {
      content?: Array<{ type?: string; text?: string }>
    }
    const reply = Array.isArray(data.content)
      ? data.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text || '')
          .join('')
          .trim()
      : ''

    return res.status(200).json({
      reply: reply || 'Najpresnejšie odporúčanie získate cez krátky výber kávy.',
    })
  } catch (error) {
    console.error('Coffee chat error', error)
    return res.status(500).json({ error: 'Chat failed' })
  }
}
