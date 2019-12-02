import os

import sys
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    # pyramid
    'plaster_pastedeploy',
    'pyramid >= 1.9a',
    'pyramid_debugtoolbar',
    'pyramid_retry',
    'waitress',
    # Database
    'pyramid_tm',
    'SQLAlchemy',
    'transaction',
    'zope.sqlalchemy',
    'alembic',
    # API
    'hapic[marshmallow]==0.77',
    # INFO - G.M - 2019-03-21 - this is needed as there is a requirement issue
    # in hapic, apispec-marshmallow-advanced==0.3
    # and hapic==0.73 aren't compatible
    'apispec-marshmallow-advanced>=0.4'
    'apispec==1.1.0',
    'marshmallow <3.0.0a1,>2.0.0',
    # CLI
    'cliff',
    # Webdav
    'wsgidav',
    'PyYAML',
    # others
    'filedepot',
    'babel',
    'python-slugify',
    'preview-generator>=0.13',
    'colour',
    'python-dateutil',
    # mail-notifier
    'mako',
    'lxml',
    'redis<3.0.0',
    'rq',
    # mail-fetcher
    'markdown',
    'email_reply_parser',
    'filelock',
    'imapclient',
    'beautifulsoup4',
    # auth
    'pyramid_multiauth',
    'beaker',
    'pyramid_beaker',
    'pyramid_ldap3',
    # frontend file serve
    'pyramid_mako',
    # i18n
    'Babel',
    'requests',
    # caldav support
    'radicale',
    'caldav',
    # search support
    'elasticsearch',
    'elasticsearch-dsl',
    # text-formatting
    'humanize',
    # logging
    'colorlog'
]

tests_require = [
    'WebTest >= 1.3.1',  # py3 compat
    'pytest',
    'pytest-dotenv',
    'responses',
    'mock',
    'Pillow',
    'freezegun',
]

devtools_require=[
    'flake8',
    'isort',
    'mypy',
    'pre-commit',
]


# add black for python 3.6+
if sys.version_info.major == 3 and sys.version_info.minor >= 6:
    devtools_require.append('black')

mysql_require = [
    'PyMySQL'
]

postgresql_require = [
    'psycopg2',
]
# Python version adaptations
if sys.version_info < (3, 5):
    requires.append('typing')


setup(
    name='tracim_backend',
    version='1.9.1',
    description='Rest API (Back-end) of Tracim v2',
    long_description=README + '\n\n' + CHANGES,
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Programming Language :: Python',
        "Programming Language :: Python :: 3.4",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        'Framework :: Pyramid',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Application',
        'Topic :: Communications :: File Sharing',
        'Topic :: Communications',
        'License :: OSI Approved :: MIT License',
    ],
    author='',
    author_email='',
    url='https://github.com/tracim/tracim_backend',
    keywords='web pyramid tracim ',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    extras_require={
        'testing': tests_require,
        'dev': tests_require + devtools_require,
        'mysql': mysql_require,
        'postgresql': postgresql_require,
    },
    install_requires=requires,
    entry_points={
        'paste.app_factory': [
            'main = tracim_backend:web',
            'webdav = tracim_backend:webdav',
            'caldav = tracim_backend:caldav',
        ],
        'console_scripts': [
            'tracimcli = tracim_backend.command:main',
        ],
        'tracimcli': [
            'user_create = tracim_backend.command.user:CreateUserCommand',
            'user_update = tracim_backend.command.user:UpdateUserCommand',
            'db_init = tracim_backend.command.database:InitializeDBCommand',
            'db_delete = tracim_backend.command.database:DeleteDBCommand',
            'webdav start = tracim_backend.command.webdav:WebdavRunnerCommand',
            'caldav start = tracim_backend.command.caldav:CaldavRunnerCommand',
            'caldav sync = tracim_backend.command.caldav:CaldavSyncCommand',
            'search index-create = tracim_backend.command.search:SearchIndexInitCommand',
            'search index-populate = tracim_backend.command.search:SearchIndexIndexCommand',
            'search index-upgrade-experimental = tracim_backend.command.search:SearchIndexUpgradeCommand',
            'search index-drop = tracim_backend.command.search:SearchIndexDeleteCommand',
            'dev parameters list = tracim_backend.command.devtools:ParametersListCommand'
        ]
    },
    message_extractors={'tracim_backend': [
        ('**.py', 'python', None),
        ('templates/**.mak', 'mako', None),
        ]
    }
)
