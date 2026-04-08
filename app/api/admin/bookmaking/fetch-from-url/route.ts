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
      
      // Wait for odds-related text (works for football, cricket, basketball)
      await page.waitForFunction(() => {
        const text = document.body.innerText
        return text.includes('Full-time result') ||
               text.includes('Winner') ||
               text.includes('Toss winner') ||
               text.includes('To win including overtime') ||
               text.includes('3-way betting')
      }, { timeout: 30000 })

      // Extract teams using stable data-id attribute
      const teams = await page.evaluate(() => {
        let home = '', away = ''
        const teamContainers = Array.from(document.querySelectorAll('[data-id^="competitor-"]'))
        if (teamContainers.length >= 2) {
          const homeContainer = teamContainers[0]
          const awayContainer = teamContainers[1]
          const homeNameEl = homeContainer.querySelector('.EC_HN a, .EC_Ft')
          const awayNameEl = awayContainer.querySelector('.EC_HN a, .EC_Ft')
          home = homeNameEl ? homeNameEl.textContent?.trim() || '' : ''
          away = awayNameEl ? awayNameEl.textContent?.trim() || '' : ''
        }
        // Fallback: use h1
        if (!home || !away) {
          const h1 = document.querySelector('h1')?.textContent?.trim() || ''
          const parts = h1.split(' - ')
          if (parts.length === 2) {
            home = home || parts[0].trim()
            away = away || parts[1].trim()
          } else {
            const path = window.location.pathname
            const match = path.match(/\/([a-z-]+)-([a-z-]+)-\d+$/)
            if (match) {
              home = home || match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              away = away || match[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
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

      // Extract sport and championship from breadcrumb/navigation bar
      const sportData = await page.evaluate(() => {
        let sport = 'Football'
        let championship = ''
        const breadcrumbLinks = Array.from(document.querySelectorAll('.seo-kit_styles_items-1V-RbrKxNFUhL2OA a'))
        for (const link of breadcrumbLinks) {
          const text = link.textContent?.toLowerCase() || ''
          if (text.includes('cricket')) { sport = 'Cricket'; break }
          if (text.includes('football')) { sport = 'Football'; break }
          if (text.includes('tennis')) { sport = 'Tennis'; break }
          if (text.includes('kabaddi')) { sport = 'Kabaddi'; break }
          if (text.includes('basketball')) { sport = 'Basketball'; break }
        }
        if (sport === 'Football') {
          const navDesc = document.querySelector('.modulor_navigation-bar__description__1_102_0')?.textContent?.toLowerCase() || ''
          if (navDesc.includes('cricket')) sport = 'Cricket'
          else if (navDesc.includes('football')) sport = 'Football'
          else if (navDesc.includes('tennis')) sport = 'Tennis'
          else if (navDesc.includes('kabaddi')) sport = 'Kabaddi'
          else if (navDesc.includes('basketball')) sport = 'Basketball'
        }
        const breadcrumbItems = Array.from(document.querySelectorAll('.seo-kit_styles_items-1V-RbrKxNFUhL2OA li'))
        for (let i = breadcrumbItems.length - 2; i >= 0; i--) {
          const text = breadcrumbItems[i]?.textContent?.trim()
          if (text && text.length > 3 && !text.match(/Home|Betting|Odds|Prematch/i)) {
            championship = text
            break
          }
        }
        if (!championship) {
          const desc = document.querySelector('.modulor_navigation-bar__description__1_102_0')?.textContent?.trim()
          if (desc) championship = desc
        }
        return { sport, championship }
      })

      // Extract match time
      const timeData = await page.evaluate(() => {
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
        return startTime
      })

      // Extract odds using text parser (works for all sports)
      const text = await page.evaluate(() => document.body.innerText)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

      const marketKeywords = [
        // Football
        'Full-time result', 'Double chance', 'Both teams to score', 'Correct score',
        'Total', 'Winner', 'Handicap', 'Match winner', 'Result and total',
        'Exact number', 'To qualify', 'Penalty', 'Goal line', 'Corners',
        // Cricket
        'Toss winner', 'Toss and match winner', 'First boundary', 'Ball 1 of match',
        'total runs', 'Innings', 'to score a goal',
        // Basketball
        'To win including overtime', '3-way betting', 'Total', 'Handicap',
        'Cleveland Cavaliers total', 'Atlanta Hawks total', 'Total. Even/Odd',
        'Moneyline', 'Point spread', 'Total points', 'Quarter winner', 'Half winner'
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

      if (outcomesRaw.length === 0) throw new Error('No odds found')

      // Group by market
      const marketsMap = new Map<string, { name: string; odds: number; order: number }[]>()
      outcomesRaw.forEach(item => {
        if (!marketsMap.has(item.market)) marketsMap.set(item.market, [])
        const arr = marketsMap.get(item.market)!
        arr.push({ name: item.name, odds: item.odds, order: arr.length })
      })
      const markets = Array.from(marketsMap.entries()).map(([name, outcomes]) => ({ name, outcomes }))

      // Build result
      const baseUrl = 'https://pm-betting.com'
      const homeImgFull = teams.homeImg ? (teams.homeImg.startsWith('http') ? teams.homeImg : baseUrl + teams.homeImg) : ''
      const awayImgFull = teams.awayImg ? (teams.awayImg.startsWith('http') ? teams.awayImg : baseUrl + teams.awayImg) : ''

      // Take first 5 markets (you can adjust)
      const events = markets.slice(0, 5).map((market, idx) => ({
        name: market.name,
        isFirstFastOption: idx === 0,
        isSecondFastOption: idx === 1,
        outcomes: market.outcomes
      }))

      const result = {
        title: `${teams.homeTeam} vs ${teams.awayTeam}`,
        startTime: timeData,
        category: sportData.sport,
        teams: [
          { name: teams.homeTeam, image: homeImgFull },
          { name: teams.awayTeam, image: awayImgFull }
        ],
        events,
        bookImage: '',
        description: `${teams.homeTeam} vs ${teams.awayTeam}`,
        championship: sportData.championship,
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