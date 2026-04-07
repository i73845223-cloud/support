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
      
      // Wait for either football or cricket market text
      await page.waitForFunction(() => {
        const text = document.body.innerText
        return text.includes('Full-time result') || text.includes('Winner') || text.includes('Toss winner')
      }, { timeout: 30000 })

      // Extract all data
      const pageData = await page.evaluate(() => {
        // ----- Teams -----
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
        
        // ----- Team Images -----
        const imgs = Array.from(document.querySelectorAll('img')).filter(img => img.src.includes('competitors'))
        let homeImg = '', awayImg = ''
        if (imgs.length >= 2) {
          homeImg = imgs[0].src
          awayImg = imgs[1].src
        }

        // ----- Match Time (local, no timezone) -----
        const dateSpan = document.querySelector('[data-testid="prematch-start-date"]')
        const timeSpan = document.querySelector('[data-testid="prematch-start-time"]')
        let startTime = ''
        if (dateSpan && timeSpan) {
          const dateText = dateSpan.textContent?.trim() || ''
          const timeText = timeSpan.textContent?.trim() || ''
          let matchDate = new Date()
          if (dateText.toLowerCase() === 'tomorrow') matchDate.setDate(matchDate.getDate() + 1)
          const [hours, minutes] = timeText.split(':')
          matchDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          const year = matchDate.getFullYear()
          const month = String(matchDate.getMonth() + 1).padStart(2, '0')
          const day = String(matchDate.getDate()).padStart(2, '0')
          const hour = String(matchDate.getHours()).padStart(2, '0')
          const minute = String(matchDate.getMinutes()).padStart(2, '0')
          startTime = `${year}-${month}-${day}T${hour}:${minute}`
        }

        // ----- Sport & Championship -----
        let sport = 'Football'
        let championship = ''
        const breadcrumbItems = Array.from(document.querySelectorAll('.seo-kit_styles_items-1V-RbrKxNFUhL2OA li'))
        for (let i = 0; i < breadcrumbItems.length; i++) {
          const text = breadcrumbItems[i].textContent?.trim() || ''
          const lower = text.toLowerCase()
          if (lower.includes('cricket')) sport = 'Cricket'
          else if (lower.includes('football')) sport = 'Football'
          else if (lower.includes('tennis')) sport = 'Tennis'
          else if (lower.includes('kabaddi')) sport = 'Kabaddi'
          if (text.length > 3 && !text.match(/Home|Betting|Odds|Prematch/i)) championship = text
        }
        if (!championship) {
          const desc = document.querySelector('.modulor_navigation-bar__description__1_102_0')?.textContent?.trim()
          if (desc) championship = desc
        }

        // ----- Odds (text parser that works for both football & cricket) -----
        const text = document.body.innerText
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        
        const marketKeywords = [
          'Full-time result', 'Double chance', 'Both teams to score', 'Correct score',
          'Total', 'Winner', 'Handicap', 'Match winner', 'Result and total',
          'Exact number', 'To qualify', 'Penalty', 'Goal line', 'Corners',
          'Toss winner', 'Toss and match winner', 'First boundary', 'Ball 1 of match',
          'total runs', 'Innings', 'to score a goal'
        ]
        
        const outcomesRaw: { market: string; name: string; odds: number }[] = []
        let currentMarket = 'General'
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const isMarket = marketKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())) ||
                           (line.length > 5 && line.match(/[A-Za-z]/) && !line.match(/^\d+(\.\d+)?$/))
          if (isMarket) {
            currentMarket = line
            continue
          }
          if (line.match(/^\d+(\.\d+)?$/)) {
            const odds = parseFloat(line)
            if (odds > 0 && odds < 100) {
              if (i+1 < lines.length) {
                const name = lines[i+1]
                if (name && !name.match(/^\d+(\.\d+)?$/)) {
                  outcomesRaw.push({ market: currentMarket, name, odds })
                  i++
                }
              }
            }
          }
        }
        
        // Group by market
        const marketsMap = new Map<string, { name: string; odds: number; order: number }[]>()
        outcomesRaw.forEach((item, idx) => {
          if (!marketsMap.has(item.market)) marketsMap.set(item.market, [])
          const arr = marketsMap.get(item.market)!
          arr.push({ name: item.name, odds: item.odds, order: arr.length })
        })
        
        const markets = Array.from(marketsMap.entries()).map(([name, outcomes]) => ({ name, outcomes }))
        
        return { homeTeam: home, awayTeam: away, homeImg, awayImg, startTime, sport, championship, markets }
      })

      if (pageData.markets.length === 0) throw new Error('No odds found')

      const baseUrl = 'https://pm-betting.com'
      const homeImgFull = pageData.homeImg ? (pageData.homeImg.startsWith('http') ? pageData.homeImg : baseUrl + pageData.homeImg) : ''
      const awayImgFull = pageData.awayImg ? (pageData.awayImg.startsWith('http') ? pageData.awayImg : baseUrl + pageData.awayImg) : ''

      // Take first 3 markets (you can adjust)
      const events = pageData.markets.slice(0, 3).map((market, idx) => ({
        name: market.name,
        isFirstFastOption: idx === 0,
        isSecondFastOption: idx === 1,
        outcomes: market.outcomes
      }))

      const result = {
        title: `${pageData.homeTeam} vs ${pageData.awayTeam}`,
        startTime: pageData.startTime,
        category: pageData.sport,
        teams: [
          { name: pageData.homeTeam, image: homeImgFull },
          { name: pageData.awayTeam, image: awayImgFull }
        ],
        events,
        bookImage: '',
        description: `${pageData.homeTeam} vs ${pageData.awayTeam}`,
        championship: pageData.championship,
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