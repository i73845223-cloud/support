import { db } from '@/lib/db';
import { sportsDataService } from './sports-api';

class AutoSettlementService {
  async checkAndSettleCompletedBooks() {
    try {
      const booksToCheck = await db.book.findMany({
        where: {
          status: 'ACTIVE',
          date: {
            lte: new Date()
          }
        },
        include: {
          events: {
            include: {
              outcomes: true,
              bets: true
            }
          },
          teams: true
        }
      });

      for (const book of booksToCheck) {
        await this.settleBookIfCompleted(book);
      }

    } catch (error) {
      console.error('Error in auto-settlement service:', error);
    }
  }

  private async settleBookIfCompleted(book: any) {
    try {
      const homeTeam = book.teams[0]?.name;
      const awayTeam = book.teams[1]?.name;
      
      if (!homeTeam || !awayTeam) {
        return;
      }

      const matchResult = await sportsDataService.getMatchResult(
        book.id,
        homeTeam,
        awayTeam,
        book.category.toLowerCase()
      );

      if (!matchResult) {
        return;
      }

      if (matchResult.status === 'COMPLETED') {
        await this.settleBookWithResults(book, matchResult);
      }

    } catch (error) {
      console.error(`Error settling book ${book.id}:`, error);
    }
  }

  private async settleBookWithResults(book: any, matchResult: any) {
    try {
      for (const event of book.events) {
        const winningOutcome = this.findWinningOutcome(event, matchResult);
        
        if (winningOutcome) {
          await this.settleEvent(event.id, winningOutcome.id);
        }
      }

      await db.book.update({
        where: { id: book.id },
        data: { status: 'SETTLED' }
      });

    } catch (error) {
      console.error(`Error in settleBookWithResults for ${book.id}:`, error);
      throw error;
    }
  }

  private findWinningOutcome(event: any, matchResult: any) {
    const marketResult = matchResult.outcomes.find((outcome: any) => 
      outcome.marketName === event.name
    );

    if (!marketResult) {
      return null;
    }

    return event.outcomes.find((outcome: any) => 
      outcome.name === marketResult.winningOutcome
    );
  }

  private async settleEvent(eventId: string, winningOutcomeId: string) {
    try {
      const response = await fetch(`https://support-green-six.vercel.app/api/admin/bookmaking/events/${eventId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winningOutcomeId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to settle event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error settling event ${eventId}:`, error);
      throw error;
    }
  }
}

export const autoSettlementService = new AutoSettlementService();