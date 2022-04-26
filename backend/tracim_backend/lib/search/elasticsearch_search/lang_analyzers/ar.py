from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.lib.search.elasticsearch_search.default_analyzers import underscore_as_minus

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html


arabic_stop = analysis.token_filter("arabic_stop", type="stop", stopwords="_arabic_")
arabic_stemmer = analysis.token_filter("arabic_stemmer", type="stemmer", language="arabic")
tracim_arabic_analyzer = analyzer(
    "tracim_arabic",
    tokenizer="standard",
    filter=["lowercase", "decimal_digit", arabic_stop, "arabic_normalization", arabic_stemmer],
    char_filter=underscore_as_minus,
)
