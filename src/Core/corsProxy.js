"use strict";

/*global require,URI*/

var defined = require('../../third_party/cesium/Source/Core/defined');

var corsProxyHost = '';

var corsProxy = {
    getURL : function(resource, proxyFlag) {
        var flag = (proxyFlag === undefined) ? '' : '_' + proxyFlag + '/';
        return corsProxyHost + '/proxy/' + flag + resource;
    },
    corsDomains : [],
    useProxy : false,
		setProxyHost : function(proxyHost) {
			corsProxyHost = proxyHost;
		}
};

corsProxy.shouldUseProxy = function(url) {
    var uri = new URI(url);
    var host = uri.host();
    return (corsProxy.useProxy && proxyAllowedHost(host, corsProxy.corsDomains));
};

// Check host against the list supplied in domains
function proxyAllowedHost(host, domains) {
    if (!defined(domains)) {
        return false;
    }

    host = host.toLowerCase();
    //check that host is from one of these domains
    for (var i = 0; i < domains.length; i++) {
        if (host.indexOf(domains[i], host.length - domains[i].length) !== -1) {
            return true;
        }
    }
    return false;
}

module.exports = corsProxy;
