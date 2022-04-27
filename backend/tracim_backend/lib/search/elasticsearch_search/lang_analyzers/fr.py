from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

from tracim_backend.lib.search.elasticsearch_search.default_analyzers import underscore_as_minus

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html


french_elision = analysis.token_filter(
    "french_elision",
    type="elision",
    article_case=True,
    articles=["l", "m", "t", "qu", "n", "s", "j", "d", "c", "jusqu", "quoiqu", "lorsqu", "puisqu"],
)
french_stop = analysis.token_filter("french_stop", type="stop", stopwords="_french_")
french_stemmer = analysis.token_filter("french_stemmer", type="stemmer", language="light_french")
tracim_french_analyzer = analyzer(
    "tracim_french",
    tokenizer="standard",
    filter=[french_elision, "lowercase", french_stop, french_stemmer],
    char_filter=underscore_as_minus,
)
