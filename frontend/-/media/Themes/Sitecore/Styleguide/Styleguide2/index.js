const {gulpTaskInit} = require('@sxa/celt');
global.rootPath = __dirname;

//	Ensure process ends after all Gulp tasks are finished

gulpTaskInit();