<?php
	require_once('config.inc');
	require_once('common.inc');
	require_once('cross_domain.inc');
	require_once('plugins/'.$config['auth_method'].'.inc');	// configured module - it defines the 'MODULE_authenticate()' function

	if(call_user_func($config['auth_method'].'_authenticate')!==1)
	{
		// HTTP authentication (exit if unsuccessfull)
		if($config['auth_send_authenticate_header'])
			header('WWW-Authenticate: Basic realm="Inf-IT Auth Module"');
		header('HTTP/1.0 401 Unauthorized');
echo <<<HTML
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html>
	<head>
		<title>401 Authorization Required</title>
	</head>
	<body>
		<h1>Authorization Required</h1>
		<p>This server could not verify that you are authorized to access the document requested. Either you supplied the wrong credentials (e.g., bad password), or your browser doesn't understand how to supply the credentials required.</p>
	</body>
</html>
HTML;
		exit(0);
	}
	else
	{
		header('Content-type: text/xml; charset="utf-8"');
		header('Cache-Control: max-age=0, must-revalidate, no-cache, no-store, no-transform, private');
		echo array_to_xml($config['accounts']);
	}
?>