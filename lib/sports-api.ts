import axios from 'axios';

interface SportsEvent {
  id: string;
  sport: string;
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  markets: Market[];
  homeTeamImage: string;
  awayTeamImage: string;
  bookImage: string;
}

interface Market {
  name: string;
  outcomes: Outcome[];
}

interface Outcome {
  name: string;
  odds: number;
}

interface MatchResult {
  status: string;
  outcomes: Array<{
    marketName: string;
    winningOutcome: string;
  }>;
}

class SportsDataService {
  private apis = {
    theOddsApi: {
      key: process.env.THE_ODDS_API_KEY,
      baseUrl: 'https://api.the-odds-api.com/v4'
    }
  };

  async getRealEvents(sport: string = 'soccer'): Promise<SportsEvent[]> {
    const apiKey = this.apis.theOddsApi.key;
    
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY not configured');
    }

    try {
      const sportKey = this.mapSportToOddsApi(sport);
      
      if (sport.toLowerCase() === 'kabaddi') {
        return [];
      }
      
      const events = await this.getEventsForSportKey(sportKey);
      return events;
    } catch (error: any) {
      throw new Error(`API Error: ${error.message}`);
    }
  }

  async getMatchResult(bookId: string, homeTeam: string, awayTeam: string, sport: string): Promise<MatchResult | null> {
    try {
      const mockResult = this.generateMockResult(homeTeam, awayTeam, sport);
      return mockResult;
    } catch (error) {
      console.error('Error getting match result:', error);
      return null;
    }
  }

  private generateMockResult(homeTeam: string, awayTeam: string, sport: string): MatchResult {
    const outcomes = [];
    
    const matchWinner = Math.random() > 0.5 ? homeTeam : awayTeam;
    outcomes.push({
      marketName: 'Match Winner',
      winningOutcome: matchWinner
    });

    if (sport === 'soccer' || sport === 'football') {
      const totalGoals = Math.floor(Math.random() * 5);
      const overUnder = totalGoals > 2.5 ? 'Over' : 'Under';
      outcomes.push({
        marketName: 'Over/Under',
        winningOutcome: `${overUnder} 2.5`
      });
    }

    if (sport === 'basketball') {
      const handicap = Math.random() > 0.5 ? homeTeam : awayTeam;
      outcomes.push({
        marketName: 'Handicap',
        winningOutcome: handicap
      });
    }

    return {
      status: 'COMPLETED',
      outcomes
    };
  }

  private mapSportToOddsApi(sport: string): string {
    const mapping: { [key: string]: string } = {
      'cricket': 'cricket',
      'football': 'soccer',
      'soccer': 'soccer',
      'basketball': 'basketball',
      'tennis': 'tennis',
      'baseball': 'baseball',
      'hockey': 'icehockey',
      'rugby': 'rugby',
      'boxing': 'boxing',
      'mma': 'mma',
      'esports': 'esports',
      'kabaddi': 'kabaddi'
    };
    
    return mapping[sport.toLowerCase()] || sport;
  }

  private async getEventsForSportKey(sportKey: string): Promise<SportsEvent[]> {
    const response = await axios.get(
      `${this.apis.theOddsApi.baseUrl}/sports/${sportKey}/odds`,
      {
        params: {
          apiKey: this.apis.theOddsApi.key,
          regions: 'uk,us,eu',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'decimal'
        },
        timeout: 10000
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    return this.transformTheOddsApiData(response.data);
  }

  private transformTheOddsApiData(data: any[]): SportsEvent[] {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = data
      .filter(event => {
        const eventDate = new Date(event.commence_time);
        return eventDate > now && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());

    return upcomingEvents.map((event) => {
      const allMarkets = this.getAllMarketsFromBookmakers(event.bookmakers);
      
      const istTime = this.convertToIST(event.commence_time);
      
      const homeTeamImage = this.getTeamImage(event.home_team, event.sport_key);
      const awayTeamImage = this.getTeamImage(event.away_team, event.sport_key);
      const bookImage = this.getBookImage(event.sport_title, event.sport_key);

      return {
        id: event.id,
        sport: event.sport_key,
        tournament: event.sport_title,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        startTime: istTime,
        markets: allMarkets,
        homeTeamImage,
        awayTeamImage,
        bookImage
      };
    }).filter(event => event.markets.length > 0);
  }

  private getAllMarketsFromBookmakers(bookmakers: any[]): Market[] {
    if (!bookmakers || !Array.isArray(bookmakers)) {
      return [];
    }

    const allMarkets: Market[] = [];
    const seenMarketNames = new Set();

    bookmakers.forEach(bookmaker => {
      if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
        bookmaker.markets.forEach((market: any) => {
          if (market.key.includes('_lay')) return;
          
          const marketName = this.normalizeMarketName(market.key);
          
          if (!seenMarketNames.has(marketName)) {
            seenMarketNames.add(marketName);
            
            const marginedOutcomes = market.outcomes.map((outcome: any) => {
              const trueOdds = outcome.price;
              const marginedOdds = trueOdds * 0.95;
              
              return {
                name: outcome.name,
                odds: parseFloat(marginedOdds.toFixed(2))
              };
            });

            allMarkets.push({
              name: marketName,
              outcomes: marginedOutcomes
            });
          }
        });
      }
    });

    return allMarkets;
  }

  private normalizeMarketName(marketKey: string): string {
    const marketMap: { [key: string]: string } = {
      'h2h': 'Match Winner',
      'spreads': 'Handicap',
      'totals': 'Over/Under'
    };
    return marketMap[marketKey] || marketKey;
  }

  private convertToIST(utcTime: string): string {
    const utcDate = new Date(utcTime);
    const istDate = new Date(utcDate.getTime());
    return istDate.toISOString().slice(0, 16);
  }

  private getTeamImage(teamName: string, sport: string): string {
    return '';
  }

  private getBookImage(tournament: string, sport: string): string {
    return '';
  }
}

export const sportsDataService = new SportsDataService();