from fnmatch import fnmatch
import typing

from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import InnerDoc
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Nested
from elasticsearch_dsl import Object
from elasticsearch_dsl import Text
from elasticsearch_dsl import analyzer

folding = analyzer("folding", tokenizer="standard", filter=["lowercase", "asciifolding"])
html_folding = analyzer(
    "html_folding",
    tokenizer="standard",
    filter=["lowercase", "asciifolding"],
    char_filter="html_strip",
)
INDEX_DOCUMENTS_ALIAS = "documents"
INDEX_DOCUMENTS_PATTERN = INDEX_DOCUMENTS_ALIAS + "-*"


class DigestUser(InnerDoc):
    user_id = Integer()
    public_name = Text()


class DigestWorkspace(InnerDoc):
    workspace_id = Integer()
    label = Text()


class DigestContent(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    label = Text(analyzer=folding)
    slug = Keyword()
    content_type = Keyword()


class DigestComments(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    raw_content = Text(analyzer=html_folding)


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.
    """

    @classmethod
    def _matches(cls, hit: typing.Dict[str, typing.Any]) -> bool:
        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # override _matches to match indices in a pattern instead of just ALIAS
        # hit is the raw dict as returned by elasticsearch

        return fnmatch(hit["_index"], INDEX_DOCUMENTS_PATTERN)

    class Index:
        # we will use an alias instead of the index
        name = INDEX_DOCUMENTS_ALIAS

    content_id = Integer()
    label = Text(analyzer=folding)
    slug = Keyword()
    content_type = Keyword()

    workspace_id = Integer()
    workspace = Object(DigestWorkspace)
    parent_id = Integer()
    parent = Object(DigestContent)
    parents = Nested(DigestContent)
    comments = Nested(DigestContent)
    author = Object(DigestUser)
    last_modifier = Object(DigestUser)

    sub_content_types = Keyword(multi=True)
    status = Keyword()
    is_archived = Boolean()
    is_deleted = Boolean()
    is_editable = Boolean()
    show_in_ui = Boolean()
    file_extension = Text(analyzer=folding)
    filename = Text(analyzer=folding)
    modified = Date()
    created = Date()
    current_revision_id = Integer()
    raw_content = Text(analyzer=html_folding)
