steal(
        'appdev',
        '<%= appName %>/models/base/<%= ModelName %>.js',
function(){

    // Namespacing conventions:
    // AD.Model.extend('[application].[Model]', {static}, {instance} );  --> Object
    AD.Model.extend('<%= correctModelName %>', {
/*
        findAll: 'GET /<%= modelURL %>',
        findOne: 'GET /<%= modelURL %>/{id}',
        create:  'POST /<%= modelURL %>',
        update:  'PUT /<%= modelURL %>/{id}',
        destroy: 'DELETE /<%= modelURL %>/{id}',
        describe: function() {},   // returns an object describing the Model definition
        fieldId: 'id',             // which field is the ID
        fieldLabel:'<%= fieldLabel %>'      // which field is considered the Label
*/
    },{
/*
        // Already Defined:
        model: function() {},   // returns the Model Class for an instance
        getID: function() {},   // returns the unique ID of this row
        getLabel: function() {} // returns the defined label value
*/
    });


});