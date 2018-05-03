# -*- coding: utf-8 -*-
import os
import subprocess

import tracim


class TestCommands(object):
    def test_commands(self):
        """
        Test listing of tracimcli command: Tracim commands must be listed
        :return:
        """
        os.chdir(os.path.dirname(tracim.__file__) + '/../')

        output = subprocess.check_output(["tracimcli", "-h"])
        output = output.decode('utf-8')

        assert output.find('user create') > 0
        assert output.find('user update') > 0
        assert output.find('db init') > 0
        assert output.find('db delete') > 0
