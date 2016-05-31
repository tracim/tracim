from tg import config


def is_authenticated(user, password):
    """
    :param user: user email
    :param password: user password
    :return: True if auth success, False if not
    """
    return bool(config.get('sa_auth').authmetadata.authenticate({}, {
        'login': user,
        'password': password
    }))
