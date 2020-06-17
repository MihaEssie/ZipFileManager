/* eslint-disable max-len */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const Joi = require('joi');
const app = require('../../server/server');
const HelperService = require('../../server/services/helpers.service');

// fixtures
const extractedReqObj = require('../fixtures/extracted-files-user.json');

describe('Upload & Archive files - unit tests', () => {
  it('Check if files are archived', async() => {
    const archiveSchema = Joi.string();
    const joiOptions = {abortEarly: false, presence: 'required'};

    const archiveName = await HelperService.archiveFiles(extractedReqObj.files, extractedReqObj.userId);
    const {error, value} = Joi.validate(archiveName, archiveSchema, joiOptions);
    // eslint-disable-next-line no-unused-expressions
    expect(error).to.be.null;
  });
});
