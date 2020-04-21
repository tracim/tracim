ldap_test_server_fixtures = {
    "port": 3333,
    "password": "toor",
    "bind_dn": "cn=admin,dc=directory,dc=fsf,dc=org",
    "base": {
        "objectclass": ["dcObject", "organization"],
        "dn": "dc=directory,dc=fsf,dc=org",
        "attributes": {"o": "Free Software Foundation", "dc": "directory"},
    },
    "entries": [
        {
            "objectclass": ["organizationalRole"],
            "dn": "cn=admin,dc=directory,dc=fsf,dc=org",
            "attributes": {"cn": "admin"},
        },
        {
            "objectclass": ["organizationalUnit"],
            "dn": "ou=people,dc=directory,dc=fsf,dc=org",
            "attributes": {"ou": "people"},
        },
        {
            "objectclass": ["organizationalUnit"],
            "dn": "ou=profile,dc=directory,dc=fsf,dc=org",
            "attributes": {"ou": "profile"},
        },
        {
            "objectclass": ["account", "top"],
            "dn": "cn=richard-not-real-email@fsf.org,ou=people,dc=directory,dc=fsf,dc=org",
            "attributes": {
                "uid": "richard-not-real-email@fsf.org",
                "userPassword": "rms",
                "mail": "richard-not-real-email@fsf.org",
                "pubname": "Richard Stallman",
            },
        },
        {
            "objectclass": ["account", "top"],
            "dn": "cn=lawrence-not-real-email@fsf.local,ou=people,dc=directory,dc=fsf,dc=org",
            "attributes": {
                "uid": "lawrence-not-real-email@fsf.local",
                "userPassword": "foobarbaz",
                "mail": "lawrence-not-real-email@fsf.local",
                "pubname": "Lawrence Lessig",
            },
        },
    ],
}
