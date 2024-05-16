const request = require('supertest');
const { sequelize, User, Role, Car, UserCar } = require('../app/models');
const app = require('../app');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SIGNATURE_KEY } = require('../config/application');
const { Op } = require('sequelize');
const { CarController } = require('../app/controllers');

const encryptPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

const createTokenFromUser = (user, role) => {
    return jwt.sign({
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
            id: role.id,
            name: role.name,
        }
    }, JWT_SIGNATURE_KEY);
};

describe('CarController Tests', () => {
    let adminToken;
    let customerToken;
    let carId;
    let carController;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        const [adminRole] = await Role.findOrCreate({ where: { name: 'ADMIN' }, defaults: { name: 'ADMIN' } });
        const [customerRole] = await Role.findOrCreate({ where: { name: 'CUSTOMER' }, defaults: { name: 'CUSTOMER' } });

        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            encryptedPassword: encryptPassword('password'),
            roleId: adminRole.id,
        });
        adminToken = createTokenFromUser(adminUser, adminRole);

        const customerUser = await User.create({
            name: 'Customer',
            email: 'customer@example.com',
            encryptedPassword: encryptPassword('password'),
            roleId: adminRole.id,
        });
        customerToken = createTokenFromUser(customerUser, customerRole);

        carController = new CarController({ carModel: Car, userCarModel: UserCar });
    });

    describe('Test POST /v1/cars', () => {
        it('should create a new car', async () => {
            const carData = {
                name: 'Toyota Camry',
                price: 100,
                size: 'medium',
                image: 'https://example.com/camry.jpg',
            };

            const response = await request(app)
                .post('/v1/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(carData);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(carData.name);
            carId = response.body.id;
        });
    });

    describe('Test GET /v1/cars', () => {
        it('should list cars', async () => {
            const response = await request(app)
                .get('/v1/cars');

            expect(response.status).toBe(200);
            expect(response.body.cars.length).toBeGreaterThan(0);
        });
    });

    describe('Test GET /v1/cars/:id', () => {
        it('should get a car by ID', async () => {
            const response = await request(app)
                .get(`/v1/cars/${carId}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(carId);
        });
    });

    describe('Test POST /v1/cars/:id/rent', () => {
        it('should rent a car', async () => {
            const rentData = {
                rentStartedAt: new Date().toISOString(),
                rentEndedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            };

            const response = await request(app)
                .post(`/v1/cars/${carId}/rent`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send(rentData);

            expect(response.status).toBe(201);
            expect(response.body.carId).toBe(carId);
            expect(response.body.userId).toBeDefined();
        });
    });

    describe('Test PUT /v1/cars/:id', () => {
        it('should update a car', async () => {
            const updateData = {
                name: 'Toyota Camry Updated',
                price: 120000,
                size: 'SMALL',
                image: 'https://example.com/camry-updated.jpg',
            };

            const response = await request(app)
                .put(`/v1/cars/${carId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
        });
    });

    describe('Test DELETE /v1/cars/:id', () => {
        it('should delete a car', async () => {
            const response = await request(app)
                .delete(`/v1/cars/${carId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(204);
        });
    });

    describe('Test getListQueryFromRequest', () => {
        it('should return correct query object with size and availableAt filters', () => {
            const req = {
                query: {
                    size: 'medium',
                    availableAt: '2024-05-25',
                    pageSize: 10,
                    page: 1,
                },
            };

            const expectedQuery = {
                include: {
                    model: UserCar,
                    as: 'userCar',
                    required: false,
                    where: {
                        rentEndedAt: {
                            [Op.gte]: '2024-05-25',
                        },
                    },
                },
                where: {
                    size: 'medium',
                },
                limit: 10,
                offset: 0,
            };

            const query = carController.getListQueryFromRequest(req);

            expect(query).toEqual(expectedQuery);
        });

        it('should return correct query object without size and availableAt filters', () => {
            const req = {
                query: {
                    pageSize: 20,
                    page: 2,
                },
            };

            const expectedQuery = {
                include: {
                    model: UserCar,
                    as: 'userCar',
                    required: false,
                },
                where: {},
                limit: 20,
                offset: 20,
            };

            const query = carController.getListQueryFromRequest(req);

            expect(query).toEqual(expectedQuery);
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });
});

