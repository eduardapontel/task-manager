import request from 'supertest';
import { app } from '@/app';
import { hash } from 'bcrypt';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';

describe('TasksController', () => {
    let token: string;
    let userId: string;
    let teamId: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
        userId = auth.user.id;

        const team = await prisma.team.create({
            data: {
                name: `Test Team ${Date.now()}`,
                description: 'Team for task tests',
            },
        });
        teamId = team.id;

        await prisma.teamMembers.create({
            data: {
                userId: userId,
                teamId: teamId,
            },
        });
    });

    afterAll(async () => {
        await prisma.tasks.deleteMany({ where: { teamId: teamId } });

        if (teamId) {
            await prisma.teamMembers.deleteMany({ where: { teamId: teamId } });
            await prisma.team.delete({ where: { id: teamId } });
        }

        if (userId) {
            await prisma.user.delete({ where: { id: userId } });
        }

        await prisma.user.deleteMany({
            where: { name: 'Auth Test User' },
        });

        await prisma.$disconnect();
    });

    describe('POST /tasks', () => {
        it('should create a new task successfully', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'This is a test task',
                status: 'pending',
                priority: 'low',
                teamId: teamId,
            };

            const response = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Task created successfully.');

            const createdTask = await prisma.tasks.findFirst({
                where: { title: taskData.title, teamId: teamId },
            });

            expect(createdTask).toBeDefined();
            expect(createdTask?.description).toBe(taskData.description);
            expect(createdTask?.status).toBe(taskData.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app).post('/tasks').send({
                title: 'Test Task',
                teamId: teamId,
            });

            expect(response.status).toBe(401);
        });

        it('should return 400 with missing required fields', async () => {
            const response = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Missing title',
                    teamId: teamId,
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /tasks', () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'List Test Task',
                    description: 'For listing',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });
            taskId = task.id;
        });

        afterEach(async () => {
            if (taskId) {
                await prisma.tasks.delete({ where: { id: taskId } });
            }
        });

        it('should list all tasks', async () => {
            const response = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            const task = response.body.find((t: any) => t.id === taskId);
            expect(task).toBeDefined();
            expect(task.title).toBe('List Test Task');
        });
    });

    describe('PATCH /tasks/:id', () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'Original Title',
                    description: 'Original description',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });
            taskId = task.id;
        });

        afterEach(async () => {
            if (taskId) {
                await prisma.tasks.deleteMany({ where: { id: taskId } });
            }
        });

        it('should update a task successfully', async () => {
            const updateData = {
                title: 'Updated Title',
                description: 'Updated description',
                status: 'in_progress',
                priority: 'medium',
            };

            const response = await request(app)
                .patch(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Task updated successfully.');

            const updatedTask = await prisma.tasks.findUnique({
                where: { id: taskId },
            });

            expect(updatedTask?.title).toBe(updateData.title);
            expect(updatedTask?.status).toBe(updateData.status);
        });

        it('should return 400 for invalid UUID format', async () => {
            const response = await request(app)
                .patch('/tasks/invalid-uuid')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated' });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 404 for non-existent task', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .patch(`/tasks/${fakeUuid}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /tasks/:id', () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'Task to Delete',
                    description: 'Will be deleted',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });
            taskId = task.id;
        });

        it('should delete a task successfully', async () => {
            const response = await request(app)
                .delete(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Task deleted successfully.');

            const deletedTask = await prisma.tasks.findUnique({
                where: { id: taskId },
            });

            expect(deletedTask).toBeNull();
        });

        it('should return 404 when deleting non-existent task', async () => {
            const fakeUuid = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/tasks/${fakeUuid}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /tasks/:id/assign', () => {
        let taskId: string;
        let assignedUserId: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'Task to Assign',
                    description: 'Will be assigned',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });

            taskId = task.id;

            const user = await prisma.user.create({
                data: {
                    name: 'User assigned',
                    email: `userassigned${Date.now()}@example.com`,
                    password: await hash('password123', 8),
                },
            });

            assignedUserId = user.id;

            await prisma.teamMembers.create({
                data: {
                    userId: assignedUserId,
                    teamId,
                },
            });
        });

        afterEach(async () => {
            if (taskId) {
                await prisma.tasks.deleteMany({ where: { id: taskId } });
            }

            if (assignedUserId) {
                await prisma.teamMembers.deleteMany({ where: { userId: assignedUserId } });
                await prisma.user.deleteMany({ where: { id: assignedUserId } });
            }
        });

        it('should assign a task to a user successfully', async () => {
            const response = await request(app)
                .patch(`/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${token}`)
                .send({ assignedTo: assignedUserId });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Task assigned successfully.');

            const assignedTask = await prisma.tasks.findUnique({
                where: { id: taskId },
            });

            expect(assignedTask?.assignedTo).toBe(assignedUserId);
        });

        it('should return 404 when user is not a team member', async () => {
            const outsideUser = await prisma.user.create({
                data: {
                    name: 'Not a Member User',
                    email: `notamember${Date.now()}@example.com`,
                    password: await hash('password123', 8),
                },
            });

            const response = await request(app)
                .patch(`/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${token}`)
                .send({ assignedTo: outsideUser.id });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User is not a member of the team.');

            await prisma.user.delete({ where: { id: outsideUser.id } });
        });

        it('should return 404 when user does not exist', async () => {
            const fakeUserId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .patch(`/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${token}`)
                .send({ assignedTo: fakeUserId });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found.');
        });
    });

    describe('GET /tasks/:id/history', () => {
        let taskId: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'History Test Task',
                    description: 'For history',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });

            taskId = task.id;

            await request(app)
                .patch(`/tasks/${taskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'in_progress',
                });
        });

        afterEach(async () => {
            if (taskId) {
                await prisma.tasksHistory.deleteMany({ where: { taskId: taskId } });
                await prisma.tasks.deleteMany({ where: { id: taskId } });
            }
        });

        it('should return task history successfully', async () => {
            const response = await request(app)
                .get(`/tasks/${taskId}/history`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);

            const historyEntry = response.body[0];
            expect(historyEntry).toHaveProperty('id');
            expect(historyEntry).toHaveProperty('previousStatus', 'pending');
            expect(historyEntry).toHaveProperty('newStatus', 'in_progress');
            expect(historyEntry).toHaveProperty('changedAt');
            expect(historyEntry).toHaveProperty('user');
            expect(historyEntry.user).toHaveProperty('id', userId);
        });

        it('should return empty array when no history exists', async () => {
            const newTask = await prisma.tasks.create({
                data: {
                    title: 'No History Task',
                    description: 'No changes',
                    status: 'pending',
                    priority: 'low',
                    teamId: teamId,
                },
            });

            const response = await request(app)
                .get(`/tasks/${newTask.id}/history`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);

            await prisma.tasks.delete({ where: { id: newTask.id } });
        });

        it('should return 404 for non-existent task', async () => {
            const fakeTaskId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .get(`/tasks/${fakeTaskId}/history`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Task not found');
        });
    });
});
