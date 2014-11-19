'use strict';

/*global require,URI*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var objectToQuery = require('../../third_party/cesium/Source/Core/objectToQuery');

var AbsIttItemViewModel = require('./AbsIttItemViewModel');
var ViewModelError = require('./ViewModelError');
var CatalogGroupViewModel = require('./CatalogGroupViewModel');
var inherit = require('../Core/inherit');

/**
 * A {@link CatalogGroupViewModel} representing a collection of items from an Australian Bureau of Statistics
 * (ABS) ITT server, formed by querying for all the codes in a given dataset and concept.
 *
 * @alias AbsIttGroupViewModel
 * @constructor
 * @extends CatalogGroupViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var AbsIttGroupViewModel = function(application) {
    CatalogGroupViewModel.call(this, application);

    /**
     * Gets or sets the URL of the ABS ITT API, typically http://stat.abs.gov.au/itt/query.jsp.
     * This property is observable.
     * @type {String}
     */
    this.url = undefined;

    /**
     * Gets or sets the ID of the ABS dataset.  You can obtain a list of all datasets by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetList (or equivalent).  This property
     * is observable.
     * @type {String}
     */
    this.dataSetID = undefined;

    /**
     * Gets or sets the ABS region type to query.  You can obtain a list of all available region types for
     * a dataset by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=REGIONTYPE&format=json
     * (or equivalent).  This property is observable.
     * @type {String}
     */
    this.regionType = undefined;

    /**
     * Gets the list of additional concepts and values on which to filter the data.  You can obtain a list of all available
     * concepts for a dataset by querying http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B25
     * (or equivalent) and a list of the possible values for a concept by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetCodeListValue&datasetid=ABS_CENSUS2011_B25&concept=MEASURE&format=json.
     * This property is observable.
     * @type {String[]}
     */
    this.filter = [];

    /**
     * Gets or sets the concept to query.  Each code/value in this concept becomes an item in this group.
     * You can obtain a list of all available concepts for a dataset by querying
     * http://stat.abs.gov.au/itt/query.jsp?method=GetDatasetConcepts&datasetid=ABS_CENSUS2011_B25
     * (or equivalent).  This property is observable.
     * @type {String}
     */
    this.queryConcept = undefined;

    /**
     * Gets or sets a description of the custodian of the data sources in this group.
     * This property is an HTML string that must be sanitized before display to the user.
     * This property is observable.
     * @type {String}
     */
    this.dataCustodian = undefined;

    knockout.track(this, ['url', 'dataSetID', 'regionType', 'filter', 'queryConcept', 'dataCustodian']);
};

inherit(CatalogGroupViewModel, AbsIttGroupViewModel);

defineProperties(AbsIttGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AbsIttGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'abs-itt-by-concept';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf AbsIttGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ABS.Stat Concept Group';
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf AbsIttGroupViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return AbsIttGroupViewModel.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#serializers} property.
 * @type {Object}
 */
AbsIttGroupViewModel.defaultSerializers = clone(CatalogGroupViewModel.defaultSerializers);

AbsIttGroupViewModel.defaultSerializers.items = function(viewModel, json, propertyName, options) {
    // Only serialize minimal properties in contained items, because other properties are loaded by querying ABS.Stat.
    var previousSerializeForSharing = options.serializeForSharing;
    options.serializeForSharing = true;

    // Only serlize enabled items as well.  This isn't quite right - ideally we'd serialize any
    // property of any item if the property's value is changed from what was loaded from GetCapabilities -
    // but this gives us reasonable results for sharing and is a lot less work than the ideal
    // solution.
    var previousEnabledItemsOnly = options.enabledItemsOnly;
    options.enabledItemsOnly = true;

    var result = CatalogGroupViewModel.defaultSerializers.items(viewModel, json, propertyName, options);

    options.enabledItemsOnly = previousEnabledItemsOnly;
    options.serializeForSharing = previousSerializeForSharing;

    return result;
};

freezeObject(AbsIttGroupViewModel.defaultSerializers);

AbsIttGroupViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

AbsIttGroupViewModel.prototype._load = function() {
    var baseUrl = cleanAndProxyUrl(this.application, this.url);
    var parameters = {
        method: 'GetCodeListValue',
        datasetid: this.dataSetID,
        concept: this.queryConcept,
        format: 'json'
    };

    var url = baseUrl + '?' + objectToQuery(parameters);

    var that = this;
    return loadJson(url).then(function(json) {
        // TODO: Create items in a hierarchy that matches the code hierarchy.  The UI can't handle this right now.

        // Skip the last code, it's just the name of the dataset.
        var codes = json.codes;
        for (var i = 0; i < codes.length - 1; ++i) {
            that.items.push(createItemForCode(that, codes[i]));
        }
    }).otherwise(function(e) {
        throw new ViewModelError({
            sender: that,
            title: 'Group is not available',
            message: '\
An error occurred while invoking GetCodeListValue on the ABS ITT server.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>This error may also indicate that the server does not support <a href="http://enable-cors.org/" target="_blank">CORS</a>.  If this is your \
server, verify that CORS is enabled and enable it if it is not.  If you do not control the server, \
please contact the administrator of the server and ask them to enable CORS.  Or, contact the National \
Map team by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a> \
and ask us to add this server to the list of non-CORS-supporting servers that may be proxied by \
National Map itself.</p>\
<p>If you did not enter this link manually, this error may indicate that the group you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening the group again, and if the problem persists, please report it by \
sending an email to <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.</p>'
        });
    });
};

function cleanAndProxyUrl(application, url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');

    var cleanedUrl = uri.toString();
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(cleanedUrl)) {
        cleanedUrl = application.corsProxy.getURL(cleanedUrl, '1d');
    }

    return cleanedUrl;
}

function createItemForCode(viewModel, code) {
    var result = new AbsIttItemViewModel(viewModel.application);

    result.name = code.description;
    result.description = code.description;
    result.dataCustodian = viewModel.dataCustodian;
    result.url = viewModel.url;
    result.dataSetID = viewModel.dataSetID;
    result.regionType = viewModel.regionType;
    result.filter = viewModel.filter.slice();

    result.filter.push(viewModel.queryConcept + '.' + code.code);

    return result;
}

module.exports = AbsIttGroupViewModel;