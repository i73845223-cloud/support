import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || !url.includes('pm-betting.com/en/event')) {
      return NextResponse.json({ error: 'Invalid Parimatch event URL' }, { status: 400 })
    }

    const puppeteer = await import('puppeteer-extra')
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
    puppeteer.default.use(StealthPlugin())

    let browser
    try {
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      })
      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setViewport({ width: 1280, height: 800 })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForFunction(() => document.body.innerText.includes('Full-time result'), { timeout: 30000 })

      // Extract teams from h1
      const teams = await page.evaluate(() => {
        let home = '', away = ''
        const h1 = document.querySelector('h1')?.textContent?.trim() || ''
        const parts = h1.split(' - ')
        if (parts.length === 2) {
          home = parts[0].trim()
          away = parts[1].trim()
        } else {
          const path = window.location.pathname
          const match = path.match(/\/([a-z-]+)-([a-z-]+)-\d+$/)
          if (match) {
            home = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            away = match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
        }
        if (!home) home = 'Home Team'
        if (!away) away = 'Away Team'
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src.includes('competitors'))
        let homeImg = '', awayImg = ''
        if (imgs.length >= 2) {
          homeImg = imgs[0].src
          awayImg = imgs[1].src
        }
        return { homeTeam: home, awayTeam: away, homeImg, awayImg }
      })

      // Extract text and parse correctly
      const text = await page.evaluate(() => document.body.innerText)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      
      // First, identify market titles (they are lines that are not odds and not outcome names)
      // We'll collect all lines that look like market titles (contain keywords, or are not numbers and not too short)
      const marketKeywords = ['Full-time result', 'Double chance', 'Both teams to score', 'Correct score', 'Total', 'Winner', 'Handicap', 'Match winner', 'Result and total', 'Exact number', 'To qualify', 'Penalty', 'Goal line', 'Corners', 'Yellow cards', 'Red cards', 'Shots', 'Fouls', 'Offsides', 'Chennaiyin FC total', 'Inter Kashi FC total', 'Chennaiyin FC to score a goal', 'Inter Kashi FC to score a goal', 'Total. 1st half']
      
      // Parse odds: find numbers and take next line as name
      const outcomesRaw: { market: string; name: string; odds: number }[] = []
      let currentMarket = 'General'
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Check if line is a market title
        const isMarket = marketKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())) ||
                         (line.length > 5 && line.match(/[A-Za-z]/) && !line.match(/^\d+(\.\d+)?$/))
        if (isMarket) {
          currentMarket = line
          continue
        }
        // If line is an odds number
        if (line.match(/^\d+(\.\d+)?$/)) {
          const odds = parseFloat(line)
          if (odds > 0 && odds < 100) {
            // The next line should be the outcome name
            if (i+1 < lines.length) {
              const name = lines[i+1]
              if (name && !name.match(/^\d+(\.\d+)?$/)) {
                outcomesRaw.push({ market: currentMarket, name, odds })
                i++ // skip the name line
                continue
              }
            }
          }
        }
      }
      
      if (outcomesRaw.length === 0) throw new Error('No odds found')
      
      // Group by market
      const marketsMap = new Map<string, { name: string; odds: number; order: number }[]>()
      outcomesRaw.forEach((item, idx) => {
        if (!marketsMap.has(item.market)) marketsMap.set(item.market, [])
        const arr = marketsMap.get(item.market)!
        arr.push({ name: item.name, odds: item.odds, order: arr.length })
      })
      
      const markets = Array.from(marketsMap.entries()).map(([name, outcomes]) => ({ name, outcomes }))
      
      // Build events (first 3 markets)
      const events = markets.slice(0, 3).map((market, idx) => ({
        name: market.name,
        isFirstFastOption: idx === 0,
        isSecondFastOption: idx === 1,
        outcomes: market.outcomes
      }))

      // Prepare result
      const baseUrl = 'https://pm-betting.com'
      const homeImgFull = teams.homeImg ? (teams.homeImg.startsWith('http') ? teams.homeImg : baseUrl + teams.homeImg) : ''
      const awayImgFull = teams.awayImg ? (teams.awayImg.startsWith('http') ? teams.awayImg : baseUrl + teams.awayImg) : ''

      const result = {
        title: `${teams.homeTeam} vs ${teams.awayTeam}`,
        startTime: '',
        category: 'Football',
        teams: [
          { name: teams.homeTeam, image: homeImgFull },
          { name: teams.awayTeam, image: awayImgFull }
        ],
        events,
        bookImage: '',
        description: `${teams.homeTeam} vs ${teams.awayTeam}`,
        championship: '',
        country: ''
      }

      await browser.close()
      return NextResponse.json(result)

    } catch (err: any) {
      if (browser) await browser.close()
      console.error('Scraping error:', err)
      return NextResponse.json({ error: err.message || 'Failed to scrape event' }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}