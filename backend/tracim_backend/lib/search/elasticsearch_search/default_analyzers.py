from elasticsearch_dsl import analysis
from elasticsearch_dsl import analyzer

# INFO - G.M - 2022-04-08 - Elasticsearch "pipeline" for analyser is :
# - char_filter : modify the entry
# - tokenizer : split the entry into token
# - filter/token_filter : modify the token
# As existing tokenizer doesn't look to be extendable with new separator, the workaround used here to
# be able to split on "_" is to replace them in char_filter to "-" which is an existing separator.
underscore_as_minus = analysis.char_filter("underscore_as_space", type="mapping", mappings=["_=>-"])

# INFO - G.M - 2022-04-07 - Locally  Testing analyser without running tracim is possible with elyzer
# (need same name python package)  with command like :
#  elyzer --es "http://localhost:9200" --index my-tracim-content --analyzer folding "Mary had_a little lamb"
# This permit to better understand each step of the analyzer process.

# INFO - G.M - 2019-05-23 - search_analyser: do search for content given an some similar word
folding = analyzer(
    "folding",
    tokenizer="standard",
    filter=["lowercase", "asciifolding"],
    char_filter=underscore_as_minus,
)
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

edge_ngram_folding = analyzer(
    "edge_ngram_folding",
    tokenizer="standard",
    filter=[max_token_length_filter, "lowercase", "asciifolding", edge_ngram_token_filter],
    char_filter=underscore_as_minus,
)
html_folding = analyzer(
    "html_folding",
    tokenizer="standard",
    filter=[max_token_length_filter, "lowercase", "asciifolding", edge_ngram_token_filter],
    char_filter=["html_strip", underscore_as_minus],
)
html_exact_folding = analyzer(
    "html_exact_folding",
    tokenizer="standard",
    filter=[max_token_length_filter],
    char_filter=["html_strip", underscore_as_minus],
)
