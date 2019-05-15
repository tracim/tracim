from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Text
from elasticsearch_dsl import analyzer

folding = analyzer("folding", tokenizer="standard", filter=["lowercase", "asciifolding"])
INDEX_DOCUMENTS = "documents"


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.
    """

    class Index:
        name = INDEX_DOCUMENTS

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
