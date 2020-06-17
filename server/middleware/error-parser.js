'use strict';
let debug = require('debug')('middlerware:zip-file-manager:error-parser');

module.exports = function(options) {
  return function parseError(err, req, res, next) {
    debug('Request failed: %o', err);
    if (
       err.statusCode === 401 ||
       err.status === 401 ||
       err.statusCode === 403 ||
       err.status === 403 ||
       err.statusCode === 404 ||
       err.status === 404 ||
       err.statusCode === 400 ||
       err.status === 400 ||
       err.statusCode === 410 ||
       err.status === 410 ||
       err.statusCode === 426 ||
       err.status === 426
    ) {
      next(err);
    } else {
      const error = new Error('Internal server error');
      error.statusCode = 500;
      error.name = 'INTERNAL_SERVER_ERROR';
      next(error);
    }
  };
};
