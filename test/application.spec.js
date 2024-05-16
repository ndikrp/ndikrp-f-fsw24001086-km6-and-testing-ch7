const request = require("supertest");
const app = require("../app/index");
const { NotFoundError } = require("../app/errors/index");
const { ApplicationController } = require("../app/controllers");

describe('ApplicationController Tests', () => {
  describe('Test method GET / endpoint', () => {
    test('handleGetRoot -> Success', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('message', 'BCR API is up and running!');
    });
  });

  describe('Test method GET /nonexistent endpoint', () => {
    test('handleNotFound -> Error', async () => {
      const res = await request(app).get('/nonexistent');
      const err = new NotFoundError('GET', '/nonexistent');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('name', err.name);
      expect(res.body.error).toHaveProperty('message', err.message);
      expect(res.body.error).toHaveProperty('details');
    });
  });

  describe('Test method for handling errors', () => {
    test('handleError -> Error without details', async () => {
      const err = new Error('Not found!');
      const mockMiddleware = (req, res, next) => {
        throw err;
      };

      app.get('/error', mockMiddleware, (err, req, res, next) => {
        const appController = new ApplicationController();
        appController.handleError(err, req, res, next);
      });

      const res = await request(app).get('/error');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('name', err.name);
      expect(res.body.error).toHaveProperty('message', err.message);
      expect(res.body.error).toHaveProperty('details');
    });

    test('handleError -> Error with details', async () => {
      const err = new Error('Not found!');
      err.details = 'Error details';
      const mockMiddleware = (req, res, next) => {
        throw err;
      };

      app.get('/error-with-details', mockMiddleware, (err, req, res, next) => {
        const appController = new ApplicationController();
        appController.handleError(err, req, res, next);
      });

      const res = await request(app).get('/error-with-details');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('name', err.name);
      expect(res.body.error).toHaveProperty('message', err.message);
      expect(res.body.error).toHaveProperty('details');
      expect(res.body.error.details).toEqual({
        method: 'GET',
        url: '/error-with-details',
      });
    });
  });

  describe('Test method for pagination and offset', () => {
    let appController;

    beforeAll(() => {
      appController = new ApplicationController();
    });

    test('getOffsetFromRequest -> Correct offset', () => {
      const req = { query: { page: 2, pageSize: 10 } };
      const offset = appController.getOffsetFromRequest(req);
      expect(offset).toBe(10);
    });

    test('getOffsetFromRequest -> Default offset', () => {
      const req = { query: {} };
      const offset = appController.getOffsetFromRequest(req);
      expect(offset).toBe(0);
    });

    test('buildPaginationObject -> Correct pagination object', () => {
      const req = { query: { page: 2, pageSize: 10 } };
      const count = 30;
      const pagination = appController.buildPaginationObject(req, count);

      expect(pagination).toEqual({
        page: 2,
        pageCount: 3,
        pageSize: 10,
        count: 30,
      });
    });

    test('buildPaginationObject -> Default pagination object', () => {
      const req = { query: {} };
      const count = 5;
      const pagination = appController.buildPaginationObject(req, count);

      expect(pagination).toEqual({
        page: 1,
        pageCount: 1,
        pageSize: 10,
        count: 5,
      });
    });
  });
});
