'use strict';

const debug = require('debug')('server:zip-file-manager:doc');
debug.log = console.log.bind(console);

const HelperService = require('../services/helpers.service');
const ARCHIVES_BUCKET_NAME = process.env.ARCHIVES_BUCKET_NAME;

module.exports = function (Doc) {

  Doc.archiveMultipleFiles = async function (ctx, res) {
    try {
      debug('Starting compresing multiple files upload');

      const result = await HelperService.getFilesFromRequest(ctx.req);
      HelperService.validateFilesSize(result.files);
      HelperService.validateArchiveSize(result.files);

      debug('Succesfully uploaded %d file', result.files.length);
      const zipArchiveName = await HelperService.archiveFiles(result.files, result.userId);

      debug('Saving archive into Cloud Object Storage');
      const cos = HelperService.configObjectStorage();
      const uploadedFilePath = await HelperService.uploadFileToCOS(cos, ARCHIVES_BUCKET_NAME, zipArchiveName);
      debug('Succesfully uploaded archive file to Cloud Object Storage - path: %s for userId: %s', uploadedFilePath, result.userId);

      const response = HelperService.configAPIResponse(res, zipArchiveName);
      debug('Succesfully sent archive: %s for user: %s', zipArchiveName, result.userId);
      return response;
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    };
  };

  Doc.remoteMethod('archiveMultipleFiles', {
    accepts: [
      {
        arg: 'ctx',
        type: 'object',
        http: function (ctx) {
          return ctx;
        },
      },
      {
        arg: 'response',
        type: 'object',
        http: {
          source: 'res',
        }
      }
    ],
    returns: [
      {
        arg: 'object',
        root: true,
      },
    ],
    description: 'Method to upload multiple files and archive them',
    name: 'Archive files',
    http: {
      verb: 'post',
      path: '/',
    },
  });
};


