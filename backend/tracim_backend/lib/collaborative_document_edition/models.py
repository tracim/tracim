import typing


class CollaborativeDocumentEditionFileType(object):
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


class CollaborativeDocumentEditionConfig(object):
    def __init__(
        self, software: str, supported_file_types: typing.List[CollaborativeDocumentEditionFileType]
    ):
        self.software = software
        self.supported_file_types = supported_file_types
