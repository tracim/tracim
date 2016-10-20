<?php
	// LDAP configuration parameters
	$pluginconfig['host']='ldaps://ldap.server.com/';
	$pluginconfig['basedn']='ou=People,dc=server,dc=com';
	$pluginconfig['user_attr']='uid';
	// if the server requires binding (if set to null then binding is not performed)
	//$pluginconfig['bind_dn']=null;
	//$pluginconfig['bind_passwd']=null;

	// optional
	$pluginconfig['filter']='accountStatus=active';
?>