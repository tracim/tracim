from fnmatch import fnmatch
import typing

from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Text
from elasticsearch_dsl import analyzer

folding = analyzer("folding", tokenizer="standard", filter=["lowercase", "asciifolding"])
INDEX_DOCUMENTS_ALIAS = "documents"
INDEX_DOCUMENTS_PATTERN = INDEX_DOCUMENTS_ALIAS + "-*"


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.
    """

    @classmethod
    def _matches(cls, hit: dict[str, typing.Any]) -> bool:
        # INFO - G.M - 2019-05-15 - alias migration mecanism to allow easily updatable index.
        # from https://github.com/elastic/elasticsearch-dsl-py/blob/master/examples/alias_migration.py
        # override _matches to match indices in a pattern instead of just ALIAS
        # hit is the raw dict as returned by elasticsearch
        return fnmatch(hit["_index"], INDEX_DOCUMENTS_PATTERN)

    class Index:
        # we will use an alias instead of the index
        name = INDEX_DOCUMENTS_ALIAS

    content_id = Integer()
    parent_id = Integer()
    workspace_id = Integer()
    label = Text(analyzer=folding)
    slug = Keyword()
    content_type = Keyword()
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
    raw_content = Text(analyzer=folding)
    lapin = Text()
