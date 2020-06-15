'use strict';

const debug = require('debug')('server:zip-file-manager:helpers');
debug.log = console.log.bind(console);
const multiparty = require('multiparty');
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE;
const MAX_ARCHIVE_SIZE = process.env.MAX_ARCHIVE_SIZE;

/**
 * @param {Object} req
 * @return {Promise}
 */
const getFilesFromRequest = (req) => new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        let key = files !== undefined ? Object.keys(files)[0] : undefined;
        if (typeof files === undefined) {
            const error = new Error('Bad Request Error');
            error.statusCode = 400;
            error.name = 'Missing required files';
            reject(error);
        } else  resolve(files[key]);
        if(err) reject(err);
    });
});

/**
 * 
 * @param {Array} files 
 */
function validateFilesSize(files) {
    const invalidFiles = files.filter(f=> { if(f.size > MAX_FILE_SIZE) return f.originalFilename });
    if(invalidFiles.length) {
        const error = new Error('Upload failed because exceeds the MAX file size(250MB) allowed per file');
        error.statusCode = 403;
        error.name = 'File Size Limit Exceeded'
        throw error;
    }   
};

/**
 * 
 * @param {Array} files 
 */
function validateArchiveSize(files) {
    const sum = files.reduce((result, size) => result + size);
    if(sum > MAX_ARCHIVE_SIZE) {
        const error = new Error('Upload failed because exceeds the MAX upload files size(800MB)');
        error.statusCode = 403;
        error.name = 'Upload Size Limit Exceeded'
        throw error;
    } 
};
   
module.exports = {
    getFilesFromRequest,
    validateFilesSize,
    validateArchiveSize
};