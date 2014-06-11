
var fs = require('fs');
var path = require('path');


var util = null;

var Generator = require('./class_generator.js');

var Resource = new Generator({
    key:'page',
    command:'p page [pageName] [layout:[key]] [zone:1:Controller1+Model1,Controller2,...] ',
    commandHelp: 'create a page that displays the given controllers & models',
    parameters:['pageName', '[options]']
});


module.exports = Resource;


Resource.prepareTemplateData = function () {
    util = this.adg;

    this.templateData = {};
    this.templateData.pageName = this.options.pageName || '?notFound?';


    this.templateData.Title = '<%= Title %>';
    this.templateData.Description = '<%= Description %>';


    this.templateData.layout = 'crudlist';
    this.templateData.controllers = [];
    this.templateData.modelList = [];


    var config = this.configureOpts();

//console.log(config);

    this.templateData.layout = config.layout || 'crudlist';
    switch(this.templateData.layout) {

        //// method1:  appdev page [name] crudlist model:[model]
        //// method1b: appdev page [name] crudlist
        //// method1c: appdev page [name]
        case 'crudlist':

            //// values for our /view/page/[pageName].ejs file
            this.templateData.view = {};
            this.templateData.view.divs={'list':''};  // our crudlist will attach to '#list'


            //// values for our /assets/pages/[pageName]/router.js template
            this.templateData.router = {};
            this.templateData.router.models = [];
            if (config.model) this.templateData.router.models.push(config.model);
            this.templateData.router.controllers = [];
            this.templateData.router.controllers.push('appdev/widgets/ad_list_crud');

            // router config setup:
            if (config.model) {
            var modelParts = config.model.split('/');
            var fileName = modelParts[modelParts.length-1];
            var nameParts = fileName.split('.');
            var modelName = nameParts[0];
            } else {
                modelName = null;
            }

//console.log('modelParts:');
//console.log(modelParts);
//console.log('modelName['+modelName+']');
            var setupObj = {
                    controller: {
                        Class:'AD.widgets.ad_list_crud',
                        Var: 'list'
                    },
                    divID:'list'
            };
            if (config.model) {
                setupObj.model = {
                        Class:'AD.models.'+modelName,
                        name:modelName
                    }
                setupObj.view_add = 'pages/'+this.templateData.pageName+'/'+modelName+'_add.ejs';
            } else {
                setupObj.model = null;
                setupObj.view_add = 'pages/'+this.templateData.pageName+'/entry_add.ejs';
            }
            this.templateData.router.setup= [setupObj];

            break;


        case '1col':
            // appdev page [name] 1col /app/controllers/controller1  /app/controllers/controller2+/app/model/model2

            break;
    }


//console.log(this.templateData);


    // method2:  appdev page [name] layout:[layout] zone:1:Controller1+Model1,...,ControllerN  zone:2:Controller1, ... , ControllerN



//    this.templateData.filename = path.resolve(__dirname, '../..', 'templates/page/views/page/somefile.js');

    util.debug('templateData:');
    util.debug(this.templateData);


}



Resource.configureOpts = function () {

    var config = {zone:{}};

    for (var o in this.options.options) {

        var option = this.options.options[o];

        var parts = option.split(":");
        var Key = parts.shift();
        var key = Key.toLowerCase();

        switch(key) {
            case 'layout':
                // option:  layout:[layoutName]
                config[key] = parts.shift();
                break;

            case 'model':
                // option:  model:[modelName]
                config[key] = parts.shift();
                break;

            case 'zone':
                // zone:number:/path/to/controller+path/to/model,path/to/controller2
                var num = parts.shift();
                var list = parts.shift();

                if(!(config.zone[num])) config.zone[num] = {};

                var items = list.split(',');
                for (var i in items) {

                    var set = items[i].split('+');   // controller+model
                    config.zone[num][set[0]]= set[1] || '';
                }
                break;

            default:
                // no prefix:
                // must follow format  appdev page [name] [layout] [model] [controller+model]
                if (!config.layout) {

                    config.layout = key;

                } else {

                    if (config.layout == 'crudlist') {

                        // then assume this the model
                        // appdev page [name] crudlist /app/models/model

                        config.model = Key; // use the Uppercase version

                    } else {

                        // if this was a layout == 1col, then we could be stacking controllers
                        // appdev page [name] 1col /app/controllers/controller1  /app/controllers/controller2+/app/model/model2

                    }
                }


                break;
        }

    }

    return config;

}



Resource.perform = function () {
    util = this.adg;
    var self = this;

    util.log( 'Creating a new web page: ');
    util.debug('page.perform():  params ');
    util.debug(this.params);

    // grab our current location
    this.cwd = process.cwd();
    util.verbose('cwd:'+this.cwd);


    // parse Options
    this.parseOptions();

    util.debug('the provided cmd line options:');
    util.debug(this.options);

    if (this.options.pageName) {


        // if directory exist
        var pagePath = path.join('assets', 'pages', this.options.pageName);
        if (fs.existsSync( pagePath ) )  {

            util.log('<yellow>directory '+pagePath + ' already exists.</yellow>');
            util.log('<yellow>Use this command for new pages only.</yellow>');

            process.exit(1);

        }


        // define the series of methods to call for the setup process
        var setupProcess = [
                        'installSailsController',
                        'copyTemplates',
                        'createAddView',
                        'patchFiles'
//                        'installTemplates',
        ];


        this.methodStack(setupProcess, function() {

            // when they are all done:


            util.log('pages created.');
            util.log();
            util.log('<yellow>access your page at:  /page/'+self.options.pageName+'</yellow>');
            util.log();

            process.chdir(self.cwd);
        });

    }  // end if options.dirName


}



Resource.installSailsController = function (done) {

    var self = this;

    var pathToController = path.join('api', 'controllers', 'PageController.js');

    if (fs.existsSync( pathToController ) ) {

        util.log('<white><bold>exists:</bold>'+pathToController+'</white>');
        if (done) done();

    } else {


 //       util.log('creating new SailJS controller :'+this.options.pageName);

        var params = [ 'generate', 'controller', 'Page'];

        this.shell('sails', params, [], function(){

            util.log('<green><bold>created:</bold>'+pathToController+'</green>');

            var replaceData = ['var fs = require("fs");', 'var path = require("path");', '', 'module.exports = {'].join('\n');
            var patchSet = [
                     {  file:pathToController, tag:"};", template:'__page_pagecontroller_pageAsset.ejs', data:{} },
                     {  file:pathToController, tag:"module.exports = {", replace:replaceData },
                     {  file:path.join('config', 'routes.js'), tag:"};", replace:"  , 'get /page/*/*': 'PageController.pageAsset'\n\n};"  }
                         ];
            self.patchFile( patchSet, function() {

                if (done) done();
            });

        });

    }
}



Resource.createAddView = function (done) {

    var self = this;

    var batch = [];
    for (var s in this.templateData.router.setup) {

        var entry = this.templateData.router.setup[s];

        // if a model was provided then:
        if (entry.model) {

            // create a form for that model
            batch.push({
                cmd:'appdev',
                params:['form', entry.model.name, entry.view_add ],
                filter:['Creating'],
                log: 'creating view '+entry.view_add
            });

        } else {

            // just push a generic view file
            batch.push({
                cmd:'appdev',
                params:['viewUI', entry.view_add ],
                filter:['Creating'],
                log: 'creating view '+entry.view_add
            });
        }

    }

    this.batchShell(batch, done);


}



Resource.copyTemplates = function (done) {

    var self = this;



    this.prepareTemplateData();
    this.parseTemplates();

    if(done) done();
}



Resource.patchFiles = function (done) {

    var self = this;

    var pathToController = path.join('api', 'controllers', 'PageController.js');

////patch config/local.js to include the local mysql settings
    var patchSet = [ {  file:pathToController, tag:"};", template:'__page_pagecontroller_method.ejs', data:{pageName:this.options.pageName} },
//                     {  file:path.join('assets','pages', this.options.pageName,'router.js'), tag:/(socket\.on\('message'[\s\S]+?)(\}\);)/, replace:"$1\nAD.comm.hub.publish('ad.sails.model.update', message);\n\n$2" },
                   ];
    self.patchFile( patchSet, function() {


        if (done) done();


    });
}



