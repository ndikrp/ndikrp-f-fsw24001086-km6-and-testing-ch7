const request = require('supertest');
const { sequelize, User, Role } = require('../app/models');
const app = require('../app');

describe('AuthenticationController', () => {
    let accessToken;

    beforeAll(async () => {
        jest.setTimeout(30000);
        await sequelize.sync();
        await User.destroy({
            where: {
                email: 'email2@example.com',
            },
        });

        await Role.findOrCreate({
            where: { name: 'CUSTOMER' },
            defaults: { name: 'CUSTOMER' }
        });
    });

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

    it('should get user details', async () => {
        const response = await request(app)
            .get('/v1/auth/whoami')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.email).toBe('email2@example.com');
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
