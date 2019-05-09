<?php
	// auth method: generic (auth/plugins/generic_conf.inc) or ldap (auth/plugins/ldap_conf.inc)
	$config['auth_method']='generic';

	// set to true for debugging XML response, otherwise set to false to avoid browser
	//  to show http authentication window after unsuccessful authentication
	$config['auth_send_authenticate_header']=false;

	// successfull authentication XML specification (change the "http://www.server.com:80" to your protocol/server/port)
	$config['accounts']=array('resources'=>array());

	// note: if you want to use regex values, then use one of the following formats (the second example is with regex modifier): 're:.*someregex.*[0-9]$' or 're|i:.*someregex.*[0-9]$'
	// note: 'crossdomain' and 'withcredentials' are still available but there is NO REASON to use them (crossDomain is detected automatically, and I've never seen anyone who understand when to use withCredentials /there is NO REASON to set it to true!/)
	// note: 'syncinterval' was removed - use globalSyncResourcesInterval in config.js instead
	$config['accounts']['resources'][]=array(
		'resource'=>array(
			'type'=>array('calendar'=>''),
			'href'=>(empty($_SERVER['HTTPS']) ? 'http' : 'https').'://www.server.com:80/caldav.php/'.$_SERVER['PHP_AUTH_USER'].'/',
			'hreflabel'=>'null',		// if undefined or empty href value is used (see above)
			'forcereadonly'=>'null',	// see auth/doc/example_config_response.xml for proper use, for example: 'forcereadonly'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re:^/caldav.php/user/collection[0-9]/$')),
			'settingsaccount'=>'true',	// client properties are saved here (note: set it to true only for ONE account)
			'checkcontenttype'=>'true',	// check content-type in the server response (if you cannot see data in the interface /buggy server response/ you may try to disable it)
			'delegation'=>'true',		// see auth/doc/example_config_response.xml for proper use, for example: 'delegation'=>array(array('resource'=>'/caldav.php/user%40domain.com/'), array('resource'=>'re|i:^/caldav.php/a[b-x].+/$')),
			'ignorealarms'=>'false',	// see auth/doc/example_config_response.xml for proper use, for example: 'ignorealarms'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re:^/caldav.php/user/collection[0-9]/$')),
			'backgroundcalendars'=>'',	// see auth/doc/example_config_response.xml for proper use, for example: 'backgroundcalendars'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re|i:^/caldav.php/user/collection[0-9]/$')),
			'userauth'=>array(
				'username'=>$_SERVER['PHP_AUTH_USER'],
				'password'=>$_SERVER['PHP_AUTH_PW']
			),
			'timeout'=>90000,
			'locktimeout'=>10000
		)
	);

/*
	// additional accounts
	$config['accounts']['resources'][]=array(
		'resource'=>array(
			'type'=>array('calendar'=>''),
			'href'=>'http://www.server.com:80/caldav.php/resource/',
			'hreflabel'=>'null',		// if undefined or empty href value is used (see above)
			'forcereadonly'=>'null',	// see auth/doc/example_config_response.xml for proper use, for example: 'forcereadonly'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re:^/caldav.php/user/collection[0-9]/$')),
			'settingsaccount'=>'false',	// client properties are saved here (note: set it to true only for ONE account)
			'checkcontenttype'=>'true',	// check content-type in the server response (if you cannot see data in the interface /buggy server response/ you may try to disable it)
			'delegation'=>'true',		// see auth/doc/example_config_response.xml for proper use, for example: 'delegation'=>array(array('resource'=>'/caldav.php/user%40domain.com/'), array('resource'=>'re|i:^/caldav.php/a[b-x].+/$')),
			'ignorealarms'=>'false',	// see auth/doc/example_config_response.xml for proper use, for example: 'ignorealarms'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re:^/caldav.php/user/collection[0-9]/$')),
			'backgroundcalendars'=>'',	// see auth/doc/example_config_response.xml for proper use, for example: 'backgroundcalendars'=>array(array('collection'=>'/caldav.php/user/collection/'), array('collection'=>'re|i:^/caldav.php/user/collection[0-9]/$')),
			'userauth'=>array(
				'username'=>$_SERVER['PHP_AUTH_USER'],
				'password'=>$_SERVER['PHP_AUTH_PW']
			),
			'timeout'=>90000,
			'locktimeout'=>10000
		)
	);
*/

?>