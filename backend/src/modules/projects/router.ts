import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import {
  ProjectCreateSchema,
  ProjectIdSchema,
  ProjectUpdateSchema,
  TaskCreateSchema,
  TaskUpdateSchema,
} from './schemas';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

// List projects
projectsRouter.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });
    res.json({ projects });
  } catch (err) { next(err); }
});

// Create project
projectsRouter.post('/', validate(ProjectCreateSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body as any;
    const project = await prisma.project.create({ data: { name, description, ownerId: req.user!.id } });
    res.status(201).json({ project });
  } catch (err) { next(err); }
});

// Get project
projectsRouter.get('/:id', validate(ProjectIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const project = await prisma.project.findFirst({
      where: { id, ownerId: req.user!.id },
      include: { tasks: true },
    });
    if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
    res.json({ project });
  } catch (err) { next(err); }
});

// Update project
projectsRouter.patch('/:id', validate(ProjectUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const { name, description } = req.body as any;
    const existing = await prisma.project.findFirst({ where: { id, ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: { message: 'Project not found' } });
    const project = await prisma.project.update({ where: { id }, data: { name, description } });
    res.json({ project });
  } catch (err) { next(err); }
});

// Delete project
projectsRouter.delete('/:id', validate(ProjectIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const existing = await prisma.project.findFirst({ where: { id, ownerId: req.user!.id } });
    if (!existing) return res.status(404).json({ error: { message: 'Project not found' } });
    await prisma.project.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// List tasks in project
projectsRouter.get('/:projectId/tasks', async (req, res, next) => {
  try {
    const { projectId } = req.params as any;
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user!.id } });
    if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
    const tasks = await prisma.task.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' } });
    res.json({ tasks });
  } catch (err) { next(err); }
});

// Create task in project
projectsRouter.post('/:projectId/tasks', validate(TaskCreateSchema), async (req, res, next) => {
  try {
    const { projectId } = req.params as any;
    const { title, description, dueDate, priority, assigneeId } = req.body as any;
    const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: req.user!.id } });
    if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
    const task = await prisma.task.create({ data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      assigneeId,
      projectId,
    }});
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

// Update task by id
projectsRouter.patch('/tasks/:id', validate(TaskUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    // Ensure ownership via project
    const task = await prisma.task.findUnique({ where: { id }, include: { project: true } });
    if (!task || task.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    const { title, description, completed, dueDate, priority, assigneeId } = req.body as any;
    const updated = await prisma.task.update({ where: { id }, data: {
      title, description, completed, priority,
      assigneeId: assigneeId === null ? null : assigneeId,
      dueDate: dueDate === null ? null : (dueDate ? new Date(dueDate) : undefined),
    }});
    res.json({ task: updated });
  } catch (err) { next(err); }
});

// Delete task
projectsRouter.delete('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const task = await prisma.task.findUnique({ where: { id }, include: { project: true } });
    if (!task || task.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

