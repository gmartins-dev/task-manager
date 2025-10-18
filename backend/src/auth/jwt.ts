import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env';

export function createAccessToken(user: { id: string; email: string }) {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, { subject: user.id, expiresIn: '15m' });
}

export function createRefreshToken(user: { id: string; tokenVersion: number }) {
  return jwt.sign({ v: user.tokenVersion }, env.JWT_REFRESH_SECRET, {
    subject: user.id,
    expiresIn: '7d',
  });
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie('jid', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('jid', { path: '/auth/refresh' });
}

