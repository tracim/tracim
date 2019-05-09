<?php
	require_once(dirname(__FILE__).'/generic_conf.inc');

	function generic_authenticate()
	{
		global $pluginconfig;
		if($_SERVER['PHP_AUTH_USER']!='' && $_SERVER['PHP_AUTH_PW']!='')
		{
			preg_match('#(https?)://([^/:]+)((?::[0-9]+)?)#i', $pluginconfig['base_url'], $matches);
			$hostname_clean=$matches[2];
			if($matches[1]=='https')
				$hostname='ssl://'.$matches[2];
			else
				$hostname=$matches[2];

			if($matches[3]=='')
			{
				if($matches[1]=='http')
					$port=80;
				else if($matches[1]=='https')
					$port=443;
			}
			else
				$port=substr($matches[3],1);

			$fp=fsockopen($hostname, $port, $errno, $errstr, $pluginconfig['timeout']);
			if(!$fp)
			{
				echo "$errstr ($errno)<br />\n";
				return -2;
			}
			else
			{
				$request="<?xml version=\"1.0\" encoding=\"utf-8\"?><A:propfind xmlns:A=\"DAV:\"><A:prop><A:current-user-principal/></A:prop></A:propfind>";

				$out="PROPFIND ".$pluginconfig['request']." HTTP/1.1\r\n";
				$out.="Host: $hostname_clean\r\n";
				$out.="Authorization: Basic ".base64_encode($_SERVER['PHP_AUTH_USER'].':'.$_SERVER['PHP_AUTH_PW'])."\r\n";
				$out.="Depth: 0\r\n";
				$out.="Content-Type: text/xml; charset=\"utf-8\"\r\n";
				$out.="Content-Length:". strlen($request)."\r\n\r\n";
				$out.=$request;
				fwrite($fp, $out);

				$result='';
				if(!feof($fp))
		    		$result.=fgets($fp);
				fclose($fp);

				if(strpos($result, 'HTTP/1.1 207')===0)
					return 1;	// auth successful
				else
					return -1;	// auth unsuccessful
			}
		}
		return 0;	// empty username or password
	}
?>