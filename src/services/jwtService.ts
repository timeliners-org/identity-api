// src/services/jwtService.ts
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface TokenPayload {
  userId: string
  email: string
  username: string
  isVerified: boolean
  groups?: string[]
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

class JWTService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key'
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'
  }

  /**
   * Generates an access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry as any,
      issuer: 'identity-server',
      audience: 'client-app'
    })
  }

  /**
   * Generates a refresh token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  /**
   * Generates a complete token pair
   */
  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(payload)
    const refreshToken = this.generateRefreshToken()

    // Refresh Token in der Datenbank speichern
    const expiresAt = new Date()
    expiresAt.setTime(expiresAt.getTime() + this.getRefreshTokenExpiryMs())

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt
      }
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiryMs()
    }
  }

  /**
   * Verifies an access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayload
      return decoded
    } catch (error) {
      return null
    }
  }

  /**
   * Verifies a refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const refreshTokenRecord = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      })

      if (!refreshTokenRecord ||
        refreshTokenRecord.isRevoked ||
        refreshTokenRecord.expiresAt < new Date()) {
        return null
      }

      return {
        userId: refreshTokenRecord.user.id,
        email: refreshTokenRecord.user.email,
        username: refreshTokenRecord.user.username,
        isVerified: refreshTokenRecord.user.isVerified
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Renews a token pair with a valid refresh token
   */
  async refreshTokenPair(refreshToken: string): Promise<TokenPair | null> {
    const payload = await this.verifyRefreshToken(refreshToken)
    if (!payload) {
      return null
    }

    // TODO: Maybe check if the user is still active or has changed important details

    // Alten Refresh Token widerrufen
    await this.revokeRefreshToken(refreshToken)

    // Neues Token-Paar generieren
    return this.generateTokenPair(payload)
  }

  /**
   * Revokes a refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true }
    })
  }

  /**
   * Revokes all refresh tokens of a user
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    })
  }

  /**
   * Cleans up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    })
  }

  /**
   * Helper methods for token validity duration
   */
  private getAccessTokenExpiryMs(): number {
    // 15 minutes in milliseconds
    return 15 * 60 * 1000
  }

  private getRefreshTokenExpiryMs(): number {
    // 7 days in milliseconds
    return 7 * 24 * 60 * 60 * 1000
  }

  /**
   * Validates a user token against the database
   */
  async validateUserToken(token: string): Promise<TokenPayload | null> {
    const payload = this.verifyAccessToken(token)
    if (!payload) {
      return null
    }

    // Check if user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isVerified: true,
        groups: {
          select: {
            group: {
              select: {
                name: true
              }
            }
          }
        },
        isActive: true
      }
    })

    if (user) {
      const groupNames = user.groups.map(group => group.group.name)

      if (
        user.isActive === false ||
        payload.email !== user.email ||
        payload.username !== user.username ||
        payload.isVerified !== user.isVerified ||
        !payload.groups?.every(group => groupNames.includes(group))
      ) {
        return null
      }

      return {
        userId: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        groups: user.groups.map(group => group.group.name)
      }
    } else {
      return null
    }
  }
}

export default new JWTService()
