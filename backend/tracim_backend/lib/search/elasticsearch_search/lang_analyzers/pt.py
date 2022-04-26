from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.lib.search.elasticsearch_search.lang_analyzers.default_analyzers import (
    underscore_as_minus,
)

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html


portuguese_stop = analysis.token_filter("portuguese_stop", type="stop", stopwords="_portuguese_")
portuguese_stemmer = analysis.token_filter(
    "portuguese_stemmer", type="stemmer", language="light_portuguese"
)
tracim_portuguese_analyzer = analyzer(
    "tracim_portuguese",
    tokenizer="standard",
    filter=["lowercase", portuguese_stop, portuguese_stemmer],
    char_filter=underscore_as_minus,
)
