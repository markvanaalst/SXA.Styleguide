const gulp = require('gulp')
const { getTask, login, configUtils, setUserData } = require('@sxa/celt');
global.rootPath = __dirname;
global.configUtils = configUtils;
const watchCssTasks = getTask('watchCss')
const watchSassTasks = getTask('watchSass');
const watchJSTasks = getTask('watchJS');
const watchESTasks = getTask('watchES');
const watchHtmlTasks = getTask('watchHtml');
const watchImgTasks = getTask('watchImg');
const watchScribanTasks = getTask('watchScriban');
const watchSassSourceTasks = getTask('watchSassSource');
const cssOptimizationTasks = getTask('cssOptimization');
const sassComponentsTasks = getTask('sassComponents');
const eslintTasks = getTask('eslint');
const jsOptimizationTasks = getTask('jsOptimization');
const sassStylesTasks = getTask('sassStyles');
const spritesTasks = getTask('sprites');
const uploadJsTasks = getTask('uploadJS');
const uploadCssTasks = getTask('uploadCss');
const uploadImgTasks = getTask('uploadImg');
const uploadGulpConfigTasks = getTask('uploadGulpConfig');


//Watch
module.exports.watchCss = gulp.series(login, watchCssTasks);
module.exports.watchJs = gulp.series(login, watchJSTasks);
module.exports.watchEs = gulp.series(login, watchESTasks);
module.exports.watchHtml = gulp.series(login, watchHtmlTasks);
module.exports.watchScriban = gulp.series(login, watchScribanTasks);
module.exports.watchImg = gulp.series(login, watchImgTasks);
//Watch SASS
module.exports.watchSassComponents = gulp.series(login, watchSassTasks.watchComponents);
module.exports.watchSassBase = gulp.series(login, watchSassTasks.watchBase);
module.exports.watchSassStyles = gulp.series(login, watchSassTasks.watchStyles);
module.exports.watchSassDependency = gulp.series(login, watchSassTasks.watchDependency);
module.exports.watchSass = gulp.series(login,
	gulp.parallel(
		watchSassTasks.watchStyles,
		watchSassTasks.watchBase,
		watchSassTasks.watchComponents,
		watchSassTasks.watchDependency
	)
);
module.exports.watchSassSource = gulp.series(login,
	gulp.parallel(
		watchSassTasks.watchStyles,
		watchSassTasks.watchBase,
		watchSassTasks.watchComponents,
		watchSassTasks.watchDependency,
		watchSassSourceTasks
	)
);

module.exports.default = module.exports.watchAll = gulp.series(login,
	gulp.parallel(
		watchHtmlTasks,
		watchCssTasks,
		watchJSTasks,
		watchESTasks,
		watchImgTasks,
		watchScribanTasks,
		watchSassTasks.watchStyles,
		watchSassTasks.watchBase,
		watchSassTasks.watchComponents,
		watchSassTasks.watchDependency,
		watchSassSourceTasks
	)
);

// //Build
module.exports.buildJs = gulp.series(jsOptimizationTasks)
module.exports.buildCss = gulp.series(cssOptimizationTasks)
module.exports.buildSass = gulp.series(sassComponentsTasks);
module.exports.buildStyles = gulp.series(
	sassComponentsTasks,
	cssOptimizationTasks

);
module.exports.buildAll = gulp.series(
	jsOptimizationTasks, sassComponentsTasks, cssOptimizationTasks
);
module.exports.buildSassStyles = gulp.series(sassStylesTasks);
module.exports.buildEslint = gulp.series(eslintTasks);
module.exports.buildSpriteFlag = gulp.series(spritesTasks);
//
// Upload

module.exports.uploadAll = gulp.series(login, uploadJsTasks, uploadCssTasks, uploadImgTasks);
module.exports.uploadJs = gulp.series(login, uploadJsTasks);
module.exports.uploadCss = gulp.series(login, uploadCssTasks);
module.exports.uploadImg = gulp.series(login, uploadImgTasks);
module.exports.uploadGulpConfig = gulp.series(login, uploadGulpConfigTasks);

// Build + upload
module.exports.rebuildAll = gulp.series(
	login,
	jsOptimizationTasks, sassComponentsTasks, cssOptimizationTasks,
	uploadJsTasks, uploadCssTasks, uploadImgTasks
)
module.exports.rebuildMain = gulp.series(
	login,
	jsOptimizationTasks, sassComponentsTasks, cssOptimizationTasks,
	uploadJsTasks, uploadCssTasks
)





