import typing

# from elasticsearch_dsl import Float
from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import Field
from elasticsearch_dsl import InnerDoc
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Nested
from elasticsearch_dsl import Object
from elasticsearch_dsl import Text
from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.config import CFG

EXACT_FIELD = "exact"

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
# NOTE 2021-11-02 - S.G. - Configuring a maximum length for tokens (e.g. words)
# so that the following error does not occur:
# https://stackoverflow.com/questions/24019868/utf8-encoding-is-longer-than-the-max-length-32766
# It can happen in HTML custom properties in which images or videos are embedded
# when the custom properties schema does not set '"format"="html"'.
max_token_length_filter = analysis.token_filter(
    "max_token_length_filter", type="length", min=0, max=32766
)
# NOTE 2021-11-04 - G.M. - Configuring a maximum length for keyword:
# like tokens, keyword bigger than 32766 will fail, this is the max size accepted for keyword,
# if text is bigger, keyword will not be stored.
# https://www.elastic.co/guide/en/elasticsearch/reference/current/ignore-above.html
# ignore above count by character, so for utf-8 8191*4 ( 4 is max byte for utf-8 character) = 32766
UTF8_MAX_KEYWORD_SIZE = 8191

edge_ngram_folding = analyzer(
    "edge_ngram_folding",
    tokenizer="standard",
    filter=[max_token_length_filter, "lowercase", "asciifolding", edge_ngram_token_filter],
)
html_folding = analyzer(
    "html_folding",
    tokenizer="standard",
    filter=[max_token_length_filter, "lowercase", "asciifolding", edge_ngram_token_filter],
    char_filter="html_strip",
)
html_exact_folding = analyzer(
    "html_exact_folding",
    tokenizer="standard",
    filter=[max_token_length_filter],
    char_filter="html_strip",
)


class SimpleKeyword(Keyword):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            ignore_above=UTF8_MAX_KEYWORD_SIZE, **kwargs,
        )


class SimpleText(Text):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            fields={EXACT_FIELD: SimpleKeyword()},
            analyzer=edge_ngram_folding,
            search_analyzer=folding,
            **kwargs,
        )


class HtmlText(Text):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            fields={EXACT_FIELD: Text(analyzer=html_exact_folding)},
            analyzer=html_folding,
            search_analyzer=folding,
            **kwargs,
        )


class KeywordWithText(Keyword):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            fields={"text": Text(analyzer=edge_ngram_folding, search_analyzer=folding, **kwargs)},
            ignore_above=UTF8_MAX_KEYWORD_SIZE,
        )


class DigestUser(InnerDoc):
    user_id = Integer()
    public_name = Text(fields={EXACT_FIELD: SimpleKeyword()})
    has_avatar = Boolean()
    has_cover = Boolean()


class DigestWorkspace(InnerDoc):
    workspace_id = Integer()
    label = Text(fields={EXACT_FIELD: SimpleKeyword()})


class DigestContent(InnerDoc):
    content_id = Integer()
    label = SimpleText()
    slug = SimpleKeyword()
    content_type = SimpleKeyword()


class DigestComments(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    raw_content = HtmlText()


class FileData(InnerDoc):
    content = Text(analyzer=folding)
    content_de = Text(analyzer="german")
    content_en = Text(analyzer="english")
    content_fr = Text(analyzer="french")
    content_pt = Text(analyzer="portuguese")
    title = Text()
    name = Text()
    author = Text()
    keywords = SimpleKeyword(multi=True)
    date = Date()
    content_type = SimpleKeyword()
    content_length = Integer()
    language = SimpleKeyword()


class IndexedContent(Document):
    """
    ElasticSearch Content Models.
    Used for index creation.

    Should stay an enhanced version of ContentDigestSchema.
    """

    content_namespace = SimpleKeyword()
    content_id = Integer()
    current_revision_id = Integer()
    current_revision_type = SimpleKeyword()
    slug = SimpleKeyword()
    parent_id = Integer()
    workspace_id = Integer()
    workspace = Object(DigestWorkspace)
    label = SimpleText()
    content_type = SimpleKeyword()
    sub_content_types = SimpleKeyword(multi=True)
    status = SimpleKeyword()
    is_archived = Boolean()
    is_deleted = Boolean()
    is_editable = Boolean()
    show_in_ui = Boolean()
    file_extension = SimpleText()
    filename = SimpleText()
    modified = Date()
    created = Date()
    active_shares = Integer()

    # Fields below are specific to IndexedContent

    is_active = Boolean()
    description = HtmlText()
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
    raw_content = HtmlText()
    content_size = Integer()

    tags = KeywordWithText()
    tag_count = Integer()

    # INFO - G.M - 2019-05-31 - b64_file is needed for storing the raw file contents
    # it is analysed then removed by the ingest pipeline.
    b64_file = Text()
    file_data = Object(FileData)


# Mappings from (type, format) -> ES field type.
# format is currently only used for "string".

# NOTE - 2021-03-02 - RJ
# Everything is handled as text instead of using Boolean(), Float() and Date() fields.
# A string search in the user's custom properties otherwise fails
# on a date field with the following error:
# RequestError(400, 'search_phase_execution_exception', 'failed to parse date field [Hello] with format
# [strict_date_optional_time||epoch_millis]: [failed to parse date field [Hello] with format
# [strict_date_optional_time||epoch_millis]]')
# (with Hello being the search string)

JSON_SCHEMA_TYPE_MAPPINGS = {
    ("boolean", None): SimpleText(),
    ("object", None): Object(),
    ("number", None): SimpleText(),
    ("string", "date"): SimpleText(),
    ("string", "date-time"): SimpleText(),
    ("string", "html"): HtmlText(),
    # default string field type
    ("string", None): SimpleText(),
    ("null", None): SimpleText(),
    # default field type
    (None, None): SimpleText(),
}

JsonSchemaDict = typing.Dict[str, typing.Any]


def get_es_field_from_json_schema(schema: JsonSchemaDict) -> Field:
    """Return the right elasticsearch field for a given JSON schema."""
    type_ = schema.get("type")
    if type_ == "array":
        items_schema = schema.get("items")
        if isinstance(items_schema, dict):
            field = get_es_field_from_json_schema(items_schema)
            field._multi = True
        else:
            field = Field(multi=True)
    elif type_ == "object":
        properties = {
            key: get_es_field_from_json_schema(value)
            for key, value in schema.get("properties", []).items()
        }
        field = Object(properties=properties)
    else:
        format_ = schema.get("format")
        try:
            field = JSON_SCHEMA_TYPE_MAPPINGS[(type_, format_)]
        except KeyError:
            # Fallback for unmanaged formats
            field = JSON_SCHEMA_TYPE_MAPPINGS[(type_, None)]
    return field


def create_indexed_user_class(config: CFG) -> typing.Type[Document]:
    """Create the indexed user class appropriate for the given configuration.

    The returned document class has a custom_properties field created
    using the USER__CUSTOM_PROPERTIES__JSON_SCHEMA.
    """

    class IndexedUser(Document):
        """Model used for indexing users in elasticsearch."""

        user_id = Integer()
        public_name = SimpleText()
        username = SimpleText()
        is_deleted = Boolean()
        is_active = Boolean()
        workspace_ids = Integer(multi=True)
        newest_authored_content_date = Date()
        has_avatar = Boolean()
        has_cover = Boolean()
        custom_properties = get_es_field_from_json_schema(
            config.USER__CUSTOM_PROPERTIES__JSON_SCHEMA
        )

    return IndexedUser


class IndexedWorkspace(Document):
    """Model used for indexing workspaces in elasticsearch."""

    access_type = SimpleKeyword()
    label = SimpleText()
    description = HtmlText()
    workspace_id = Integer()
    is_deleted = Boolean()
    owner_id = Integer()
    member_ids = Integer(multi=True)
    member_count = Integer()
    content_count = Integer()
