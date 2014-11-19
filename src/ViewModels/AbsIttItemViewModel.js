'use strict';

/*global require,URI*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var objectToQuery = require('../../third_party/cesium/Source/Core/objectToQuery');

var CatalogItemViewModel = require('./CatalogItemViewModel');
var CsvItemViewModel = require('./CsvItemViewModel');
var inherit = require('../Core/inherit');
var loadText = require('../../third_party/cesium/Source/Core/loadText');
var MetadataViewModel = require('./MetadataViewModel');

/**
 * A {@link CatalogItemViewModel} representing region-mapped data obtained from the Australia Bureau of Statistics
 * (ABS) ITT query interface.  Documentation for the query interface is found here: http://stat.abs.gov.au/itt/r.jsp?api
 *
 * @alias AbsIttItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var AbsIttItemViewModel = function(application) {
    CatalogItemViewModel.call(this, application);

    this._csvViewModel = undefined;

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
     * @type {Array}
     */
    this.filter = [];

    knockout.track(this, ['url', 'dataSetID', 'regionType', 'filter']);
};

inherit(CatalogItemViewModel, AbsIttItemViewModel);

defineProperties(AbsIttItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AbsIttItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'abs-itt';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf AbsIttItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'ABS.Stat';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf AbsIttItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            var result = new MetadataViewModel();
            result.isLoading = false;
            result.dataSourceErrorMessage = 'This data source does not have any details available.';
            result.serviceErrorMessage = 'This service does not have any details available.';
            return result;
        }
    }
});

AbsIttItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.dataSetID, this.regionType, this.filter];
};

AbsIttItemViewModel.prototype._load = function() {
    this._csvViewModel = new CsvItemViewModel(this.application);

    var baseUrl = cleanAndProxyUrl(this.application, this.url);
    var parameters = {
        method: 'GetGenericData',
        datasetid: this.dataSetID,
        and: createAnd(this),
        or: 'REGION',
        format: 'csv'
    };

    var url = baseUrl + '?' + objectToQuery(parameters);

    var that = this;
    return loadText(url).then(function(text) {
        // Rename the 'REGION' column to the region type.
        text = text.replace(',REGION,', ',' + that.regionType + ',');
        that._csvViewModel.data = text;
        return that._csvViewModel.load();
    });
};

AbsIttItemViewModel.prototype._enable = function() {
    if (defined(this._csvViewModel)) {
        this._csvViewModel._enable();
    }
};

AbsIttItemViewModel.prototype._disable = function() {
    if (defined(this._csvViewModel)) {
        this._csvViewModel._disable();
    }
};

AbsIttItemViewModel.prototype._show = function() {
    if (defined(this._csvViewModel)) {
        this._csvViewModel._show();
    }
};

AbsIttItemViewModel.prototype._hide = function() {
    if (defined(this._csvViewModel)) {
        this._csvViewModel._hide();
    }
};

function cleanAndProxyUrl(application, url) {
    return proxyUrl(application, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

function createAnd(viewModel) {
    var and = viewModel.filter.slice();
    and.unshift('REGIONTYPE.' + viewModel.regionType);
    return and.join(',');
}

module.exports = AbsIttItemViewModel;
