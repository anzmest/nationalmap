"use strict";

/*global require*/

var start = true;

var PopupMessage = require('./viewer/PopupMessage');
var FeatureDetection = require('../third_party/cesium/Source/Core/FeatureDetection');
var WebMapServiceItemViewModel = require('./ViewModels/WebMapServiceItemViewModel');

// If we're not in a normal browser environment (Web Worker maybe?), do nothing.
if (typeof window === 'undefined') {
    start = false;
} else {
    if (FeatureDetection.isInternetExplorer() && FeatureDetection.internetExplorerVersion()[0] < 9) {
        PopupMessage.open({
            container : document.body,
            title : 'Internet Explorer 8 or earlier detected',
            message : '\
    National Map requires Internet Explorer 9 or later.  For the best experience, we recommend \
    <a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
    <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
    <a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        });

        start = false;
    }
}

if (start) {
    // IE9 doesn't have a console object until the debugging tools are opened.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }

		var prefix = "../../apps/nationalmap/public/";
    window.CESIUM_BASE_URL = prefix + 'build/Cesium/';
    window.NATIONALMAP_URL = prefix;
		window.ga = function() {}; // f'ing google analytics - avoid.....

    var copyright = require('./CopyrightModule'); // jshint ignore:line

    var SvgPathBindingHandler = require('../third_party/cesium/Source/Widgets/SvgPathBindingHandler');
    var knockout = require('../third_party/cesium/Source/ThirdParty/knockout');

    var AusGlobeViewer = require('./viewer/AusGlobeViewer');
    var ApplicationViewModel = require('./ViewModels/ApplicationViewModel');
    var KnockoutSanitizedHtmlBinding = require('./viewer/KnockoutSanitizedHtmlBinding');
    //var raiseErrorToUser = require('./ViewModels/raiseErrorToUser');
    var registerCatalogViewModels = require('./ViewModels/registerCatalogViewModels');

    SvgPathBindingHandler.register(knockout);
    KnockoutSanitizedHtmlBinding.register(knockout);
    registerCatalogViewModels();

    var application = new ApplicationViewModel();

		// prepare some global view model objects for other apps to use, in this case geonetwork
		window.nmObjects = {
			nmApplicationViewModel: application,
			viewModels: {
				webMapServiceItemViewModel: WebMapServiceItemViewModel
			}
		};

    application.catalog.isLoading = true;

    application.error.addEventListener(function(e) {
        PopupMessage.open({
            container: document.body,
            title: e.title,
            message: e.message
        });
    });

    application.start({
        applicationUrl: window.location,
        //configUrl: '../../apps/nationalmap/public/config.json', 
        configUrl: '../../srv/eng/info@json?&type=config',  // geonetwork service
        initializationUrl: '../../apps/nationalmap/public/init_nm.json',
        useUrlHashAsInitSource: true
    //}).otherwise(function(e) {
				//console.log(JSON.stringify(e));
        //raiseErrorToUser(application, e);
    }).always(function() {
        // Watch the hash portion of the URL.  If it changes, try to interpret as an init source.
        window.addEventListener("hashchange", function() {
            application.updateApplicationUrl(window.location);
        }, false);

        application.catalog.isLoading = false;

        AusGlobeViewer.create(application);

        document.getElementById('loadingIndicator').style.display = 'none';
    });
}
