from enum import Enum
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


class FileTemplateCategory(Enum):
    calc = "calc"
    text = "text"
    pres = "pres"


class FileTemplate(object):
    def __init__(self, template_name: str, category: FileTemplateCategory):
        self.template_name = template_name
        self.category = category.value


class FileTemplateInfo(object):
    def __init__(
        self,
        categories: typing.List[FileTemplateCategory],
        file_templates: typing.List[FileTemplate],
    ):
        self.categories = categories
        self.file_templates = file_templates
