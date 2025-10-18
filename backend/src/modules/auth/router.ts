import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { validate } from '../../middlewares/validate';
import { LoginSchema, RegisterSchema } from './schemas';
import { clearRefreshCookie, createAccessToken, createRefreshToken, setRefreshCookie } from '../../auth/jwt';
import { env } from '../../config/env';

export const authRouter = Router();

authRouter.post('/register', validate(RegisterSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body as any;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: { message: 'Email already registered' } });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    const accessToken = createAccessToken({ id: user.id, email: user.email });
    const refreshToken = createRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });
    setRefreshCookie(res, refreshToken);
    return res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: { message: 'Invalid credentials' } });
    const accessToken = createAccessToken({ id: user.id, email: user.email });
    const refreshToken = createRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });
    setRefreshCookie(res, refreshToken);
    return res.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.jid as string | undefined;
  if (!token) return res.status(401).json({ error: { message: 'No refresh token' } });
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; v: number };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.v) {
      return res.status(401).json({ error: { message: 'Invalid refresh token' } });
    }
    // rotate refresh token by incrementing version
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { tokenVersion: { increment: 1 } },
      select: { id: true, email: true, name: true, tokenVersion: true },
    });
    const accessToken = createAccessToken({ id: updated.id, email: updated.email });
    const refreshToken = createRefreshToken({ id: updated.id, tokenVersion: updated.tokenVersion });
    setRefreshCookie(res, refreshToken);
    return res.json({ accessToken, user: { id: updated.id, email: updated.email, name: updated.name } });
  } catch {
    return res.status(401).json({ error: { message: 'Invalid refresh token' } });
  }
});

authRouter.post('/logout', async (_req, res) => {
  clearRefreshCookie(res);
  res.json({ ok: true });
});
