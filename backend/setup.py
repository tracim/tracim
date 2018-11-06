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
    'pyramid_jinja2',
    'pyramid_retry',
    'waitress',
    # Database
    'pyramid_tm',
    'SQLAlchemy',
    'transaction',
    'zope.sqlalchemy',
    'alembic',
    # API
    'hapic>=0.57',
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
    'preview-generator>=0.7',
    'colour',
    # mail-notifier
    'mako',
    'lxml',
    'redis',
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
    # frontend file serve
    'pyramid_mako',
    # i18n
    'Babel',
]

tests_require = [
    'WebTest >= 1.3.1',  # py3 compat
    'pytest',
    'pytest-cov',
    'pep8',
    'mypy',
    'requests',
    'responses',
    'mock',
    'Pillow',
    'freezegun'
]

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
        'Development Status :: 2 - Pre-Alpha',
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
        'mysql': mysql_require,
        'postgresql': postgresql_require,
    },
    install_requires=requires,
    entry_points={
        'paste.app_factory': [
            'main = tracim_backend:web',
            'webdav = tracim_backend:webdav'
        ],
        'console_scripts': [
            'tracimcli = tracim_backend.command:main',
        ],
        'tracimcli': [
            'test = tracim_backend.command:TestTracimCommand',
            'user_create = tracim_backend.command.user:CreateUserCommand',
            'user_update = tracim_backend.command.user:UpdateUserCommand',
            'db_init = tracim_backend.command.database:InitializeDBCommand',
            'db_delete = tracim_backend.command.database:DeleteDBCommand',
            'webdav start = tracim_backend.command.webdav:WebdavRunnerCommand',
        ]
    },
    message_extractors={'tracim_backend': [
        ('**.py', 'python', None),
        ('templates/**.mak', 'mako', None),
        ]
    }
)
