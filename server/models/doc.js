'use strict';

const debug = require('debug')('server:zip-file-manager:doc');
debug.log = console.log.bind(console);

const HelperService = require('../services/helpers.service');
const ARCHIVES_BUCKET_NAME = process.env.ARCHIVES_BUCKET_NAME;

module.exports = function (Doc) {

  Doc.archiveMultipleFiles = async function (ctx, res) {
    try {
      debug('Starting compresing multiple files upload');
      const userId = 'Miha'; // to do: add token and take the userId
      const files = await HelperService.getFilesFromRequest(ctx.req);
      HelperService.validateFilesSize(files);
      HelperService.validateArchiveSize(files);

      debug('Succesfully uploaded %d file', files.length);
      const zipArchiveName = await HelperService.archiveFiles(files, userId);

      debug('Saving archive into Cloud Object Storage');
      const cos = HelperService.configObjectStorage();
      const uploadedFilePath = await HelperService.uploadFileToCOS(cos, ARCHIVES_BUCKET_NAME, zipArchiveName);
      debug('Succesfully uploaded archive file to Cloud Object Storage - path: %s for userId: %s', uploadedFilePath, userId);

      return HelperService.configAPIResponse(res, zipArchiveName);

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


