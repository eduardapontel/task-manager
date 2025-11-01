import request from 'supertest';
import { app } from '@/app';

describe('SessionsController', () => {

    it('should authenticate a user and return a token', async () => {
        await request(app).post('/users').send({
            name: 'Auth Test User',
            email: 'authuser@example.com',
            password: 'password123',
        });

        const sessionResponse = await request(app).post('/sessions').send({
            email: 'authuser@example.com',
            password: 'password123',
        });

        expect(sessionResponse.status).toBe(200);
        expect(sessionResponse.body).toHaveProperty('token');

    });
});