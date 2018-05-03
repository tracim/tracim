class SmtpConfiguration(object):
    """Container class for SMTP configuration used in Tracim."""

    def __init__(self, server: str, port: int, login: str, password: str):
        self.server = server
        self.port = port
        self.login = login
        self.password = password


class EST(object):
    """
    EST = Email Subject Tags - this is a convenient class - no business logic
    here
    This class is intended to agregate all dynamic content that may be included
    in email subjects
    """

    WEBSITE_TITLE = '{website_title}'
    WORKSPACE_LABEL = '{workspace_label}'
    CONTENT_LABEL = '{content_label}'
    CONTENT_STATUS_LABEL = '{content_status_label}'

    @classmethod
    def all(cls):
        return [
            cls.CONTENT_LABEL,
            cls.CONTENT_STATUS_LABEL,
            cls.WEBSITE_TITLE,
            cls.WORKSPACE_LABEL
        ]


