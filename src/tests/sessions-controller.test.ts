import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { hash } from 'bcrypt';

describe('SessionsController', () => {
    describe('POST /sessions', () => {
        const testUserEmail = `authuser-${Date.now()}-${Math.random()}@example.com`;
        let createdUserId: string;

        beforeAll(async () => {
            const user = await prisma.user.create({
                data: {
                    name: 'Auth Test User',
                    email: testUserEmail,
                    password: await hash('password123', 8),
                },
            });
            createdUserId = user.id;
        });

        afterAll(async () => {
            if (createdUserId) {
                await prisma.user.delete({
                    where: { id: createdUserId },
                }).catch(() => {
                });
            }
            await prisma.$disconnect();
        });

        it('should authenticate a user and return a token', async () => {
            const sessionResponse = await request(app).post('/sessions').send({
                email: testUserEmail,
                password: 'password123',
            });

            expect(sessionResponse.status).toBe(200);
            expect(sessionResponse.body).toHaveProperty('token');
            expect(typeof sessionResponse.body.token).toBe('string');
            expect(sessionResponse.body.token.length).toBeGreaterThan(0);
            expect(sessionResponse.body).toHaveProperty('user');
            expect(sessionResponse.body.user.email).toBe(testUserEmail);
            expect(sessionResponse.body.user).not.toHaveProperty('password');
        });

        it('should return 401 with wrong password', async () => {
            const response = await request(app).post('/sessions').send({
                email: testUserEmail,
                password: 'wrongpassword',
            });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Email or password incorrect!');
        });

        it('should return 401 with non-existent email', async () => {
            const response = await request(app).post('/sessions').send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Email or password incorrect!');
        });

        it('should return 400 with invalid email format', async () => {
            const response = await request(app).post('/sessions').send({
                email: 'invalid-email',
                password: 'password123',
            });

            expect(response.status).toBe(400);
        });

        it('should return 400 with missing password', async () => {
            const response = await request(app).post('/sessions').send({
                email: testUserEmail,
            });

            expect(response.status).toBe(400);
        });
    });
});