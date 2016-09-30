<?php
	header_remove('Access-Control-Allow-Origin');
	header_remove('Access-Control-Allow-Methods');
	header_remove('Access-Control-Allow-Headers');
	header_remove('Access-Control-Allow-Credentials');

	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: GET');
	header('Access-Control-Allow-Headers: User-Agent,Authorization,Content-type,X-client');
	header('Access-Control-Allow-Credentials: true');

	if($_SERVER['REQUEST_METHOD']=='OPTIONS')	// Preflighted request
		exit(0);
?>