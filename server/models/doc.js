'use strict';

const debug = require('debug')('server:zip-file-manager:doc');
debug.log = console.log.bind(console);
const HelperService = require('../services/helpers.service');

module.exports = function (Doc) {

  Doc.compressMultipleFiles = async function (ctx) {
    try {
      debug('Starting compresing multiple files upload');
      const files = await HelperService.getFilesFromRequest(ctx.req);
      HelperService.validateFilesSize(files);
      HelperService.validateArchiveSize(files);
      debug('Succesfuly uploaded %d file', files.length);
      return {
        sucesss: true
      }  
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    };
  };

  Doc.remoteMethod('compressMultipleFiles', {
    accepts: [
      {
        arg: 'ctx',
        type: 'object',
        http: function (ctx) {
          return ctx;
        },
      }
    ],
    returns: [
      {
        arg: 'object',
        root: true,
      },
    ],
    description: 'Method to upload multiple files and archive them',
    name: 'Compress files',
    http: {
      verb: 'post',
      path: '/',
    },
  });
};


