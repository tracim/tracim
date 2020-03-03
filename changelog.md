

# 2.6.1 /2020-02-21

### Fixed issues
- Frontend: #2665, #2676, #2680, #2683
- General UX: #1891
- File app: #2669, #2674, #2676
- Contents: #1342
- Sidebar: #2665
- Backend: #2592

# 2.6.0 /2020-02-06

### New Feature
- Multi-upload file available in Tracim frontend (not only in public upload)
- The titles of the pages show where you are in Tracim
- It is now possible to delete users and anonymise their data with the tracimcli command
- The preview generator now supports raw and 3D files (works with Xvfb in a Docker container)
- With Apache as a proxy, it is now possible to use the browser cache policy. If you used Tracim with Docker you need to backup and delete existing Apache configuration files in `~/tracim/etc/` (default path with Tracim Docker image). On the next startup, a new file will be created with the new parameters.
- All apps are now directly enabled/disabled with one parameter and it is now easier to develop new apps.

### Fixed issues
- Gallery: #2540, #2541, #2551, #2574, #2583 
- Frontend: #1396, #1560, #1656, #2607, #2608, #2611, #2641
- Backend: #2588, #2570, #2610, #2129, #1484, #2010

### Breaking/Important change
- `agenda`, `share_content`, `upload_permission` and `collaborative_document_edition` are now Tracim's applications (stand alone and optional), you can add/remove them from `app.enabled` list
  - `caldav.enabled` is now deprecated and agenda is enabled by default. To disable it, uncomment `app.enabled` parameter and put each enabled apps but agenda.
  - `upload_permission` and  `share_content` are enabled by default. Before 2.6.0 theses apps couldn't be disabled. To disable them, uncomment `app.enabled` parameter and put each enabled apps but `upload_permission` and/or  `share_content`.
  - `collaborative_document_edition.activated` is now deprecated and is disabled by default. To enable it, uncomment `app.enabled` parameter and put each enabled apps, including `collaborative_document_edition`
- If you use `collaborative_document_edition` with Tracim on Docker, you need to add `-e collaborative_document_edition=1` when you start docker with `docker run` command. You can also add `collaborative_document_edition=1` in your docker-compose.yml file

### Other Changes
- 2 deprecated ldap parameters: `ldap_base_url` and `ldap_base_dn` (they where not implemented in Tracim's backend code so using them had no impact)
- 2 deprecated app parameters: `caldav.enabled` and `collaborative_document_edition.activated`


# 2.5.1 / 2019-12-06

### New Features
- Custom_toolbox feature is now available - beta

### Fixed issues
- Email: #2565
- Frontend: #2345
- Backend: #2558


# 2.5.0 / 2019-11-29

### New Features
- Application gallery

### Fixed issues
- Preview-generator: #2532
- Backend: #2518, #2526

### Breaking change api
- remove "size" parameter from create/update/get/get all workspaces endpoint


# 2.4.5 / 2019-11-21

### New Features
- Creation of multiple shared spaces with same name
- Configure default profile of new users 
- Space Limitations (experimental) - allow some controls on users allowed space, etc

### Fixed issues
- General UX: #2494
- Timeline: #2455
- File App: #2501 
- Backend & system: #2392, #2474, #2475, #2476, #2477, #2489, #2500, #2511


# 2.4.4 / 2019-11-13

### New Features

- Preview of 3D files (*.stl), videos (10 image per each video) are now available

### Fixed issues
- Preview-generator: #2503, #2492

### Known issues
- Manual modification to install Tracim on Ubuntu Trusty (14.04) is necessary (#2514)


# 2.4.3 / 2019-09-26

### Fixed issues
- Docker: #2445
- Content Listing: extended action button not working correctly


# 2.4.2 / 2019-09-24

### Fixed issues
- Timeline: Missing css rule about word-break for comment


# 2.4.1 / 2019-09-20

### Fixed issues
- Migration issue introduced with 2.4.0


## 2.4.0 / 2019-09-19

### New Features

- Online document edition through CollaboraOnline/LibreofficeOnline integration
- Public file share in download (allow remote users to access to a file stored in Tracim, eventually through a password protected access)
- Public file upload (allow remote users to upload to Tracim their files, eventually through a password protected access)
- Content meta-information panel (timeline, info) UI rework
- Space Limitations (experimental) - allow some controls on file/workspace sizes, number of workspace per user, etc

### Fixed issues

- Content Listing: #1986, #2046, #2232, #2262, #2360
- File App: #2062, #2174, #2203, #2265, #2273, #2294
- Folder App: #1918, #2087, #2191, #2244
- Timeline: #2275, #2276, #2282, #2300, #2316
- Dashboard: #1774, #2038, #2242
- Search: #1928, #1973
- Backend & system: #619, #2105, #2132, #2154, #2177, #2224, #2314, #2354
- Documentation: #2117, #2155
- General: #1887, #1910, #1956, #1992, #2011, #2064, #2091, #2141, #2149
- General UX: #573, #1198, #2076, #2092, #2096, #2121, #2159, #2237, #2299, #2395


### Known issues

- Debian 9 is released with Firefox ESR v60.8.0. In this version, long title are not limited in upload file popup (issue #2062)
- Opening file with special characters in label on CollaboraOnline/LibreofficeOnline is not possible (issue #2219)
- Tracim not support lock mechanism in collaborative edition (issue #2073)

### Other changes

Archive button not more used in Tracim. All archive buttons is hide (#2347)


## 2.3.2 / 2019-08-01

### Fixed issues

- Email notifications: #2134


## 2.3.1 / 2019-07-05

### Fixed issues

- Search: #2001, #2016, #2025
- Docker: #2005, #2054
- Timeline: #2032
- Shared spaces: #2058
- User management: #1470, #2034
- Email: #2036
- Content preview: #2022
- Security: #2060


## 2.3.0 / 2019-06-21

### New Features

- Search:
  - lite search similar to Tracim v1
  - smart search base on ElasticSearch (full text) ([Documentation here](https://github.com/tracim/tracim/blob/develop/backend/doc/setting.md#search-method-using-elastic_search-tracim-23))
- Easy content move using Drag & Drop
- Lots of UX improvement

### New Features (technical)

- It's now possible to configure Tracim using environment variables ([Documentation here](https://github.com/tracim/tracim/blob/develop/backend/doc/setting.md#tracim-22-fully-supported-var))
- New licence: combination of MIT, LGPLv3 and AGPLv3
- Since 2.3 version, following services are automatically launched when Tracim start with docker:
  - Radicale (agenda)
  - WebDAV

### Migration from <= 2.2.0 to 2.3.0

- Only if you are using Docker: before starting Tracim, you need to delete files `tracim_web.ini`, `tracim_webdav.ini` and `tracim_caldav.ini` available in the default folder `~/tracim/etc` (all files are created on startup)

### Known issues

- Debian 9 is released with Firefox ESR v60.x.x. In this version, there is a known bug with the drag & drop feature: when hovering a content over a workspace in the sidebar, only the first one gets to have its icon updated (issue #1997)

### Fixed issues

- Search: #1667, #1668, #1671, #1904, #1914, #1923, #1955
- Drag & Drop: #789, #1669, #1958, #1974
- UX: #1512, #1521, #1743, #1757, #1758, #1776, #1781, #1802, #1843, #1844, #1845, #1926, #1939, #1943, #1962, #1964, #1970, #1972, #1981, #1983, #1990
- Agenda: #1663, #1811, #1819, #1847, #1852, #1929
- Shared space: #1770, #1977
- Content: #1154, #1553, #1815, #1818
- Backend config: #1525, #1835, #1888, #1896, #1902, #1930
- Backend: #1109, #1524, #1661, #1676, #1812, #1880, #1866, #1937
- WebDAV: #1734
- Docker: #1311, #1441, #1670, #1860, #1874, #1933, #1965
- Performance: #696, #1900
- Other: #1045, #1908

### Other Changes

website.server_name parameter is now deleted in config file and code. Not more used in Tracim.


## 2.2.0 / 2019-05-27

### New Features

- Agenda is available
- Migration of agenda from Tracim v1 to Tracim v2 is now available
- Breadcrumbs to know exactly where you are
- Links for webdav and agenda are visible in dashboard
- Link for personal agenda is visible in My account
- Timeline's revisions now shows its author

### Known issues

- Search & filters not yet migrated from Tracim v1
- Creating a content may appear duplicated on slow network (issue #1361)
- It's possible to rename a content or workspace with an already in use label in some special cases (issue #1770)
- If you create shared spaces while radicale server is not running (tracimcli caldav start), the agendas are not available (issue #1537)
- Changing parameter caldav.radicale.server.host in development.ini with specific IP address show wrong url after starting caldav (issue #1535)
- File extension is not visible in recent activity after click on See More (issue #1774)

### Fixed issues

- Documentation: #1493, #1612, #1672, #1751
- Agenda: #1181, #1250, #1486, #1498, #1527, #1532, #1533, #1536, #1539, #1540, #1545, #1556, #1573, #1575, #1577, #1584, #1600, #1605, #1608, #1631, #1644, #1700, #1723, #1730
- UX: #1374, #1414, #1516, #1602, #1718, #1726, #1731, #1736, #1746
- Timeline: #727, #869, #901, #1371, #1686, #1786
- Dashbord: #871, #1064, #1084, #1488, #1641, #1769
- Header: #681, #669, #860, #1074, #1309, #1621, #1688
- Contents: #818, #827, #943, #1067, #1097, #1105, #1507, #1509, #1563, #1624, #1648, #1693, #1712, #1745, #1788, #1804
- Sidebar: #1177, #1571
- Backend config file: #987, #1475, #1495, #1550, #1626, #1665, #1689, #1690, #1696, #1752
- Email: #1489, #1491, #1649
- Security related: #1617
- Preview-generator: #1126, #1472
- Webdav: #1335, #1499, #1652
- Docker image: #1387, #1565, #1567, #1681, #1763
- Other: #660, #819, #872, #1006, #1012, #1030, #1514, #1610, #1627, #1630, #1658, #1679, #1698, #1705, #1742, #1755

### Other Changes

- Rename 'user.reset_password.validity' to 'user.reset_password.token_lifetime' in config, old parameter is now deprecated. (issue #970)

### REST API Changes

- Removing 'caldav_url' unused param from user returned by api(commit 3861a373e7b0039545ac65cfb7e51ca2c308f23c)


## 2.1.0 / 2019-02-15

### New Features
- Folders
- Progressive web app support (possibility to "install" Tracim on smartphone)
- Webdav + create/move operations
- Full database migration from Tracim v1
- Authentication:
    - LDAP authentication
    - Web SSO Authentication - beta (based on HTTP Headers)
    - Authentication chaining - beta (internal, ldap, apache)

### Known issues

- Calendar support still missing (migration from Tracim v1 will be available in Tracim 2.2 - see #1181)
- Search & filtering not yet migrated from Tracim v1
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
