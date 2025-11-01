import request from 'supertest';
import { prisma } from '@/database/prisma';
import { app } from '@/app';

describe('UsersController', () => {
    let user_id: string;

    afterAll(async () => {
        await prisma.user.delete({ where: { id: user_id } });
    });

    it('should create a new user successfully', async () => {
        await prisma.user.deleteMany({
            where: { email: 'testuser@example.com' },
        });

        const response = await request(app).post('/users').send({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Test User');
        expect(response.body).toHaveProperty('email', 'testuser@example.com');

        user_id = response.body.id;
    });

    it('should not create a user with an existing email', async () => {
        const response = await request(app).post('/users').send({
            name: 'Another User',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', 'Email already in use.');
    });

    it('should throw a validation error for invalid email', async () => {
        const response = await request(app).post('/users').send({
            name: 'Invalid Email User',
            email: 'invalid-email',
            password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Validation error');
    });
});
