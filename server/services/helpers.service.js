/* eslint-disable max-len */
'use strict';

const debug = require('debug')('server:zip-file-manager:helpers');
debug.log = console.log.bind(console);

const multiparty = require('multiparty');
const moment = require('moment');
const archiver = require('archiver');
const fs = require('fs');
const COS = require('ibm-cos-sdk');
const cosService = 'cloud-object-storage';
const cfenv = require('cfenv');
const uuid = require('uuid/v4');
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;
const MAX_ARCHIVE_SIZE = process.env.MAX_ARCHIVE_SIZE;

let localVCAP = null;
try { localVCAP = process.env.VCAP_SERVICES || require('./../../local-vcap.json'); } catch (e) {};
const appEnv = cfenv.getAppEnv({vcap: localVCAP});

/**
 * @param {Object} req
 * @return {Promise}
 */
const getFilesFromRequest = (req) => new Promise((resolve, reject) => {
  const form = new multiparty.Form();
  form.parse(req, (err, fields, files) => {
    if (Object.keys(files).length === 0 || !fields.userName || fields.userName[0] === '') {
      const error = new Error('Bad Request Error');
      error.statusCode = 400;
      error.name = 'Missing required files and userName';
      reject(error);
    } else {
      const userName = fields.userName[0];
      const userId = _createUserId(userName);
      let key = Object.keys(files)[0];
      resolve({
        files: files[key],
        userId,
      });
    }
    if (err) reject(err);
  });
});

/**
 *
 * @param {Array} files
 */
function validateFilesSize(files) {
  debug('Validate size limit per uploded file');
  const invalidFiles = files.filter(f => { if (f.size > MAX_FILE_SIZE) return f.originalFilename; });
  if (invalidFiles.length) {
    const error = new Error('Upload failed because exceeds the MAX file size(250MB) allowed per file');
    error.statusCode = 403;
    error.name = 'Forbidden';
    throw error;
  }
};

/**
 *
 * @param {Array} files
 */
function validateArchiveSize(files) {
  debug('Validate size limit for all uploded files');
  const sum = files.reduce((result, f) => result + f.size, 0);
  debug('Total size for all files: %d bytes', sum);
  if (sum > MAX_ARCHIVE_SIZE) {
    const error = new Error('Upload failed because exceeds the MAX upload files size(800MB)');
    error.statusCode = 403;
    error.name = 'Forbidden';
    throw error;
  }
};

/**
 * @param {Array} files
 * @returns {Promise}
 */
const archiveFiles = async (files, userId) => {
  debug('Starting archiving uploded files');
  const archive = archiver('zip', {zlib: {level: 9}});
  const currentDate = moment(new Date()).format('DD-MM-YYYY');
  const archiveName = `${userId}-archive-${currentDate}.zip`;
  let output = fs.createWriteStream(archiveName);

  return new Promise((resolve, reject) => {
    archive
            .on('error', err => reject(err))
            .on('warning', err => {
              if (err.code === 'ENOENT') console.warn(err);
              else reject(err);
            })
            .pipe(output);
    debug('Appending files to archive');
    files.forEach((f) => {
      archive.append(fs.createReadStream(f.path), {name: f.originalFilename});
    });
    output.on('close', () => {
      debug('Zipped %d total bytes', archive.pointer());
      debug('Archiver has been finalized and the output file descriptor has closed.');
      resolve(archiveName);
    })
            .on('end', () => {
              debug('Data has been drained');
            });
    archive.finalize();
    debug('Succesfuly archived %d files, archive name: ', files.length, archiveName);
  });
};

function  configObjectStorage() {
  debug('Start config Cloud Object Storage');
  const COS_ENDPOINT = process.env.COS_ENDPOINT;
  const COS_IBMAUTHENDPOINT = process.env.COS_IBMAUTHENDPOINT;
  const cosCreds = appEnv.services[cosService][0].credentials;
  const config = {
    endpoint: COS_ENDPOINT,
    apiKeyId: cosCreds.apikey,
    ibmAuthEndpoint: COS_IBMAUTHENDPOINT,
    serviceInstanceId: cosCreds.resource_instance_id,
  };

  const cos = new COS.S3(config);
  debug('End config Cloud Object Storage');

  return cos;
};

/**
 *
 * @param {Object} cos
 * @param {String} bucketName
 * @param {String} fileName
 */
async function uploadFileToCOS(cos, bucketName, fileName) {
  debug('Saving %s file in %s bucket', fileName, bucketName);
  const fileContent = fs.readFileSync(fileName);

  return new Promise((resolve, reject) => {
    return cos.putObject({
      Bucket: bucketName,
      ACL: 'public-read',
      Key: fileName,
      Body: fileContent,
      ContentType: 'application/zip',
    }, (err, result) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

/**
 *
 * @param {Object} res
 * @param {String} fileName
 */
function configAPIResponse(res, fileName) {
  debug('Configure API Response by adding headers to send zip file');
  const fileContent = fs.readFileSync(fileName);
  res.set('Content-Type', 'application/force-download');
  res.set('Content-Type', 'application/zip');
  res.set('Content-Type', 'application/download');
  res.set('Content-Disposition', `attachment;filename=${fileName}`);
  res.set('Content-Transfer-Encoding', 'binary');
  res.send(fileContent);
};

/**
 *
 * @param {String} userName
 */
function _createUserId(userName) {
  return `${userName}-${uuid()}`;
};

module.exports = {
  getFilesFromRequest,
  validateFilesSize,
  validateArchiveSize,
  archiveFiles,
  configObjectStorage,
  uploadFileToCOS,
  configAPIResponse,
};
