'use strict';

const debug = require('debug')('server:zip-file-manager:helpers');
debug.log = console.log.bind(console);
const multiparty = require('multiparty');

/**
 * @param {Object} req
 * @return {Promise}
 */
const getFilesFromRequest = (req) => new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        let key = files !== undefined ? Object.keys(files)[0] : undefined;
        if (files === undefined) {
            const error = new Error('Bad Request Error');
            error.statusCode = 400;
            error.name = 'Missing required files';
            reject(error);
        } else  resolve(files[key]);
        if(err) reject(err);
    });
});
   
module.exports = {
    getFilesFromRequest,
};