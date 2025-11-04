import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';

describe('SessionsController', () => {
    const testUserEmail = 'authuser@example.com';

    afterAll(async () => {
        await prisma.user.delete({
            where: { email: testUserEmail },
        });
    });

    it('should authenticate a user and return a token', async () => {
        await request(app).post('/users').send({
            name: 'Auth Test User',
            email: testUserEmail,
            password: 'password123',
        });

        const sessionResponse = await request(app).post('/sessions').send({
            email: testUserEmail,
            password: 'password123',
        });

        expect(sessionResponse.status).toBe(200);
        expect(sessionResponse.body).toHaveProperty('token');
    });
});