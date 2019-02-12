# Version_2.1.0_2019-02-11

## New Feature

**restauration des fonctionnalités v1**
- gestion des dossiers
- support webdav (avec notamment création et déplacement des contenus)

**Authentification**
- ajout de l'authentification via serveur LDAP
- ajout de l'authentification via HTTP Header (authentification Apache, en beta)
- chaînage/combinaison des authentifications (interne, ldap, apache)
- mode progressive webapp (permet "d'installer" tracim sur un mobile)

**migration des données depuis tracim v1**
- la bdd est automatiquement mise à jour pour une compatibilité parfaite avec la V2

**Known issue**
- support des calendriers tracim v1 non migré (issue 1181)
- support de la recherche non migré ()
- support des filtres de recherche non migré ()
- Risque de créer des contenu en double en cas de latence réseau (issue 1361)

**Amélioration de la documentation**
- tickets : 993, 1005, 1211, 1310, 1337

## Bugs corrigés

**Fonctionnalité "dossiers"**
- correction des tickets: 650, 1119, 1173, 1191, 1210, 1256, 1325, 1353

**Gestion des espaces partagés**
- correction des tickets: 1072, 1069, 1100, 1113, 1174, 1175, 1194, 1195, 1197, 1216, 1243, 1248, 1252, 1257, 1358

**Accès webdav**
- correction des tickets : 1166, 1187, 1312, 1362, 1376, 1399, 1419, 1427

**Gestion des utilisateurs**
- correction des tickets : 1050, 1063, 1065, 1077, 1085, 1138, 1246, 1268, 1270, 1287, 1293, 1295, 1234, 1359, 1394
  
**Gestion des contenus (fichiers, documents, discussions)**
- correction des tickets : 758, 1058, 1076, 1107, 1147, 1148, 1149, 1150, 1153, 1190, 1192, 1196, 1199, 1206, 1233, 1236, 1260, 1360, 1370, 1373

**Notifications et réponses par email**
- correction des tickets : 1167, 1183, 1184, 1317, 1319

**Security**
- correction des tickets : 911, 1065, 1108, 1156

**Fonctionnalités serveur**
- correction des tickets : 1140, 1142, 1217, 1249, 1299

**Interface utilisateur**
- correction des tickets : 765, 913, 1155, 1157, 1158, 1168, 1176, 1244, 1272, 1356, 1423

**Image docker**
- correction des tickets : 1143, 1160, 1300, 1308, 1318, 1438

**correction des bugs**
- correction des tickets : 1137, 1144, 1204, 1222
