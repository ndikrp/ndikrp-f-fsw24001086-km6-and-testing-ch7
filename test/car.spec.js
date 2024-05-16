const request = require('supertest');
const { sequelize, User, Role, Car, UserCar } = require('../app/models');
const app = require('../app');

describe('CarController', () => {
    let adminToken;
    let customerToken;
    let carId;

    beforeAll(async () => {
        jest.setTimeout(30000);
        await sequelize.sync({ force: true });

        // Ensure roles exist
        const [adminRole] = await Role.findOrCreate({ where: { name: 'ADMIN' }, defaults: { name: 'ADMIN' } });
        const [customerRole] = await Role.findOrCreate({ where: { name: 'CUSTOMER' }, defaults: { name: 'CUSTOMER' } });

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin',
            email: 'admin@example.com',
            encryptedPassword: User.encryptPassword('password'),
            roleId: adminRole.id,
        });
        adminToken = User.createTokenFromUser(adminUser, adminRole);

        // Create customer user
        const customerUser = await User.create({
            name: 'Customer',
            email: 'customer@example.com',
            encryptedPassword: User.encryptPassword('password'),
            roleId: customerRole.id,
        });
        customerToken = User.createTokenFromUser(customerUser, customerRole);
    });

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

    it('should list cars', async () => {
        const response = await request(app)
            .get('/v1/cars');

        expect(response.status).toBe(200);
        expect(response.body.cars.length).toBeGreaterThan(0);
    });

    it('should get a car by ID', async () => {
        const response = await request(app)
            .get(`/v1/cars/${carId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(carId);
    });

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

    it('should update a car', async () => {
        const updateData = {
            name: 'Toyota Camry Updated',
            price: 120,
            size: 'large',
            image: 'https://example.com/camry-updated.jpg',
        };

        const response = await request(app)
            .put(`/v1/cars/${carId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe(updateData.name);
    });

    it('should delete a car', async () => {
        const response = await request(app)
            .delete(`/v1/cars/${carId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(204);
    });

    afterAll(async () => {
        await sequelize.close();
    });
});
