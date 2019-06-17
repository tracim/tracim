import os

# INFO - G.M - 2019-05-31 - Analyzer/indexing explained:
# Instead of relying of wildcard for autocompletion which is costly and make some feature doesn't
# work correctly, for example ranking, We use ngram mecanism.
# This means that for work "elephant", we will index thing like "ele", "elep", "lepha", etc...
# As we don't want to have a *text* matching but only an autocomplete matching like text*, we use
# edge_ngram, we will only index for "elephant": "ele" , "elep" , "eleph" , etc..
# We want that ele match elephant result, but we do not want that elephant match ele result,
# that's why we set different analyzer for search (we search word given) and indexing (we index ngram
# of label of content to allow autocompletion)
from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import InnerDoc
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Nested
from elasticsearch_dsl import Object
from elasticsearch_dsl import Text
from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer
from pyramid.exceptions import ConfigurationError

edge_ngram_token_filter = analysis.token_filter(
    "edge_ngram_filter", type="edge_ngram", min_ngram=2, max_gram=20
)
# INFO - G.M - 2019-05-23 - search_analyser: do search for content given an some similar word
folding = analyzer("folding", tokenizer="standard", filter=["lowercase", "asciifolding"])
# INFO - G.M - 2019-05-23 -  index_analysers, index edge ngram for autocompletion and strip html for indexing
edge_ngram_folding = analyzer(
    "edge_ngram_folding",
    tokenizer="standard",
    filter=["lowercase", "asciifolding", edge_ngram_token_filter],
)
html_folding = analyzer(
    "html_folding",
    tokenizer="standard",
    filter=["lowercase", "asciifolding", edge_ngram_token_filter],
    char_filter="html_strip",
)

DEFAULT_INDEX_DOCUMENTS_PATTERN_TEMPLATE = "{index_alias}-{date}"
# FIXME - G.M - 2019-05-24 - hack using env var only configuration of document alias and document
# pattern now, as it's currently complex to rewrite Lib signature to get needed information (we
# need to convert static IndexedContent object to something dynamic that we will pass to SearchApi)
# this should be refactor to have a true tracim config parameter for this.
# see https://github.com/tracim/tracim/issues/1835
INDEX_DOCUMENTS_ALIAS = os.environ.get("TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS", None)
if not INDEX_DOCUMENTS_ALIAS:
    raise ConfigurationError(
        "ERROR: you should set TRACIM_SEARCH__ELASTICSEARCH__INDEX_ALIAS env var for index "
        "alias name if you want to use tracim with elasticsearch search"
    )
INDEX_DOCUMENTS_PATTERN_TEMPLATE = os.environ.get(
    "TRACIM_SEARCH__ELASTICSEARCH__INDEX_PATTERN_TEMPLATE", DEFAULT_INDEX_DOCUMENTS_PATTERN_TEMPLATE
)
INDEX_DOCUMENTS_PATTERN = INDEX_DOCUMENTS_PATTERN_TEMPLATE.format(
    date="*", index_alias=INDEX_DOCUMENTS_ALIAS
)


class DigestUser(InnerDoc):
    user_id = Integer()
    public_name = Text()


class DigestWorkspace(InnerDoc):
    workspace_id = Integer()
    label = Text()


class DigestContent(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    label = Text(analyzer=edge_ngram_folding, search_analyzer=folding)
    slug = Keyword()
    content_type = Keyword()


class DigestComments(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    raw_content = Text(analyzer=html_folding, search_analyzer=folding)


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.
    """

    content_id = Integer()
    label = Text(analyzer=edge_ngram_folding, search_analyzer=folding)
    slug = Keyword()
    content_type = Keyword()

    workspace_id = Integer()
    workspace = Object(DigestWorkspace)
    parent_id = Integer()
    parent = Object(DigestContent)
    parents = Nested(DigestContent)
    # INFO - G.M - 2019-05-31 - we need to include in parent here, because we need
    # to search into comments content.
    comments = Nested(DigestComments, include_in_parent=True)
    author = Object(DigestUser)
    last_modifier = Object(DigestUser)

    sub_content_types = Keyword(multi=True)
    status = Keyword()
    is_archived = Boolean()
    archived_through_parent_id = Integer()
    is_deleted = Boolean()
    deleted_through_parent_id = Integer()
    is_editable = Boolean()
    is_active = Boolean()
    show_in_ui = Boolean()
    file_extension = Text(analyzer=edge_ngram_folding, search_analyzer=folding)
    filename = Text(analyzer=edge_ngram_folding, search_analyzer=folding)
    modified = Date()
    created = Date()
    current_revision_id = Integer()
    raw_content = Text(analyzer=html_folding, search_analyzer=folding)
    # INFO - G.M - 2019-05-31 - file is needed to store file content b64 value,
    # information about content are stored in an "attachment" fields, which is
    # not defined in this mapping.
    file = Text()
