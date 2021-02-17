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

# INFO - G.M - 2019-05-31 - Analyzer/indexing explained:
# Instead of relying of wildcard for autocompletion which is costly and make some feature doesn't
# work correctly, for example ranking, We use ngram mechanism.
# This means that for word "elephant", we will index thing like "ele", "elep", "lepha", etc...
# As we don't want to have a *text* matching but only an autocomplete matching like text*, we use
# edge_ngram, we will only index for "elephant": "ele" , "elep" , "eleph" , etc..
# We want that ele match elephant result, but we do not want that elephant match ele result,
# that's why we set different analyzer for search (we search word given) and indexing (we index ngram
# of label of content to allow autocompletion)

# INFO - G.M - 2019-05-23 - search_analyser: do search for content given an some similar word
folding = analyzer("folding", tokenizer="standard", filter=["lowercase", "asciifolding"])
# INFO - G.M - 2019-05-23 -  index_analysers, index edge ngram for autocompletion and strip html for indexing
edge_ngram_token_filter = analysis.token_filter(
    "edge_ngram_filter", type="edge_ngram", min_ngram=2, max_gram=20
)
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
html_exact_folding = analyzer("html_exact_folding", tokenizer="standard", char_filter="html_strip")


class DigestUser(InnerDoc):
    user_id = Integer()
    public_name = Text(fields={"exact": Keyword()})
    has_avatar = Boolean()
    has_cover = Boolean()


class DigestWorkspace(InnerDoc):
    workspace_id = Integer()
    label = Text(fields={"exact": Keyword()})


class DigestContent(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    label = Text(fields={"exact": Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding)
    slug = Keyword()
    content_type = Keyword()


class DigestComments(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    raw_content = Text(
        fields={"exact": Text(analyzer=html_exact_folding)},
        analyzer=html_folding,
        search_analyzer=folding,
    )


class FileData(InnerDoc):
    content = Text(analyzer=folding)
    content_de = Text(analyzer="german")
    content_en = Text(analyzer="english")
    content_fr = Text(analyzer="french")
    content_pt = Text(analyzer="portuguese")
    title = Text()
    name = Text()
    author = Text()
    keywords = Keyword(multi=True)
    date = Date()
    content_type = Keyword()
    content_length = Integer()
    language = Keyword()


KEYWORD_FIELD = "keyword"
EXACT_FIELD = "exact"


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.

    Should stay an enhanced version of ContentDigestSchema.
    """

    content_namespace = Keyword()
    content_id = Integer()
    current_revision_id = Integer()
    current_revision_type = Keyword()
    slug = Keyword()
    parent_id = Integer()
    workspace_id = Integer()
    workspace = Object(DigestWorkspace)
    # INFO - G.M - 2019-07-17 - as label store ngram of limited size, we do need
    # to store both label and label.exact to handle autocomplete up to max_gram of label analyzer
    # but also support for exact naming for any size of label.
    label = Text(
        fields={KEYWORD_FIELD: Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding
    )
    content_type = Keyword()
    sub_content_types = Keyword(multi=True)
    status = Keyword()
    is_archived = Boolean()
    is_deleted = Boolean()
    is_editable = Boolean()
    show_in_ui = Boolean()
    file_extension = Text(
        fields={KEYWORD_FIELD: Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding
    )
    filename = Text(
        fields={KEYWORD_FIELD: Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding
    )
    modified = Date()
    created = Date()
    active_shares = Integer()

    # Fields below are specific to IndexedContent

    is_active = Boolean()
    # path as returned by the /path HTTP API
    path = Nested(DigestContent)
    # INFO - G.M - 2019-05-31 - we need to include in parent here, because we need
    # to search into comments content.
    comments = Nested(DigestComments, include_in_parent=True)
    comment_count = Integer()
    author = Object(DigestUser)
    last_modifier = Object(DigestUser)

    archived_through_parent_id = Integer()
    deleted_through_parent_id = Integer()
    raw_content = Text(
        fields={"exact": Text(analyzer=html_exact_folding)},
        analyzer=html_folding,
        search_analyzer=folding,
    )
    content_size = Integer()
    # INFO - G.M - 2019-05-31 - file is needed to store file content b64 value,
    # information about content are stored in the "file_data" fields not defined
    # in this mapping
    b64_file = Text()
    file_data = Object(FileData)


class IndexedUser(Document):
    # TODO - S.G. - 2021-02-05 - placeholder to test multi-index creation,
    # will be completed during https://github.com/tracim/tracim/issues/4095
    pass


class IndexedWorkspace(Document):
    # TODO - S.G. - 2021-02-05 - placeholder to test multi-index creation,
    # will be completed during https://github.com/tracim/tracim/issues/4134
    pass
