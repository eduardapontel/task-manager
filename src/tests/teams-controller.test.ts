import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';

describe('TeamsController', () => {
    let token: string;
    let userId: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
        userId = auth.user.id;
    });

    afterAll(async () => {
        await prisma.team.deleteMany({
            where: {
                name: {
                    in: [
                        'Test Team Create',
                        'Test Team Edit',
                        'Test Team Edit Updated',
                        'Test Team Delete',
                    ],
                },
            },
        });

        await prisma.team.deleteMany({
            where: {
                OR: [
                    { name: { startsWith: 'Test Team Delete' } },
                    { name: { startsWith: 'Test Team Edit' } },
                ],
            },
        });

        if (userId) {
            await prisma.user.deleteMany({
                where: { id: userId },
            });
        }

        await prisma.$disconnect();
    });

    describe('POST /teams', () => {
        it('should create a new team successfully', async () => {
            const response = await request(app)
                .post('/teams')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Team Create',
                    description: 'Team for create test',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Team created successfully.');
            expect(response.body.team).toHaveProperty('id');
            expect(response.body.team.name).toBe('Test Team Create');
        });

        it('should return 400 when team name already exists', async () => {
            await request(app).post('/teams').set('Authorization', `Bearer ${token}`).send({
                name: 'Duplicate Team',
                description: 'First team',
            });

            const response = await request(app)
                .post('/teams')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Duplicate Team',
                    description: 'Second team',
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Team name already exists.');

            await prisma.team.deleteMany({
                where: { name: 'Duplicate Team' },
            });
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app).post('/teams').send({
                name: 'Unauthorized Team',
                description: 'Should fail',
            });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /teams', () => {
        beforeAll(async () => {
            await prisma.team.createMany({
                data: [
                    { name: 'Team List 1', description: 'First team' },
                    { name: 'Team List 2', description: 'Second team' },
                ],
            });
        });

        afterAll(async () => {
            await prisma.team.deleteMany({
                where: {
                    name: {
                        in: ['Team List 1', 'Team List 2'],
                    },
                },
            });
        });

        it('should list all teams', async () => {
            const response = await request(app)
                .get('/teams')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PATCH /teams/:id', () => {
        let teamId: string;

        beforeEach(async () => {
            const team = await prisma.team.create({
                data: {
                    name: `Test Team Edit ${Date.now()}`,
                    description: 'Original description',
                },
            });
            teamId = team.id;
        });

        afterEach(async () => {
            if (teamId) {
                await prisma.team.deleteMany({
                    where: { id: teamId },
                });
            }
        });

        it('should edit a team successfully', async () => {
            const response = await request(app)
                .patch(`/teams/${teamId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Team Name',
                    description: 'Updated description',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Team updated successfully.');

            const updatedTeam = await prisma.team.findUnique({
                where: { id: teamId },
            });

            expect(updatedTeam?.name).toBe('Updated Team Name');
            expect(updatedTeam?.description).toBe('Updated description');
        });

        it('should return 404 for non-existent team', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .patch(`/teams/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Name',
                });

            expect(response.status).toBe(404);
        });

        it('should return 400 when body is empty', async () => {
            const response = await request(app)
                .patch(`/teams/${teamId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /teams/:id', () => {
        let teamId: string;

        beforeEach(async () => {
            const team = await prisma.team.create({
                data: {
                    name: `Test Team Delete ${Date.now()}`, // ✅ Nome único
                    description: 'Team to be deleted',
                },
            });
            teamId = team.id;
        });

        afterEach(async () => {
            if (teamId) {
                await prisma.team.deleteMany({
                    where: { id: teamId },
                });
            }
        });

        it('should delete a team successfully', async () => {
            const response = await request(app)
                .delete(`/teams/${teamId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Team deleted successfully.');

            const deletedTeam = await prisma.team.findUnique({
                where: { id: teamId },
            });

            expect(deletedTeam).toBeNull();
        });

        it('should return 404 when deleting non-existent team', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .delete(`/teams/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
