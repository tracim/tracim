## Next version x.x.x /xxxx-xx-xx

### Known issues
- Changing parameter caldav.radicale.server.host in development.ini with specific IP address show wrong url after starting caldav (issue #1535)
- If user does not manually change the language, email notifications will stay in English. In order to get notifications in French, change language to English, then back to French (issue #1374)
- if you create shared spaces while radicale server is not running (tracimcli caldav start), the agendas are not available (issue #1537)

### REST API Changes

- Removing 'caldav_url' unused param from user returned by api(commit 3861a373e7b0039545ac65cfb7e51ca2c308f23c)

### Others Changes

- rename 'user.reset_password.validity' to 'user.reset_password.token_lifetime' in config,
old parameter is now deprecated. (issue #970)


## 2.1.0 / 2019-02-15

### New Features
- Folders
- Progressive web app support (possibility to "install" tracim on smartphone)
- Webdav + create/move operations
- Full database migration from tracim v1
- Authentication:
    - LDAP authentication
    - Web SSO Authentication - beta (based on HTTP Headers)
    - Authentication chaining - beta (internal, ldap, apache)

### Known issues

- Calendar support still missing (migration from tracim v1 will be available in tracim 2.2 - see #1181)
- Search & filtering not yet migrated from tracim v1
- Duplicated creation of content may appear on slow network (issue #1361)

### Fixed issues

- Documentation: #993, #1005, #1211, #1310, #1337
- Folders: #650, #1119, #1173, #1191, #1210, #1256, #1325, #1353
- Shared space management: #1069, #1072, #1100, #1113, #1174, #1175, #1194, #1195, #1197, #1216, #1243, #1248, #1252, #1257, #1358
- Webdav: #1166, #1187, #1312, #1362, #1376, #1399, #1419, #1427
- Users management: #1050, #1063, #1065, #1077, #1085, #1138, #1246, #1268, #1270, #1287, #1293, #1295, #1234, #1359, #1394
- Contents: #758, #1058, #1076, #1107, #1147, #1148, #1149, #1150, #1153, #1190, #1192, #1196, #1199, #1206, #1233, #1236, #1260, #1360, #1370, #1373
- Email notifications and answers: #1167, #1183, #1184, #1317, #1319
- Security related: #911, #1065, #1108, #1156
- Server side: #1140, #1142, #1217, #1249, #1299
- User interface: #765, #913, #1155, #1157, #1158, #1168, #1176, #1244, #1272, #1356, #1423
- Docker image: #1143, #1160, #1300, #1308, #1318, #1438
- Other: #1137, #1144, #1204, #1222
