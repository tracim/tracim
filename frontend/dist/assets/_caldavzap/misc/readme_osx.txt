OS X Server instructions:

1. Calendarserver in OS X not sends headers required by web browsers to allow cross domain queries. To add these headers follow the steps below: 
	- copy the misc/calendarserver.diff into any directory on your server (for example: ~/Desktop)
	Mac OS X Lion Server (for OS X Mountain Lion Server see below):
		- if your server is already patched (previous version of patch) you must restore the original files from backup:
			NOTE: if you have updated your server installation, you probably do not want to restore the old files (possible newer version of Calendarserver files)
			sudo mv /usr/share/caldavd/lib/python/twext/web2/http_headers.py.orig /usr/share/caldavd/lib/python/twext/web2/http_headers.py
			sudo mv /usr/share/caldavd/lib/python/twext/web2/server.py.orig /usr/share/caldavd/lib/python/twext/web2/server.py
		- execute the following command in the Terminal:
			sudo patch -b -d /usr/share/caldavd/lib/python/twext/web2 -i ~/Desktop/calendarserver.diff
	OS X Mountain Lion Server:
		- if your server is already patched (previous version of patch) you must restore the original files from backup:
			NOTE: if you have updated your server installation, you probably do not want to restore the old files (possible newer version of Calendarserver files)
			sudo mv /Applications/Server.app/Contents/ServerRoot/usr/share/caldavd/lib/python/twext/web2/http_headers.py.orig /Applications/Server.app/Contents/ServerRoot/usr/share/caldavd/lib/python/twext/web2/http_headers.py
			sudo mv /Applications/Server.app/Contents/ServerRoot/usr/share/caldavd/lib/python/twext/web2/server.py.orig /Applications/Server.app/Contents/ServerRoot/usr/share/caldavd/lib/python/twext/web2/server.py
		- execute the following command in the Terminal:
			sudo patch -b -d /Applications/Server.app/Contents/ServerRoot/usr/share/caldavd/lib/python/twext/web2 -i ~/Desktop/calendarserver.diff

2. The Digest authentication used in OS X Server is not supported directly by JavaScript in many browsers. It is recommended to disable it and enable the Basic authentication instead (or you may try the Digest auth with globalUseJqueryAuth=true in config.js). To disable the Digest authentication execute the following commands in Terminal:
	sudo serveradmin settings calendar:Authentication:Basic:Enabled = yes
	sudo serveradmin settings calendar:Authentication:Digest:Enabled = no

3. Restart Calendarserver services:
	sudo serveradmin stop addressbook
	sudo serveradmin start addressbook
	sudo serveradmin stop calendar
	sudo serveradmin start calendar

	WARNING: with Basic authentication your username and password are sent over the network in plain text.
	!!! ALWAYS USE SSL with Basic authentication !!!


Example config.js href values for OS X Server:
	globalAccountSettings:
		href: http://osxserver.com:8008/principals/users/USERNAME/	(INSECURE!)
		href: https://osxserver.com:8443/principals/users/USERNAME/
	globalNetworkCheckSettings:
		href: http://osxserver.com:8008/principals/users/	(INSECURE!)
		href: https://osxserver.com:8443/principals/users/
