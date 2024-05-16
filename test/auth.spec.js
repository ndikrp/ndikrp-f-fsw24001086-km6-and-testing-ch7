const request = require('supertest');
const { sequelize, User, Role } = require('../app/models');
const app = require('../app');

describe('Authentication Endpoints', () => {
    let accessToken;

    beforeAll(async () => {
        await sequelize.sync();

        await Role.findOrCreate({
            where: { name: 'CUSTOMER' },
            defaults: { name: 'CUSTOMER' }
        });
    });

    describe('Test POST /v1/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                name: 'Bisa',
                email: 'email2@example.com',
                password: 'admin',
            };

            const response = await request(app)
                .post('/v1/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.accessToken).toBeDefined();
        });
    });

    describe('Test POST /v1/auth/login', () => {
        it('should login an existing user', async () => {
            const loginData = {
                email: 'email2@example.com',
                password: 'admin',
            };

            const response = await request(app)
                .post('/v1/auth/login')
                .send(loginData);

            expect(response.status).toBe(201);
            expect(response.body.accessToken).toBeDefined();
            accessToken = response.body.accessToken;
        });
    });

    describe('Test GET /v1/auth/whoami', () => {
        it('should get user details', async () => {
            const response = await request(app)
                .get('/v1/auth/whoami')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('email2@example.com');
        });
    });

    afterAll(async () => {
        await User.destroy({
            where: {
                email: 'email2@example.com',
            },
        });
        await sequelize.close();
    });
});
