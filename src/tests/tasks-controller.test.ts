import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';

describe('TasksController', () => {
    let token: string;
    let user_id: string;
    let team_id: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
        user_id = auth.user.id;

        const team = await prisma.team.create({
            data: {
                name: `Test Team ${Date.now()}`,
                description: 'Team for task tests',
            },
        });
        team_id = team.id;

        await prisma.teamMembers.create({
            data: {
                userId: user_id,
                teamId: team_id,
            },
        });
    });

    afterAll(async () => {
        await prisma.tasks.deleteMany({ where: { teamId: team_id } });

        if (team_id) {
            await prisma.teamMembers.deleteMany({ where: { teamId: team_id } });
            await prisma.team.delete({ where: { id: team_id } });
        }

        if (user_id) {
            await prisma.user.delete({ where: { id: user_id } });
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
                teamId: team_id,
            };

            const response = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Task created successfully.');

            const createdTask = await prisma.tasks.findFirst({
                where: { title: taskData.title, teamId: team_id },
            });

            expect(createdTask).toBeDefined();
            expect(createdTask?.description).toBe(taskData.description);
            expect(createdTask?.status).toBe(taskData.status);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app).post('/tasks').send({
                title: 'Test Task',
                teamId: team_id,
            });

            expect(response.status).toBe(401);
        });

        it('should return 400 with missing required fields', async () => {
            const response = await request(app)
                .post('/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    description: 'Missing title',
                    teamId: team_id,
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /tasks', () => {
        let task_id: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'List Test Task',
                    description: 'For listing',
                    status: 'pending',
                    priority: 'low',
                    teamId: team_id,
                },
            });
            task_id = task.id;
        });

        afterEach(async () => {
            if (task_id) {
                await prisma.tasks.delete({ where: { id: task_id } });
            }
        });

        it('should list all tasks', async () => {
            const response = await request(app)
                .get('/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);

            const task = response.body.find((t: any) => t.id === task_id);
            expect(task).toBeDefined();
            expect(task.title).toBe('List Test Task');
        });
    });

    describe('PATCH /tasks/:id', () => {
        let task_id: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'Original Title',
                    description: 'Original description',
                    status: 'pending',
                    priority: 'low',
                    teamId: team_id,
                },
            });
            task_id = task.id;
        });

        afterEach(async () => {
            if (task_id) {
                await prisma.tasks.deleteMany({ where: { id: task_id } });
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
                .patch(`/tasks/${task_id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Task updated successfully.');

            const updatedTask = await prisma.tasks.findUnique({
                where: { id: task_id },
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
        let task_id: string;

        beforeEach(async () => {
            const task = await prisma.tasks.create({
                data: {
                    title: 'Task to Delete',
                    description: 'Will be deleted',
                    status: 'pending',
                    priority: 'low',
                    teamId: team_id,
                },
            });
            task_id = task.id;
        });

        it('should delete a task successfully', async () => {
            const response = await request(app)
                .delete(`/tasks/${task_id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Task deleted successfully.');

            const deletedTask = await prisma.tasks.findUnique({
                where: { id: task_id },
            });

            expect(deletedTask).toBeNull();
        });

        it('should return 404 when deleting non-existent task', async () => {
            const response = await request(app)
                .delete('/tasks/non-existent-id')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
