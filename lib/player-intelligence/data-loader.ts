import { prisma } from '@/lib/prisma'

/**
 * PlayerDataLoader — Centralizes all Prisma calls for player intelligence building.
 * 
 * Responsibility: Load player and tournament data so that calculators and builders
 * do not directly call Prisma. Enables easier testing and mocking.
 */

export interface PlayerDataLoader {
  getPlayerById(playerId: string): Promise<any | null>
  getTournamentFields(playerId: string): Promise<any[]>
  getPlayersInTournament(tournamentId: string): Promise<string[]>
}

export class PrismaPlayerDataLoader implements PlayerDataLoader {
  async getPlayerById(playerId: string): Promise<any | null> {
    return await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, firstName: true, lastName: true },
    })
  }

  async getTournamentFields(playerId: string): Promise<any[]> {
    return await prisma.tournamentField.findMany({
      where: { playerId },
      include: {
        tournament: true,
      },
      orderBy: { tournament: { startDate: 'desc' } },
    })
  }

  async getPlayersInTournament(tournamentId: string): Promise<string[]> {
    const fields = await prisma.tournamentField.findMany({
      where: { tournament: { id: tournamentId } },
      distinct: ['playerId'],
      select: { playerId: true },
    })
    return fields.map((f) => f.playerId)
  }
}

export function getPlayerDataLoader(): PlayerDataLoader {
  return new PrismaPlayerDataLoader()
}
