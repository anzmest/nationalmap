
National Map Embedded in GeoNetwork (ANZMEST 2.10.x)
====================================================

This is the NICTA National Map project embedded in GeoNetwork (ANZMEST). It replaces the (rather 
dated and somewhat tired) extjs open layers map interface with a 3D gfx globe interface
that uses webGL and provides access to many basic web map data layers in Australia.

National map consists of:

- a client side (js) which is embedded in GeoNetwork 2.10.4 and appears in the 'Map' tab, and;
- a server side (varnish and a server side js interface) for retrieving and caching map tiles

Assuming you've already installed anzmest, here is what you need to know in order to get the nationalmap client and server side going:

Client side
-----------

- the client side is installed as part of ANZMEST, it lives in the directory webapps/geonetwork/apps/nationalmap (or web/geonetwork/apps/nationalmap for jetty).

- you can configure the client side from the ANZMEST by looking at the anzmest-config-overrides.xml file in webapps/geonetwork/WEB-INF (or web/geonetwork/WEB-INF if using jetty). The national map client side setting are all in the <nationalmap> tag of that file. Some of these settings are as follows:

*corsProxyHost*

The corsProxy host (corsProxyHost setting - default localhost:3001) is the hostname and address of the national map server side. You should try to access as many web map servers as possible through the national map server side because it caches the web map images and tiles and uses a fast multithreaded proxy server (varnish). This can make rendering web maps much faster and should reduce the load on the web map servers you are using. However, at present the nationalmap server side is only supported on Linux so you should disable the corsProxy module of nationalmap by setting *disableCorsProxy* to "true" if you run GeoNetwork on a windows server.

*proxyHost*

The GeoNetwork proxy (proxyHost - default ../../proxy/) is used for all web map servers that don't support cors (common origin request system) - if in doubt assume that your web map server does *not* support cors and that it will need to be accessed through the geonetwork proxy. If the setting *disableCorsProxy* is set to "true" then the corsProxy will never be used and all proxy requests for web map layers will be done through the GeoNetwork *proxyHost*.

*baseLayer*

By default nationalmap, uses the rather coarse Blue Marble layer from the GeoServer installation that comes with GeoNetwork (default: localhost:8080/geoserver/wms). You can configure an alternative using the baseLayer module. At present the only configirable alternative is bing maps with labels. More options, including OSM, be added shortly.

*terrainProvider*

By default, national map uses the cesium site to obtain terrain heights. In the future, it may be possible to specify different providers and/or a different URL to supply this information.

Server side
-----------

As mentioned above, the nationalmap server side is a caching, multi-threaded proxy server. It's 
purpose is to speed up web map rendering by caching web maps and using a multi-threaed server 
to fetch and supply those web maps as quickly as possible. It is a javascript server side 
application:

- that runs in conjunction with varnish, an open source, web content caching server
- uses nodejs and the nodejs package manager (npm). Nodejs and the node modules required to run the nationalmap server are installed with anzmest in directory:

*webapps/geonetwork/apps/nationalmap (or web/geonetwork/apps/nationalmap for jetty)*

- to start the national map server side, execute the script run_server.sh using the port number you configured for the client side.

It is possible to run the nationalmap server side outside of the directory in which it is installed
GeoNetwork. If you want to do this then you will need to copy the nationalmap directory out of the 
webapp directory, and then start up the national map server side.

More about [National Map](http://nationalmap.nicta.com.au).

Check the [wiki](https://github.com/NICTA/ausglobe/wiki) for 
more information about National Map.
