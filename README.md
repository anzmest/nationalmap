
National Map Embedded in GeoNetwork
===================================

This is the NICTA National Map project embedded in GeoNetwork (ANZMEST). It replaces the (rather 
dated and somewhat tired) extjs open layers map interface with a 3D gfx globe interface
that uses webGL and provides access to many basic web map data layers in Australia.

National map consists of:

- a server side (varnish and a server side js interface) for retrieving and caching map tiles, and;
- a client side (js) which is embedded in GeoNetwork 2.10.4 and appears in the 'Map' tab

To run national map you need to be using Linux as the server side uses varnish and is started using
a shell script. You may be able to get it working under windows but you would need to do that 
manually.

Basic installation instructions for ANZMEST GeoNetwork 2.10.4 
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Assuming you've already installed anzmest!

Client side
-----------

- the client side needs no installation as it is part of anzmest and is located in directory 

webapps(or web)/geonetwork/apps/nationalmap

- you should configure the hostnames and ports used by the web map image and tile proxies 
in nationalmap/public/config.json 
- the GeoNetwork proxy (proxyHost setting) is used for all web map servers that don't support cors (common origin request system) - if in doubt assume that your web map server does *not* support cors and that it will be accessed through the geonetwork proxy. 
- the corsProxy host (corsProxyHost setting) is the hostname and address of the national map server side. You should try to access as many web map servers as possible through the national map server side because it caches the web map images and tiles and uses a fast multithreaded proxy server (varnish). This can make rendering web maps much faster and should reduce the load on the web map servers you are using.

Server side
-----------

As mentioned above, the nationalmap server side is a caching, multi-threaded proxy server. It's 
purpose is to speed up web map rendering by caching web maps and using a multi-threaed server 
to fetch and supply those web maps as quickly as possible. It is a java script server side 
application and runs in conjunction with varnish, an open source, web proxy server. Java
script server side uses node and the node package manager (npm).

- node and the node modules required to run the nationalmap server are installed with anzmest in directory:

webapps(or web)/geonetwork/apps/nationalmap

- to start the national map server side, execute the script run_server.sh using the port number you configured for the client side.

It is possible to run the nationalmap server side on a different machine to that on which you run 
GeoNetwork. If you want to do this then you will need to copy the nationalmap directory to that
machine, configure the client side with the host name and port number, and then start up the 
national map server side on that port.

More about [National Map](http://nationalmap.nicta.com.au).

Check the [wiki](https://github.com/NICTA/ausglobe/wiki) for 
more information about National Map.
