# -*- coding: utf-8 -*-
import datetime


def cmp_to_key(mycmp):
    """
    List sort related function

    Convert a cmp= function into a key= function
    """
    class K(object):
        def __init__(self, obj, *args):
            self.obj = obj
        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0
        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0
        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0
        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0
        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0
        def __ne__(self, other):
            return mycmp(self.obj, other.obj) != 0
    return K

def current_date_for_filename() -> str:
    """
    ISO8601 current date, adapted to be used in filename (for
    webdav feature for example), with trouble-free characters.
    :return: current date as string like "2018-03-19T15.49.27.246592"
    """
    # INFO - G.M - 19-03-2018 - As ':' is in transform_to_bdd method in
    # webdav utils, it may cause trouble. So, it should be replaced to
    # a character which will not change in bdd.
    return datetime.datetime.now().isoformat().replace(':', '.')