import typing


class CollaboraFileType(object):
    def __init__(self, mimetype, extension, associated_action, url_source):
        self.mimetype = mimetype
        self.extension = extension
        self.associated_action = associated_action
        self.url_source = url_source


class CollaborativeDocumentEditionToken(object):
    def __init__(self, access_token):
        self.access_token = access_token


class FileTemplateList(object):
    def __init__(self, file_templates: typing.List[str]):
        self.file_templates = file_templates
