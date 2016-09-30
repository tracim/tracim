
PROBLEM:
--------

caldavzap reads and saves session settings persistently in the caldav server by
PROPPATCH / PROPFIND in a principal property '{http://inf-it.com/ns/dav/}settings'.

Unfortunately, sabredav and sabredav based caldav servers...
- do not provide access to new or non-standard properties
- do not provide write access to principal properties with PROPPATCH


SOLUTION:
---------

An ideal and clean solution would be a sabredav plugin which allows creation and
access to arbitrary new principal properties. Since such a plugin doesn't exist,
I'll show here a hack which modifies baikal to just provide the specific principal
property '{http://inf-it.com/ns/dav/}settings' which is needed by caldavzap.

The following steps apply to baikal 0.2.7 but should be applicable to any
sabredav based server.

1. modify your sql databse:
add a text type database entry to the principals table which will hold the settings.
This can be done by sql commands or by using a gui frontend for your database.
I've named this text field 'inf_it_settings'.
Example: the sqlite structure of the principals table should then look like this:
CREATE TABLE 'principals' ( id INTEGER PRIMARY KEY ASC, uri TEXT, email TEXT,
     displayname TEXT, vcardurl TEXT, inf_it_settings TEXT, UNIQUE(uri) )

2. apply the patch baikal-flat-0.2.7-for-caldavzap.diff to patch the baikal server.
This patch does two things:

a) it modifies vendor/sabre/dav/lib/Sabre/DAVACL/PrincipalBackend/PDO.php to map
requests for the property '{http://inf-it.com/ns/dav/}settings' to the newly created
database field inf_it_settings (see above 1.)

b) it modifies vendor/sabre/dav/lib/Sabre/DAVACL/Principal.php to give write
access to principal properties ('write' includes 'write-properties').

