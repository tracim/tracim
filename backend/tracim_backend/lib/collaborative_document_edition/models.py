import typing


class CollaborativeDocumentEditionFileType(object):
    def __init__(
        self, mimetype: str, extension: str, associated_action: str, url_source: str
    ) -> None:
        self.mimetype = mimetype
        self.extension = extension
        self.associated_action = associated_action
        self.url_source = url_source


class CollaborativeDocumentEditionToken(object):
    def __init__(self, access_token: str) -> None:
        self.access_token = access_token


class FileTemplateList(object):
    def __init__(self, file_templates: typing.List[str]) -> None:
        self.file_templates = file_templates


class CollaborativeDocumentEditionConfig(object):
    def __init__(
        self, software: str, supported_file_types: typing.List[CollaborativeDocumentEditionFileType]
    ) -> None:
        self.software = software
        self.supported_file_types = supported_file_types
