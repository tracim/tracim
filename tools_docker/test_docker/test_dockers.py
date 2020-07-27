from .fixtures import *


def test_redis_running(tracim):
    redis = tracim.service("redis-server")
    assert redis.is_enabled
    assert redis.is_running
    assert tracim.socket("tcp://127.0.0.1:6379").is_listening


def test_apache_running(tracim):
    apache2 = tracim.service("apache2")
    assert apache2.is_running
    assert apache2.is_enabled
    assert tracim.socket("tcp://80").is_listening


def test_uwsgi_running(tracim):
    uwsgi = tracim.service("uwsgi")
    assert uwsgi.is_running
    assert uwsgi.is_enabled
    assert tracim.socket("tcp://8080").is_listening


def test_webdav_running(tracim):
    assert tracim.socket("tcp://3030").is_listening


def test_caldav_running(tracim):
    assert tracim.socket("tcp://127.0.0.1:5232").is_listening

def test_pushpin_running(tracim):
    assert tracim.socket("tcp://127.0.0.1:7999").is_listening
    assert tracim.socket("tcp://127.0.0.1:5561").is_listening
    assert tracim.process.get(user="pushpin", comm='pushpin')


def test_mail_notifier_running(tracim):
    tracim_mail_notifier = tracim.supervisor('tracim_mail_notifier')
    assert tracim_mail_notifier.is_running


def test_mail_fetcher_is_running(tracim):
    tracim_mail_fetcher = tracim.supervisor('tracim_mail_fetcher')
    assert tracim_mail_fetcher.is_running


def test_rq_worker_is_running(tracim):
    tracim_rq_worker = tracim.supervisor('tracim_rq_worker')
    assert tracim_rq_worker.is_running

def test_xvfb_is_running(tracim):
    xvfb = tracim.supervisor('xvfb')
    assert xvfb.is_running

def test_tracim_dirs_exists(tracim):
    assert tracim.file("/etc/tracim/").is_directory
    assert tracim.file("/var/tracim/").is_directory
    assert tracim.file("/tracim/").is_directory


def test_docker_scripts_exists(tracim):
    assert tracim.file("/tracim/tools_docker/Debian_Uwsgi/check_env_vars.sh").is_file
    assert tracim.file("/tracim/tools_docker/Debian_Uwsgi/common.sh").is_file


def test_users(tracim):
    pushpin_user = tracim.user("pushpin")
    redis_user = tracim.user("redis")
    www_data_user = tracim.user("www-data")
    assert pushpin_user.exists
    assert redis_user.exists
    assert www_data_user.exists
    assert "www-data" in pushpin_user.groups
    assert "www-data" in redis_user.groups
    assert "www-data" in www_data_user.groups


def test_default_file_created(tracim):
    assert tracim.file("/etc/tracim/development.ini").is_file
    assert tracim.file("/tracim/tools_docker/Debian_Uwsgi/supervisord_tracim.conf").is_file
    assert tracim.file("tracim/backend/tracim_backend/locale/en/backend.json").is_file
    assert tracim.file("tracim/backend/tracim_backend/locale/fr/backend.json").is_file
    assert tracim.file("tracim/backend/tracim_backend/locale/pt/backend.json").is_file

    assert tracim.file("/etc/tracim/apache2.conf").is_file
    assert tracim.file("/etc/apache2/sites-available/tracim.conf").is_symlink
    assert tracim.file("/etc/apache2/sites-enabled/tracim.conf").is_symlink

    assert tracim.file("/etc/tracim/tracim_web.ini").is_file
    assert tracim.file("/etc/uwsgi/apps-available/tracim_web.ini").is_symlink
    assert tracim.file("/etc/uwsgi/apps-enabled/tracim_web.ini").is_symlink

    assert tracim.file("/etc/tracim/color.json").is_file
    assert tracim.file("/tracim/color.json").is_symlink

    assert tracim.file("/etc/tracim/logo.png").is_file
    assert tracim.file("/tracim/frontend/dist/assets/images/logo-tracim.png.default").is_file
    assert tracim.file("/tracim/frontend/dist/assets/images/logo-tracim.png").is_symlink
    assert tracim.file("/etc/tracim/plugins").is_directory
    assert tracim.file("/etc/tracim/custom_toolbox").is_directory

    assert tracim.file("/var/tracim/logs").is_directory
    assert tracim.file("/var/tracim/logs/tracim_web.log").is_file
    assert tracim.file("/var/tracim/logs/tracim_webdav.log").is_file
    assert tracim.file("/var/tracim/logs/tracim_caldav.log").is_file
    assert tracim.file("/var/tracim/logs/apache2-access.log").is_file
    assert tracim.file("/var/tracim/logs/apache2-error.log").is_file
    assert tracim.file("/var/tracim/logs/mail_notifier.log").is_file
    assert tracim.file("/var/tracim/logs/rq_worker.log").is_file
    assert tracim.file("/var/tracim/logs/supervisord.log").is_file
    assert tracim.file("/var/tracim/logs/redis").is_directory
    assert tracim.file("/var/tracim/logs/redis/redis-server.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin").is_directory
    assert tracim.file("/var/tracim/logs/pushpin/access_7999.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin/error_7999.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin/m2adapter.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin/mongrel2_7999.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin/pushpin-handler.log").is_file
    assert tracim.file("/var/tracim/logs/pushpin/pushpin-proxy.log").is_file
    assert tracim.file("/var/tracim/logs/zurl.log").is_file
    assert oct(tracim.file("/var/tracim/logs").mode) == '0o775'
    assert oct(tracim.file("/var/tracim/logs/redis").mode) == '0o775'
    assert oct(tracim.file("/var/tracim/logs/pushpin").mode) == '0o775'
    assert tracim.file("/var/tracim/logs").group == 'www-data'
    assert tracim.file("/var/tracim/logs").user == 'www-data'

    assert tracim.file("/var/log/uwsgi/app/tracim_web.log").is_symlink
    assert tracim.file("/var/log/uwsgi/app/tracim_webdav.log").is_symlink
    assert tracim.file("/var/log/uwsgi/app/tracim_caldav.log").is_symlink
    assert tracim.file("/var/log/apache2/tracim-access.log").is_symlink
    assert tracim.file("/var/log/apache2/tracim-error.log").is_symlink

    assert tracim.file("/var/tracim/data").is_directory
    assert tracim.file("/var/tracim/assets").is_directory
    assert tracim.file("/var/tracim/data/sessions_data").is_directory
    assert tracim.file("/var/tracim/data/sessions_lock").is_directory
    assert tracim.file("/var/tracim/data/depot").is_directory
    assert tracim.file("/var/tracim/data/preview").is_directory
    assert tracim.file("/var/tracim/data/radicale_storage").is_directory
    assert tracim.file("/var/tracim/data/tracim_env_variables").is_file

    assert tracim.file("/var/run/uwsgi/app/").is_directory
    assert tracim.file("/var/run/uwsgi/").user == "www-data"
    assert tracim.file("/var/run/uwsgi/").group == "www-data"
    assert tracim.file("/var/tracim/").user == "www-data"
    assert tracim.file("/var/tracim/").group == "www-data"


def test_sqlite_database_available(tracim):
    assert tracim.file("/var/tracim/data/tracim.sqlite").is_file


def test_webdav_config_available(tracim):
    assert tracim.file("/etc/tracim/tracim_webdav.ini").is_file
    assert tracim.file("/etc/uwsgi/apps-available/tracim_webdav.ini").is_symlink


def test_caldav_config_available(tracim):
    assert tracim.file("/etc/tracim/tracim_caldav.ini").is_file
    assert tracim.file("/etc/uwsgi/apps-available/tracim_caldav.ini").is_symlink


def test_removed_files(tracim):
    assert not tracim.file("/etc/apache2/sites-enabled/000-default.conf").is_file


def test_existing_packages(tracim):
    assert tracim.package('apache2').is_installed
    assert tracim.package('git').is_installed
    assert tracim.package('supervisor').is_installed
    assert tracim.package('redis-server').is_installed
    assert tracim.package('imagemagick').is_installed
    assert tracim.package('ghostscript').is_installed
    assert tracim.package('xvfb').is_installed
    assert tracim.package('uwsgi-plugin-python3').is_installed
    assert tracim.package('uwsgi').is_installed
    assert tracim.package('ffmpeg').is_installed
    assert tracim.package('python3').is_installed
    assert tracim.package('libreoffice').is_installed
    assert tracim.package('qpdf').is_installed
    assert tracim.package('ufraw-batch').is_installed
    assert tracim.package("libimage-exiftool-perl").is_installed
    assert tracim.package("libfile-mimeinfo-perl").is_installed
    assert tracim.pip_package.get_packages().get('tracim-backend')

def test_removed_packages(tracim):
    assert not tracim.package('curl').is_installed
    assert not tracim.package('nodejs').is_installed
    assert not tracim.package('python3-dev').is_installed
    assert not tracim.package('build-essential').is_installed

def test_tracimcli_access(tracim, capsys):
    result = tracim.check_output('tracimcli dev parameters value -f -d -c /etc/tracim/development.ini')
    with capsys.disabled():
        print('\n')
        print(result)
        print('\n')
    assert result


def test_all(tracim, capsys):
    test_redis_running(tracim)
    test_apache_running(tracim)
    test_uwsgi_running(tracim)
    test_webdav_running(tracim)
    test_caldav_running(tracim)
    test_pushpin_running(tracim)
    test_mail_notifier_running(tracim)
    test_mail_fetcher_is_running(tracim)
    test_rq_worker_is_running(tracim)
    test_xvfb_is_running(tracim)
    test_tracim_dirs_exists(tracim)
    test_docker_scripts_exists(tracim)
    test_users(tracim)
    test_default_file_created(tracim)
    test_sqlite_database_available(tracim)
    test_webdav_config_available(tracim)
    test_caldav_config_available(tracim)
    test_removed_files(tracim)
    test_existing_packages(tracim)
    test_removed_packages(tracim)
    test_tracimcli_access(tracim, capsys)
