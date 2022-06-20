from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.lib.search.elasticsearch_search.default_analyzers import underscore_as_minus

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html


english_stop = analysis.token_filter("english_stop", type="stop", stopwords="_english_")
english_stemmer = analysis.token_filter("english_stemmer", type="stemmer", language="english")
english_possessive_stemmer = analysis.token_filter(
    "english_stemmer", type="stemmer", language="possessive_english"
)
tracim_english_analyzer = analyzer(
    "tracim_english",
    tokenizer="standard",
    filter=[english_possessive_stemmer, "lowercase", english_stop, english_stemmer],
    char_filter=underscore_as_minus,
)
