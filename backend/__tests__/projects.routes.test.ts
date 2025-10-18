import request from 'supertest';
import { createApp } from '../src/app';
import { createAccessToken } from '../src/auth/jwt';
import { prisma } from '../src/config/prisma';

jest.mock('../src/config/prisma', () => {
  const mockProject = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockTask = {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUser = {
    findUnique: jest.fn(),
  };
  return {
    prisma: {
      project: mockProject,
      task: mockTask,
      user: mockUser,
    },
  };
});

const prismaMock = prisma as unknown as {
  project: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
  };
  task: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
};

const app = createApp();
const token = `Bearer ${createAccessToken({ id: 'user-1', email: 'user@test.dev' })}`;

describe('Projects router task endpoints', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('applies status filter and due date sorting when listing tasks', async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      id: 'project-1',
      ownerId: 'user-1',
    } as any);
    prismaMock.task.findMany.mockResolvedValue([]);

    await request(app)
      .get('/projects/project-1/tasks')
      .query({ status: 'IN_PROGRESS', sort: 'dueDateAsc' })
      .set('Authorization', token)
      .expect(200);

    expect(prismaMock.task.findMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1', status: 'IN_PROGRESS' },
      orderBy: { dueDate: 'asc' },
    });
  });

  it('rejects assigning a task to a different user', async () => {
    prismaMock.project.findFirst.mockResolvedValue({
      id: 'project-1',
      ownerId: 'user-1',
    } as any);

    await request(app)
      .post('/projects/project-1/tasks')
      .set('Authorization', token)
      .send({
        title: 'Test task',
        dueDate: new Date().toISOString(),
        assigneeId: 'other-user',
      })
      .expect(400);

    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });
});
