import typing

from elasticsearch_dsl import Boolean
from elasticsearch_dsl import Date
from elasticsearch_dsl import Document
from elasticsearch_dsl import Field
from elasticsearch_dsl import Float
from elasticsearch_dsl import InnerDoc
from elasticsearch_dsl import Integer
from elasticsearch_dsl import Keyword
from elasticsearch_dsl import Nested
from elasticsearch_dsl import Object
from elasticsearch_dsl import Text
from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.config import CFG

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
html_exact_folding = analyzer("html_exact_folding", tokenizer="standard", char_filter="html_strip",)


class SimpleText(Text):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            fields={"exact": Keyword()},
            analyzer=edge_ngram_folding,
            search_analyzer=folding,
            **kwargs
        )


class HtmlText(Text):
    def __init__(self, **kwargs: dict) -> None:
        super().__init__(
            fields={"exact": Text(analyzer=html_exact_folding)},
            analyzer=html_folding,
            search_analyzer=folding,
            **kwargs
        )


class DigestUser(InnerDoc):
    user_id = Integer()
    public_name = Text()
    has_avatar = Boolean()
    has_cover = Boolean()


class DigestWorkspace(InnerDoc):
    workspace_id = Integer()
    label = Text()


class DigestContent(InnerDoc):
    content_id = Integer()
    label = SimpleText()
    slug = Keyword()
    content_type = Keyword()


class DigestComments(InnerDoc):
    content_id = Integer()
    parent_id = Integer()
    raw_content = HtmlText()


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
    label = SimpleText()
    content_type = Keyword()
    sub_content_types = Keyword(multi=True)
    status = Keyword()
    is_archived = Boolean()
    is_deleted = Boolean()
    is_editable = Boolean()
    show_in_ui = Boolean()
    file_extension = Text(
        fields={"exact": Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding
    )
    filename = Text(
        fields={"exact": Keyword()}, analyzer=edge_ngram_folding, search_analyzer=folding
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
    author = Object(DigestUser)
    last_modifier = Object(DigestUser)

    archived_through_parent_id = Integer()
    deleted_through_parent_id = Integer()
    raw_content = HtmlText()
    content_size = Integer()

    # INFO - G.M - 2019-05-31 - file is needed to store file content b64 value,
    # information about content are stored in the "file_data" fields not defined
    # in this mapping
    b64_file = Text()


# Mappings from (type, format) -> ES field type.
# format is currently only used for "string".
JSON_SCHEMA_TYPE_MAPPINGS = {
    ("boolean", None): Boolean(),
    ("object", None): Object(),
    ("number", None): Float(),
    ("string", "date"): Date(),
    ("string", "date-time"): Date(),
    ("string", "html"): HtmlText(),
    # default string field type
    ("string", None): SimpleText(),
    # default field type
    (None, None): Field(),
}

JsonSchemaDict = typing.Dict[str, typing.Any]


def get_es_field_from_json_schema(schema: JsonSchemaDict) -> Field:
    """Return the right elastic-search field for a given JSON schema."""
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
        user_id = Integer()
        public_name = SimpleText()
        username = SimpleText()
        is_deleted = Boolean()
        is_active = Boolean()
        workspace_ids = Integer(multi=True)
        last_authored_content_revision_date = Date()
        has_avatar = Boolean()
        has_cover = Boolean()
        custom_properties = get_es_field_from_json_schema(
            config.USER__CUSTOM_PROPERTIES__JSON_SCHEMA
        )

    return IndexedUser


class IndexedWorkspace(Document):
    # TODO - S.G. - 2021-02-05 - placeholder to test multi-index creation,
    # will be completed during https://github.com/tracim/tracim/issues/4134
    pass
