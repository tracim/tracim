# -*- coding: utf-8 -*-


def transform_to_display(string: str) -> str:
    """
    As characters that Windows does not support may have been inserted
    through Tracim in names, before displaying information we update path
    so that all these forbidden characters are replaced with similar
    shape character that are allowed so that the user isn't trouble and
    isn't limited in his naming choice
    """
    _TO_DISPLAY = {
        '/': '⧸',
        '\\': '⧹',
        ':': '∶',
        '*': '∗',
        '?': 'ʔ',
        '"': 'ʺ',
        '<': '❮',
        '>': '❯',
        '|': '∣'
    }

    for key, value in _TO_DISPLAY.items():
        string = string.replace(key, value)

    return string


def transform_to_bdd(string: str) -> str:
    """
    Called before sending request to the database to recover the right names
    """
    _TO_BDD = {
        '⧸': '/',
        '⧹': '\\',
        '∶': ':',
        '∗': '*',
        'ʔ': '?',
        'ʺ': '"',
        '❮': '<',
        '❯': '>',
        '∣': '|'
    }

    for key, value in _TO_BDD.items():
        string = string.replace(key, value)

    return string
