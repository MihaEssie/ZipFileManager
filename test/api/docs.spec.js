'use strict';

const request = require('supertest');
const app = require('./../../server/server');
const chai = require('chai');
const expect = chai.expect;

describe('Docs Upload & Archive - API', () => {
  it('successfully uploads files and archive them', (done) => {
    request(app)
        .post('/api/docs')
        .field('userName', 'Miha')
        .attach('file1', 'test/fixtures/file1.csv')
        .attach('file2', 'test/fixtures/file2.pdf')
        .attach('file3', 'test/fixtures/file4.png')
        .set('Content-Type', 'multipart/form-data')
        .expect(200)
        .expect('Content-Type', 'application/download')
        .expect('Content-Transfer-Encoding', 'binary')
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
  });

// large files need to be in test/fixtures.
  // it('throws Bad Request when file size > 250MB', (done) => {
  //   request(app)
  //       .post('/api/docs')
  //       .field('userName', 'Miha')
  //       .attach('file1', 'test/fixtures/512MB.zip')
  //       .set('Content-Type', 'multipart/form-data')
  //       .expect(403)
  //       .end((err, res) => {
  //         if (err) return done(err);
  //         done();
  //       });
  // }).timeout(2500);

  // it('throws Bad Request Error when all files > 800MB', (done) => {
  //   request(app)
  //       .post('/api/docs')
  //       .field('userName', 'Miha')
  //       .attach('file1', 'test/fixtures/file1-200MB.zip')
  //       .attach('file2', 'test/fixtures/file3-200MB.zip')
  //       .attach('file3', 'test/fixtures/512MB.zip')
  //       .set('Content-Type', 'multipart/form-data')
  //       .expect(403)
  //       .end((err, res) => {
  //         if (err) return done(err);
  //         done();
  //       });
  // }).timeout(2500);

  it('throws Bad Request Error userName are missing from req', (done) => {
    request(app)
        .post('/api/docs')
        .attach('file1', 'test/fixtures/file1.csv')
        .attach('file2', 'test/fixtures/file2.pdf')
        .attach('file3', 'test/fixtures/file4.png')
        .set('Content-Type', 'multipart/form-data')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
  });

  it('throws Bad Request Error files are missing from req', (done) => {
    request(app)
        .post('/api/docs')
        .field('userName', 'Miha')
        .set('Content-Type', 'multipart/form-data')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
  });
});
