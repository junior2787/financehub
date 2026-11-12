import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUsersMap, generateToken, hashPassword, comparePassword, AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

const users = getUsersMap();

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  for (const u of users.values()) if (u.email === email) throw new AppError(409, 'Email já cadastrado');
  const hashed = await hashPassword(password);
  const id = uuidv4();
  const user = { id, email, password: hashed, name };
  users.set(id, user);
  const token = generateToken({ id, email, name });
  res.status(201).json({ user: { id, email, name }, token });
}));

authRouter.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let found: typeof users extends Map<string, infer V> ? V : never;
  for (const u of users.values()) if (u.email === email) { found = u; break; }
  if (!found || !(await comparePassword(password, found.password))) throw new AppError(401, 'Credenciais inválidas');
  const token = generateToken({ id: found.id, email: found.email, name: found.name });
  res.json({ user: { id: found.id, email: found.email, name: found.name }, token });
}));

authRouter.get('/me', asyncHandler(async (req: AuthRequest, res) => {
  const user = users.get(req.user!.id);
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
}));