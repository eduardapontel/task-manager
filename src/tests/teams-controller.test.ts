import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';

describe('TeamsController', () => {
    let token: string;
    let team_id: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
    });

    afterAll(async () => {
        if (team_id) {
            const teamExists = await prisma.team.findUnique({
                where: { id: team_id },
            });

            if (teamExists) {
                await prisma.team.delete({ where: { id: team_id } });
            }
        }
    });

    it('should create a new team successfully', async () => {
        const team = await prisma.team.create({
            data: {
                name: 'Development Team',
                description: 'Team responsible for software development',
            },
        });

        team_id = team.id;

        expect(team).toHaveProperty('id');
        expect(team.name).toBe('Development Team');
    });

    it('should list all teams', async () => {
        const response = await request(app).get('/teams').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should edit a team successfully', async () => {
        const team = await prisma.team.create({
            data: {
                name: 'Development Team',
                description: 'Team responsible for software development',
            },
        });

        const response = await request(app)
            .patch(`/teams`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                id: team.id,
                name: 'QA Team',
                description: 'Team responsible for quality assurance',
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Team updated successfully.');

        await prisma.team.delete({ where: { id: team.id } });
    });

    it('should delete a team successfully', async () => {
        const team = await prisma.team.create({
            data: {
                name: 'QA Team',
                description: 'Team responsible for quality assurance',
            },
        });

        team_id = team.id;

        const response = await request(app)
            .delete(`/teams`)
            .set('Authorization', `Bearer ${token}`)
            .send({ id: team_id });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Team deleted successfully.');

        team_id = '';
    });
});
