import sys

from setuptools import find_packages
from setuptools import setup

requires = [
    # pyramid
    "plaster_pastedeploy",
    "pyramid >= 1.9a",
    "pyramid_debugtoolbar",
    "pyramid_retry",
    "waitress",
    # Database
    "pyramid_tm",
    "SQLAlchemy",
    "transaction",
    "zope.sqlalchemy",
    "alembic",
    "sqlakeyset",
    # API
    "hapic[marshmallow]>=0.83",
    # INFO - G.M - 2019-03-21 - this is needed as there is a requirement issue
    # in hapic, apispec-marshmallow-advanced==0.3
    # and hapic==0.73 aren't compatible
    "apispec-marshmallow-advanced>=0.4" "apispec==2.0.2",
    "marshmallow <3.0.0a1,>=2.21.0",
    # CLI
    "cliff",
    # Webdav
    "wsgidav",
    "PyYAML",
    # others
    "filedepot>=0.8.0",
    "babel",
    "python-slugify",
    "preview-generator>=0.15.4",
    "colour",
    "python-dateutil",
    "gitpython",
    # mail-notifier
    "mako",
    "lxml",
    "redis<3.0.0",
    "rq",
    "html2text",
    # mail-fetcher
    "markdown",
    "email_reply_parser",
    "filelock",
    "imapclient",
    "beautifulsoup4",
    # auth
    "pyramid_multiauth",
    "beaker",
    "pyramid_beaker",
    "pyramid_ldap3",
    # frontend file serve
    "pyramid_mako",
    # i18n
    "Babel",
    "requests",
    # caldav support
    "radicale",
    "caldav",
    # search support
    "elasticsearch",
    "elasticsearch-dsl",
    # text-formatting
    "humanize",
    # logging
    "colorlog",
    # plugin
    "pluggy",
    # live message
    "gripcontrol",
    "tnetstring3",
    "pyzmq",
    "jsonschema",
]

tests_require = [
    "WebTest >= 1.3.1",  # py3 compat
    "pytest",
    "pytest-dotenv",
    "pytest-pyramid-server",
    "pytest-services",
    "pytest-timeout",
    "responses",
    "mock",
    "Pillow",
    # INFO - G.M - 2020-01-14 - static version of freezeguh due to regression
    # with webtest, see https://github.com/spulec/freezegun/issues/326
    "freezegun==0.3.12",
    "sseclient-py",
]

devtools_require = [
    "flake8",
    "isort",
    "mypy",
    "pre-commit",
]


# add black for python 3.6+
if sys.version_info.major == 3 and sys.version_info.minor >= 6:
    devtools_require.append("black")

mysql_require = ["PyMySQL[rsa]"]

postgresql_require = [
    "psycopg2",
]
s3_require = [
    "boto3",
]
# Python version adaptations
if sys.version_info < (3, 5):
    requires.append("typing")


setup(
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    extras_require={
        "testing": tests_require,
        "dev": tests_require + devtools_require,
        "mysql": mysql_require,
        "postgresql": postgresql_require,
        "s3": s3_require,
    },
    install_requires=requires,
    entry_points={
        "paste.app_factory": [
            "main = tracim_backend:web",
            "webdav = tracim_backend:webdav",
            "caldav = tracim_backend:caldav",
        ],
        "console_scripts": ["tracimcli = tracim_backend.command:main"],
        "tracimcli": [
            # user
            "user_create = tracim_backend.command.user:CreateUserCommand",
            "user_update = tracim_backend.command.user:UpdateUserCommand",
            "user delete = tracim_backend.command.cleanup:DeleteUserCommand",
            "user anonymize = tracim_backend.command.cleanup:AnonymizeUserCommand",
            # db
            "db_init = tracim_backend.command.database:InitializeDBCommand",
            "db_delete = tracim_backend.command.database:DeleteDBCommand",
            "db update-naming-conventions = tracim_backend.command.database:UpdateNamingConventionsV1ToV2Command",
            # search
            "search index-create = tracim_backend.command.search:SearchIndexInitCommand",
            "search index-populate = tracim_backend.command.search:SearchIndexIndexCommand",
            "search index-upgrade-experimental = tracim_backend.command.search:SearchIndexUpgradeCommand",
            "search index-drop = tracim_backend.command.search:SearchIndexDeleteCommand",
            # webdav
            "webdav start = tracim_backend.command.webdav:WebdavRunnerCommand",
            # caldav
            "caldav start = tracim_backend.command.caldav:CaldavRunnerCommand",
            "caldav sync = tracim_backend.command.caldav:CaldavSyncCommand",
            # devtool
            "dev parameters list = tracim_backend.command.devtools:ParametersListCommand",
            "dev parameters value = tracim_backend.command.devtools:ParametersValueCommand",
            "dev test live-messages = tracim_backend.command.devtools:LiveMessageTesterCommand",
            "dev custom-properties extract-translation-source = tracim_backend.command.devtools:ExtractCustomPropertiesTranslationsCommand",
        ],
    },
    message_extractors={
        "tracim_backend": [("**.py", "python", None), ("templates/**.mak", "mako", None)]
    },
)
