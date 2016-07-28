<?php
	require_once(dirname(__FILE__).'/ldap_conf.inc');

	function ldap_authenticate()
	{
		global $pluginconfig;
		if($_SERVER['PHP_AUTH_USER']!="" && $_SERVER['PHP_AUTH_PW']!="")
		{
			$ds=ldap_connect($pluginconfig['host']);

			// if binding is required for LDAP search
			if(isset($pluginconfig['bind_dn']) && isset($pluginconfig['bind_passwd']))
			{
				@ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);
				if(!($r=@ldap_bind($ds, $pluginconfig['bind_dn'], $pluginconfig['bind_passwd'])))
					return -2;	// auth unsuccessful (bind error)
			}

			// perform the search
			if(($r=ldap_search($ds, $pluginconfig['basedn'], '(&('.$pluginconfig['user_attr'].'='.$_SERVER['PHP_AUTH_USER'].')'.(isset($pluginconfig['filter']) && $pluginconfig['filter']!='' ? '('.$pluginconfig['filter'].')' : '' ).')'))!==false)
			{
				$result=@ldap_get_entries($ds, $r);
				if($result[0])
				{
					@ldap_set_option($ds, LDAP_OPT_PROTOCOL_VERSION, 3);
					if(@ldap_bind($ds, $result[0]['dn'], $_SERVER['PHP_AUTH_PW']))
					{
						@ldap_unbind($bi);
						return 1;	// auth successful
					}
				}
			}
			return -1;	// auth unsuccessful
		}
		return 0;	// empty username or password
	}
?>