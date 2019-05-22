
## 2.2.0 / 2019-05-XX

### New Features

- Agenda is available
- Migration of agenda from tracim_v1 to tracim_v2 is now available
- Breadcrumbs to know exactly where you are
- Links for webdav and agenda are visible in dashboard
- Link for personal agenda is visible in My account
- Timeline's revisions now shows its author

### Known issues

- Search & filters not yet migrated from tracim v1
- Creating a content may appear duplicated on slow network (issue #1361)
- It's possible to rename a content or workspace with an already in use label in some special cases (issue #1770)
- If you create shared spaces while radicale server is not running (tracimcli caldav start), the agendas are not available (issue #1537)
- Changing parameter caldav.radicale.server.host in development.ini with specific IP address show wrong url after starting caldav (issue #1535)
- File extension is not visible in recent activity after click on See More (issue #1774)

### Fixed issues

- Documentation: #1493, #1612, #1672, #1751
- Agenda: #1181, #1250, #1486, #1498, #1527, #1532, #1533, #1536, #1539, #1540, #1545, #1556, #1573, #1575, #1577, #1584, #1600, #1605, #1608, #1631, #1644, #1700, #1723, #1730
- UX: #1374, #1602, #1718, #1726, #1731, #1736, #1746
- Timeline: #727, #869, #1371, #1686 
- Dashbord: #1084, #1488, #1641, #1769
- Header: #681, #669, #860, #1074, #1621, #1688
- Contents: #818, #827, #1067, #1097, #1105, #1507, #1563, #1624, #1648, #1693, #1712,#1745
- Sidebar: #1177, #1571
- Backend config file: #987, #1475, #1495, #1550, #1626, #1665, #1689, #1690, #1696, #1752
- Email: #1489, #1491, #1649 
- Security related: #1617
- Preview-generator: #1126, #1472
- Webdav: #1335, #1499, #1652
- Docker image: #1387, #1565, #1567, #1681, #1763
- Other: #660, #819, #1006, #1012, #1030, #1514, #1610, #1627, #1630, #1658, #1679, #1698, #1705, #1742, #1755

### Others Changes

- Rename 'user.reset_password.validity' to 'user.reset_password.token_lifetime' in config, old parameter is now deprecated. (issue #970)

### REST API Changes

- Removing 'caldav_url' unused param from user returned by api(commit 3861a373e7b0039545ac65cfb7e51ca2c308f23c)


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
