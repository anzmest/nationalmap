"use strict";

var appProxyHost = '';

var appProxy = {
    getURL : function(resource) {
        return appProxyHost + resource;
    },
		setProxyHost : function(proxyHost) {
				appProxyHost = proxyHost;
		}
};

module.exports = appProxy;
