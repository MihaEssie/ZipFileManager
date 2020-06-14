'use strict';

module.exports = function(Doc) {

  Doc.compressMultipleFiles = async function(ctx) {

  };

  Doc.remoteMethod('compressMultipleFiles', {
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
    

