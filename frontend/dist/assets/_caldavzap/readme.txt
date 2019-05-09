What you need to know before you start to configure the client:
 1.) principal URL for your server
 2.) what is the difference between cross-domain and non cross-domain setup
 3.) cross-domain setup problems and how to solve them (if you use cross-domain setup)
 4.) digest authentication problems and how to solve them (if your server uses digest auth)
 5.) problems with SSL /https/ and invalid (or self-signed) certificates
 6.) choose your setup type (3 different setup types are supported)
 7.) HTML5 cache update
 8.) Generic installation instruction
 9.) DAViCal (non cross-domain) installation instructions

1.) Your principal URL
    - What is my principal URL?
      Check you server documentation!
      Example principal URLs (<USERNAME> = your username):
        http://davical.server.com/caldav.php/<USERNAME>/ (DAViCal example)
        http://baikal.server.com/card.php/principals/<USERNAME>/ (Baïkal example)
        http://radicale.server.com:5232/<USERNAME>/ (Radicale example)
        http://osx.server.com:8008/principals/users/<USERNAME>/ (OS X example 1)
        https://osx.server.com:8443/principals/users/<USERNAME>/ (OS X example 2)

2.) Cross-domain / non cross-domain setup
    - What is the cross-domain setup?
      If your server origin is not identical with your client installation origin then your setup is cross-domain!
    - What is the origin?
      Origin is an URL without the "full path" part => <protocol>://<domain>:<port>
      Example 1:
        URL:    http://davical.server.com/caldav.php/<USERNAME>/
        Origin: http://davical.server.com:80 (default port for http is 80)
      Example 2:
        URL:    https://davical.server.com/caldav.php/<USERNAME>/
        Origin: https://davical.server.com:443 (default port for https is 443)
      Example 3:
        URL:    http://lion.server.com:8008/principals/users/<USERNAME>/
        Origin: http://lion.server.com:8008
    - What is my server origin?
      It is your principal URL origin
    - Complete examples?
      Example 1:
        Principal URL: https://lion.server.com:8443/principals/users/<USERNAME>/ (your server URL)
        Client URL:    https://www.server.com/client/ (your client installation URL)
        =>
        Server origin: https://lion.server.com:8443
        Client origin: https://www.server.com:443
        Is this setup cross-domain? YES (server origin != client origin)
      Example 2:
        Principal URL: http://davical.server.com/caldav.php/<USERNAME>/ (your server URL)
        Client URL:    http://davical.server.com/client/ (your client installation URL)
        =>
        Server origin: http://davical.server.com:80
        Client origin: http://davical.server.com:80
        Is this setup cross-domain? NO (server origin == client origin)
    NOTE: if cross-domain setup is detected you will see a warning in your browser's console!
    NOTE: cross-domain setup is detected automatically and you don't need to set it manually in config.js!

3.) Cross-domain setup problems and how to solve them (if you use cross-domain setup)
    - Why cross-domain setup is problematic?
      The client is written in JavaScript which has one major security limitation (it is hardcoded into browsers):
        If you want to use cross-domain setup and your server NOT returns proper HTTP CORS headers (see http://www.w3.org/TR/cors/) then JavaScript REFUSES to make requests to your server (more precisely: it performs one OPTIONS request /called preflight request/ to check HTTP headers returned by your server, and if no proper CORS headers are returned, then the real request is NOT performed!).
    - What to do to solve this problem?
      a.) Your server MUST return the following additional HTTP headers:
            Access-Control-Allow-Origin: *
            Access-Control-Allow-Methods: GET, POST, OPTIONS, PROPFIND, PROPPATCH, REPORT, PUT, MOVE, DELETE, LOCK, UNLOCK
            Access-Control-Allow-Headers: User-Agent, Authorization, Content-type, Depth, If-match, If-None-Match, Lock-Token, Timeout, Destination, Overwrite, Prefer, X-client, X-Requested-With
            Access-Control-Expose-Headers: Etag, Preference-Applied
      b.) If Access-Control-Request-Method header is sent by your browser (preflight request defined by CORS) then your server MUST return these headers for OPTIONS request WITHOUT requiring authorization and MUST return 200 (or 2xx) HTTP code (Success).
    - Howto add these headers to my CardDAV/CalDAV server?
      Check your server documentation or contact your server developer and ask for CORS or custom HTTP headers support.
    - Howto add these headers to my server if it has no support for CORS or custom HTTP headers?
      Configure custom headers in your web server /or proxy server/ configuration (if possible) - see misc/config_davical.txt for Apache example.

4.) Digest authentication problems and how to solve them (if your server uses digest auth)
    - Why digest authentication is problematic?
      Lot of browsers have wrong or buggy digest auth support (especially if used from JavaScript).
    - What to do to solve this problem?
      a.) Disable the digest authentication and enable the basic authentication in your server config (NOTE: ALWAYS use SSL /https/ for basic authentication!)
      b.) Alternatively (if it is not possible to switch to basic auth) you can try to enable the globalUseJqueryAuth option in config.js (NOTE: there is no guarantee that it will work in your browser)
      NOTE: if you want to use the auth module /see 6.) c.) below/ you MUST use basic auth (there is no digest auth support in this module)!

5.) problems with SSL /https/ and invalid (or self-signed) certificates
    - Why the client cannot connect to server with invalid/self-signed certificates?
      If a user opens a web page and the browser detects invalid/self-signed certificate it warns user about this problem, and usually shows an option to accept the server certificate (or add a security exception) manually. If the request is sent by JavaScript there is NO such option to show user the security warning, and also it is NOT possible to add security exception directly by JavaScript!
    - What to do to solve this problem?
      a.) use valid server certificate from commercial CA or
      b.) if your server certificate is not self-signed and is issued by your own CA, add your CA certificate into "Trusted Root Certificates" in your browser/system or
      c.) open the principal URL directly by browser, accept the invalid certificate (or add a security exception) manually

6.) Client setup types
    - What types of setup are supported by the client?
      a.) Static setup with predefined principal URL, username and password stored in config.js. For this setup use globalAccountSettings (instead of globalNetworkCheckSettings or globalNetworkAccountSettings) and set the href option to your full principal URL in config.js.
          - advantages: fast login process = no username/password is required (no login screen)
          - disadvantages: username/password is visible in your config.js (recommended ONLY for intranet or home setup)
      b.) Standard setup shows login screen and requires valid username and password from the user. For this setup use globalNetworkCheckSettings (instead of globalAccountSettings or globalNetworkAccountSettings) and set the href option to your principal URL WITHOUT the username part (username is appended to the href value from the login screen) in config.js.
          - advantages: username/password is required from the user (no visible username/password in config.js)
          - disadvantages: if a user enters wrong username/password then browser will show authentication popup window (it is NOT possible to disable it in JavaScript; see the next option)
      c.) Special setup sends username/password to the PHP auth module (auth directory) which validates your username/password against your server and if the authentication is successful then sends back a configuration XML (requires additional configuration; the resulting XML is handled IDENTICALLY as the globalAccountSettings /a.)/ configuration option). For this setup use globalNetworkAccountSettings (instead of globalAccountSettings or globalNetworkCheckSettings) and set the href value to your auth directory URL (use the default if the auth directory is stored in the client installation subdirectory). Use this setup AFTER you have working b.) and want to solve the authentication popup problem.
          - advantages: no authentication popup if you enter wrong username/password, dynamic XML configuration generator (you can generate different configurations for your users /by modifying the module configuration or the PHP code itself/)
          - disadvantages: requires PHP >= 5.3 and additional configuration, only basic authentication is supported
          Auth module configuration:
              - update your auth/config.inc:
                  set the $config['auth_method'] to 'generic' (this is the default)
                  set the $config['accounts'] - usually you need to change only the "http://www.server.com:80" part of the
                    href value but you can also change the syncinterval and timeout values
                  set the $config['auth_send_authenticate_header'] to true
              - update your auth/plugins/generic_conf.inc:
                  set the $pluginconfig['base_url'] to your server origin
                  set the $pluginconfig['request'] to the server path (e.g. for DAViCal: '/caldav.php')
              - visit the auth directory manually by your browser and enter your username and password - you will get
                  a configuration XML for your installation (if not, check your previous settings again!)
                  NOTE: the returned XML content is processed identically as the globalAccountSettings /a.)/ configuration option
              - update your auth/config.inc:
                  set the $config['auth_send_authenticate_header'] back to false

7.) HTML5 cache update
    You MUST execute the cache_update.sh script every time you update your configuration or any other file (otherwise your browser will use the previous version of files stored in HTML5 cache); alternatively you can update the cache.manifest manually - edit the second line beginning with "#V 20" to anything else (this file simple needs "some" change)

8.) Generic installation instructions
	a.) read 1-7 above :-)
	b.) copy the source code into your web server directory (if you use Apache it is strongly recommended to enable the following modules: mod_expires, mod_mime and mod_deflate ... see .htaccess for more details)
	c.) set your CardDAV/CalDAV server related configuration in config.js (see 6.))
	d.) set other configuration options in config.js (see comments in config.js)
	e.) update your HTML5 cache (see 7.))
	f.) open the installation directory in your browser
	g.) login and use the client :-)

9.) DAViCal (non cross-domain) installation instructions
	a.) copy the source code into your DAViCal "htdocs" directory (or copy it into other directory and use web server alias in your DAViCal virtual server configuration, e.g.: "Alias /client/ /usr/share/client/")
	b.) open the installation directory in your browser
	c.) login and use the client :-) ... note: if you changed something in config.js (not required) see 7.)


If something not works check the console log in your browser!
