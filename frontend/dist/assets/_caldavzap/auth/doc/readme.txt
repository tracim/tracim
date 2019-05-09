1.) configure your auth method (see the plugins directory) and the response XML in auth/config.inc and set $config['auth_send_authenticate_header']=true
2.) configure the selected auth module in plugins/PLUGIN_conf.inc
3.) check the correct response by visiting http://your-server.com/client_dir/auth/ and entering username and password
4.) set $config['auth_send_authenticate_header']=false in auth/config.inc

By default the generic plugin is used for basic HTTP authentication ($config['auth_method']='generic'; in config.inc).

