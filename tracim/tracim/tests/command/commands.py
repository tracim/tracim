# -*- coding: utf-8 -*-
import os
import subprocess

from nose.tools import ok_

import tracim


class TestCommands(object):
    def test_commands(self):
        """
        Test listing of gearbox command: Tracim commands must be listed
        :return:
        """
        os.chdir(os.path.dirname(tracim.__file__) + '/../')

        output = subprocess.check_output(["gearbox", "-h"])
        output = output.decode('utf-8')

        ok_(output.find('not a command') == -1)

        ok_(output.find('serve') > 0)

        ok_(output.find('ldap server') > 0)
        ok_(output.find('user create') > 0)
        ok_(output.find('user update') > 0)
