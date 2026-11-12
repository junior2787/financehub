import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { categorySchema, idParamSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validate.js';

interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  icon: string;
  parentId: string | null;
  createdAt: Date;
}

const categories = new Map<string, Category[]>();

function getUserCategories(userId: string): Category[] {
  return categories.get(userId) || [];
}

export const categoriesRouter = Router();

categoriesRouter.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const cats = getUserCategories(req.user!.id);
  res.json({ categories: cats });
}));

categoriesRouter.post('/', validate(categorySchema), asyncHandler(async (req: AuthRequest, res) => {
  const { name, type, color, icon, parentId } = req.body;
  const userCats = getUserCategories(req.user!.id);
  const cat: Category = { id: uuidv4(), userId: req.user!.id, name, type, color, icon, parentId: parentId || null, createdAt: new Date() };
  userCats.push(cat);
  categories.set(req.user!.id, userCats);
  res.status(201).json({ category: cat });
}));

categoriesRouter.put('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userCats = getUserCategories(req.user!.id);
  const idx = userCats.findIndex(c => c.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Categoria não encontrada');
  const { name, type, color, icon, parentId } = req.body;
  userCats[idx] = { ...userCats[idx], name, type, color, icon, parentId: parentId || null };
  res.json({ category: userCats[idx] });
}));

categoriesRouter.delete('/:id', validate(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userCats = getUserCategories(req.user!.id);
  const idx = userCats.findIndex(c => c.id === req.params.id);
  if (idx === -1) throw new AppError(404, 'Categoria não encontrada');
  userCats.splice(idx, 1);
  res.status(204).send();
}));