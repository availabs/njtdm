/**
 * UploadsController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


module.exports = {

	gtfsupload:function (req,res) {
            // imageVersions are taken from upload.configure()
            upload.fileHandler({
			    uploadDir: __dirname + '/uploads',
			    uploadUrl: '/data/gtfs/upload'
			})(req,res);
    }
	
};

