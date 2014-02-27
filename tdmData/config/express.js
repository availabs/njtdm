module.exports.express = {
    bodyParser: function() {
        return require('express').bodyParser({limit: '900mb'});
    }
};