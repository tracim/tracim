from .fixtures import *


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


def test_mail_notifier_running(tracim):
    tracim_mail_notifier = tracim.supervisor('tracim_mail_notifier')
    assert tracim_mail_notifier.is_running

def test_mail_fetcher_is_running(tracim):
    tracim_mail_notifier = tracim.supervisor('tracim_mail_fetcher')
    assert tracim_mail_notifier.is_running

def test_tracimcli_access(tracim, capsys):
    result = tracim.check_output('tracimcli dev parameters value -f -d -c /etc/tracim/development.ini')
    with capsys.disabled():
        print('\n')
        print(result)
        print('\n')
    assert result
