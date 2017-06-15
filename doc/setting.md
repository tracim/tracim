# Setting #

Here is a short description of settings available in the file `tracim/development.ini`.

## Listening port ##

Default configuration is to listen on port 8080. If you want to adapt this to your environment, edit the `.ini` file and setup the port you want:

    port = 8080

## Interface language ##

The default language is English. You can change it to French by uncommenting the following line in the `.ini` file:

    lang = fr

## SMTP parameters for resetpassword and notifications ##

For technical reason, you have to configure `SMTP` parameters for rest password process and `SMTP` parameters for notifications in separate places.

The reset password related parameters are the following ones :

    resetpassword.email_sender = tracim@mycompany.com
    resetpassword.smtp_host = smtp.mycompany.com
    resetpassword.smtp_port = 25
    resetpassword.smtp_login = username
    resetpassword.smtp_passwd = password

The main parameters for notifications are the following ones:

    email.notification.activated = true
    email.notification.from.email = noreply@trac.im
    email.notification.from.default_label = Tracim Notification
    email.notification.smtp.server = smtp.mycompany.com
    email.notification.smtp.port = 25
    email.notification.smtp.user = username
    email.notification.smtp.password = password

## Website ##

You must define general parameters like the `base_url` and the website title which are required for home page and email notification links

    website.title = My Company Intranet
    website.base_url = http://intranet.mycompany.com:8080

## LDAP ##

To use LDAP authentication, set `auth_type` parameter to `ldap`:

    auth_type = ldap

Then add LDAP parameters

    # LDAP server address
    ldap_url = ldap://localhost:389

    # Base dn to make queries
    ldap_base_dn = dc=directory,dc=fsf,dc=org

    # Bind dn to identify the search
    ldap_bind_dn = cn=admin,dc=directory,dc=fsf,dc=org

    # The bind password
    ldap_bind_pass = toor

    # Attribute name of user record who contain user login (email)
    ldap_ldap_naming_attribute = uid

    # Matching between ldap attribute and ldap user field (ldap_attr1=user_field1,ldap_attr2=user_field2,...)
    ldap_user_attributes = mail=email

    # TLS usage to communicate with your LDAP server
    ldap_tls = False

    # If True, LDAP own tracim group managment (not available for now!)
    ldap_group_enabled = False

You may need an administrator account to manage Tracim. Use the following command (from ``/install/dir/of/tracim/tracim``):

    gearbox user create -l admin@admin.admin -p admin@admin.admin -g managers -g administrators

Keep in mind `admin-email@domain.com` must match with LDAP user.

## Other parameters  ##

There are other parameters which may be of interest to you. For example, you can:

* include a JS tracker like Piwik or Google Analytics,
* define your own notification email subject
* personalize notification email
* personalize home page (background image, title color...)
* ...
