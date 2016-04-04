
var Generator = require('./class_generator.js');

var CAS = new Generator({
    key:'cas',
    command:'cas cas ',
    commandHelp: 'Install CAS authentication to the existing installation',
    parameters:['[options]'],
    newText:'Adding CAS authentication to sails...',
    usesTemplates:false
});


module.exports = CAS;



CAS.help = function() {

    this.showMoreHelp(    {
        commandFormat:'appdev cas',
        description:[ 
            'This command steps you through the process of installing CAS as an authentication',
            '    mechanism for your sails project.'

        ].join('\n'),
        parameters:[
        
        ],

        examples:[
            '> appdev cas ',
            '    // installs cas into the current SailsJS project ',
            '',
        ]
    });

}

var util = null;
var fs = require('fs');
var path = require('path');
var AD = require('ad-utils');


CAS.prepareTemplateData = function () {
    util = this.adg;
    var _this = this;


    this.templateData = {};

    this.parseAllowedOptions(['baseURL', 'pgtURL', 'guidKey'], function(key,values) {

        _this.options.settings = _this.options.settings || {};
        _this.options.settings[key] = values.join(':'); // ['http', '//my/url/here'] => 'http://my/url/here'
    })

//    this.templateData.appName = this.options.application || '?notFound?';
//    this.templateData.ControllerName = this.options.name || '?resourceNotFound?';

    util.debug('templateData:');
    util.debug(this.templateData);

};



CAS.postTemplates = function() {

    var self = this;
    var remainingSteps;

    remainingSteps = [
        'authQuestions',    // Ask the Questions for CAS Auth
        'updateAuthType',   // update /config/appdev.js authType = 'CAS',
        'addConfigDocs'     // add config/cas.js for documentation
    ];


    this.methodStack(remainingSteps, function() {

        // when they are all done:
        util.log();
        util.log('<yellow>updated CAS authentication.</yellow>');
        util.log('<yellow> > edit config/cas.js  to configure the cas settings.</yellow>');
        util.log();
        util.log();

    });

};



CAS.authQuestions = function( done ) {
    var _this = this;


    function doStuff (data) {

        var patchSet = [
            {  file:path.join('config', 'local.js'), tag:"\n}", template:'__config_auth_cas.ejs', data:data },
        ];
        _this.patchFile( patchSet, function() {

            if (done) done();
        });
    }


    this.checkSettings(['baseURL', 'pgtURL', 'guidKey'], doStuff, function() { 

        var qset =  {
            question: 'what is the base url to your cas server:',
            data: 'baseURL',
            def : 'https://signin.example.com:443/cas',
    //        post: function(data) { data.adaptor = data.adaptor.toLowerCase(); }
            then:[
                    {   
                        question:'what is the url for your pgt server:',
                        data:'pgtURL',
                        def :'none'
                    },
                    {   
                        question:'what is the key for your guid in the server\'s response:',
                        data:'guidKey',
                        def :'id'
                    },
            ]
        };
        _this.questions(qset, function(err, data) {
            if (err) {
                 process.exit(1);
            } else {

                doStuff(data);
            }

        });
    });
};



CAS.updateAuthType = function (done) {

    // we need to patch the config/appdev.js file to mark authType="CAS"
    var regex = /["']authType["']\s*:\s*[^,]+/;
    var patchSet = [
        {  file:path.join('config', 'appdev.js'), tag:regex, replace: "'authType': 'CAS'"  },
        {  file:path.join('config', 'appdev.js'), tag:"[[authType]]", replace: 'CAS'  },
    ];
    this.patchFile( patchSet, function() {

        if (done) done();
    });

};


CAS.addConfigDocs = function (done) {
    
    this.copyContent([
        {
            file: path.join('config', 'cas.js'),
            template: '__config_auth_cas_doc.ejs'
        }
    ], done);

};

