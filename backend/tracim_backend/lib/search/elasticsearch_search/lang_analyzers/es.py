from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.lib.search.elasticsearch_search.default_analyzers import underscore_as_minus

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html


spanish_stop = analysis.token_filter("spanish_stop", type="stop", stopwords="_spanish_")
spanish_stemmer = analysis.token_filter("spanish_stemmer", type="stemmer", language="light_spanish")
tracim_spanish_analyzer = analyzer(
    "tracim_spanish",
    tokenizer="standard",
    filter=["lowercase", spanish_stop, spanish_stemmer],
    char_filter=underscore_as_minus,
)
