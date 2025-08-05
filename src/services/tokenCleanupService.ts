// src/services/tokenCleanupService.ts
import jwtService from '@/services/jwtService'

class TokenCleanupService {
  private intervalId: NodeJS.Timeout | null = null
  private readonly cleanupIntervalMs: number

  constructor() {
    // Cleanup every 24 hours
    this.cleanupIntervalMs = 24 * 60 * 60 * 1000
  }

  /**
   * Starts the automatic cleanup service
   */
  start(): void {
    if (this.intervalId) {
      console.log('Token Cleanup Service is already running')
      return
    }

    console.log('Token Cleanup Service started')

    // Run once immediately
    this.cleanup()

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.cleanup()
    }, this.cleanupIntervalMs)
  }

  /**
   * Stops the cleanup service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Token Cleanup Service stopped')
    }
  }

  /**
   * Performs a manual cleanup
   */
  private async cleanup(): Promise<void> {
    try {
      console.log('Starting token cleanup...')
      await jwtService.cleanupExpiredTokens()
      console.log('Token cleanup completed')
    } catch (error) {
      console.error('Error during token cleanup:', error)
    }
  }
}

export default new TokenCleanupService()
