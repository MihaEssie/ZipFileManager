'use strict';

const debug = require('debug')('server:zip-file-manager:helpers');
debug.log = console.log.bind(console);
const multiparty = require('multiparty');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
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
        } else resolve(files[key]);
        if (err) reject(err);
    });
});

/**
 * 
 * @param {Array} files 
 */
function validateFilesSize(files) {
    debug('Validate size limit per uploded file');
    const invalidFiles = files.filter(f => { if (f.size > MAX_FILE_SIZE) return f.originalFilename });
    if (invalidFiles.length) {
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
    debug('Validate size limit for all uploded files');
    const sum = files.reduce((result, f) => result + f.size, 0);
    debug('Total size for all files: %d bytes' , sum);
    if (sum > MAX_ARCHIVE_SIZE) {
        const error = new Error('Upload failed because exceeds the MAX upload files size(800MB)');
        error.statusCode = 403;
        error.name = 'Upload Size Limit Exceeded'
        throw error;
    }
};

/**
 * @param {Array} files
 * @returns {Promise}
 */
const archiveFiles = (files) => {
    debug('Starting archiving uploded files');
    const archive = archiver('zip', { zlib: { level: 9 } });
    const fileName = path.join(__dirname, '../../docs', 'example.zip');
    const output = fs.createWriteStream(fileName);

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
            archive.append(fs.createReadStream(f.path), { name: f.originalFilename })
        });
        output.on('close', () => {
            debug('Zipped %d total bytes', archive.pointer());
            debug('Archiver has been finalized and the output file descriptor has closed.');
            resolve(fileName);
            })
            .on('end', () => {
                debug('Data has been drained');
            });
        archive.finalize();
        debug('Succesfuly archived %d files, archive name: ', files.length, fileName);
    });
};

module.exports = {
    getFilesFromRequest,
    validateFilesSize,
    validateArchiveSize,
    archiveFiles
};