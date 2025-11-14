import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';

describe('TeamMembersController', () => {
    let token: string;
    let adminUserId: string;
    let teamId: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
        adminUserId = auth.user.id;

        const team = await prisma.team.create({
            data: {
                name: `Test Team ${Date.now()}`,
                description: 'Team for members tests',
            },
        });

        teamId = team.id;
    });

    afterAll(async () => {
        await prisma.teamMembers.deleteMany({ where: { teamId } });

        if (teamId) {
            await prisma.team.deleteMany({ where: { id: teamId } });
        }

        await prisma.user.deleteMany({
            where: {
                OR: [{ id: adminUserId }, { email: { contains: 'testmember' } }],
            },
        });

        await prisma.$disconnect();
    });

    describe('POST /team-members', () => {
        let newUserId: string;

        beforeEach(async () => {
            const newUser = await prisma.user.create({
                data: {
                    name: 'Test Member',
                    email: `testmember${Date.now()}@example.com`,
                    password: 'hashedpassword',
                },
            });
            newUserId = newUser.id;
        });

        afterEach(async () => {
            if (newUserId) {
                await prisma.teamMembers.deleteMany({
                    where: { userId: newUserId },
                });
                await prisma.user.deleteMany({
                    where: { id: newUserId },
                });
            }
        });

        it('should create a new team member successfully', async () => {
            const response = await request(app)
                .post(`/team-members`)
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: newUserId, teamId });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Team member added successfully.');

            const member = await prisma.teamMembers.findFirst({
                where: {
                    userId: newUserId,
                    teamId,
                },
            });

            expect(member).toBeDefined();
        });

        it('should return 409 when user is already a member of a team', async () => {
            await request(app).post('/team-members').set('Authorization', `Bearer ${token}`).send({
                userId: newUserId,
                teamId,
            });

            const response = await request(app)
                .post('/team-members')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: newUserId,
                    teamId: teamId,
                });

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('message', 'User is already a member of a team.');
        });

        it('should return 404 when user does not exist', async () => {
            const fakeUserId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .post('/team-members')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: fakeUserId,
                    teamId,
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found.');
        });

        it('should return 404 when team does not exist', async () => {
            const fakeTeamId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .post('/team-members')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: newUserId,
                    teamId: fakeTeamId,
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Team not found.');
        });
    });

    describe('GET /team-members', () => {
        let member1Id: string;
        let member2Id: string;

        beforeAll(async () => {
            const user1 = await prisma.user.create({
                data: {
                    name: 'Member 1',
                    email: `member1-${Date.now()}@example.com`,
                    password: 'hashedpassword',
                },
            });

            member1Id = user1.id;

            const user2 = await prisma.user.create({
                data: {
                    name: 'Member 2',
                    email: `member2-${Date.now()}@example.com`,
                    password: 'hashedpassword',
                },
            });

            member2Id = user2.id;

            await prisma.teamMembers.createMany({
                data: [
                    { userId: member1Id, teamId: teamId },
                    { userId: member2Id, teamId: teamId },
                ],
            });
        });

        afterAll(async () => {
            await prisma.teamMembers.deleteMany({
                where: {
                    userId: { in: [member1Id, member2Id] },
                },
            });
            await prisma.user.deleteMany({
                where: { id: { in: [member1Id, member2Id] } },
            });
        });

        it('should list all team members', async () => {
            const response = await request(app)
                .get(`/team-members?teamId=${teamId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);

            const member = response.body[0];
            expect(member).toHaveProperty('name');
            expect(member).toHaveProperty('email');
            expect(member).toHaveProperty('role');
        });

        it('should return 404 when team does not exist', async () => {
            const fakeTeamId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .get(`/team-members?teamId=${fakeTeamId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Team not found.');
        });

        it('should return 400 when teamId is missing', async () => {
            const response = await request(app)
                .get('/team-members')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /team-members', () => {
        let memberUserId: string;

        beforeEach(async () => {
            const user = await prisma.user.create({
                data: {
                    name: 'Member to Delete',
                    email: `deletemember${Date.now()}@example.com`,
                    password: 'hashedpassword',
                },
            });

            memberUserId = user.id;

            await prisma.teamMembers.create({
                data: {
                    userId: memberUserId,
                    teamId: teamId,
                },
            });
        });

        afterEach(async () => {
            if (memberUserId) {
                await prisma.teamMembers.deleteMany({
                    where: { userId: memberUserId },
                });
                await prisma.user.deleteMany({
                    where: { id: memberUserId },
                });
            }
        });

        it('should remove a team member successfully', async () => {
            const response = await request(app)
                .delete(`/team-members`)
                .set('Authorization', `Bearer ${token}`)
                .send({ userId: memberUserId, teamId });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Team member deleted successfully.');

            const member = await prisma.teamMembers.findFirst({
                where: {
                    userId: memberUserId,
                    teamId: teamId,
                },
            });

            expect(member).toBeNull();
        });

        it('should return 404 when member does not exist', async () => {
            const fakeUserId = '00000000-0000-0000-0000-000000000000';

            const response = await request(app)
                .delete('/team-members')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userId: fakeUserId,
                    teamId: teamId,
                });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Member not found in this team.');
        });
    });
});
