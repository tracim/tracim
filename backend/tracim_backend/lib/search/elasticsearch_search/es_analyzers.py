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

# NOTE - GM - 2022-04-20 : Custom Language analyzer based on reference lang analyzer:
# custom behavior include:
# - split on "_" with underscore_as_minus char filter.
# about original lang analyzer, see:
# https://www.elastic.co/guide/en/elasticsearch/reference/7.13/analysis-lang-analyzer.html

#  French  #
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

#  English  #
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

#  German  #
german_stop = analysis.token_filter("german_stop", type="stop", stopwords="_german_")
german_stemmer = analysis.token_filter("german_stemmer", type="stemmer", language="light_german")

tracim_german_analyzer = analyzer(
    "tracim_german",
    tokenizer="standard",
    filter=["lowercase", german_stop, "german_normalization", german_stemmer],
    char_filter=underscore_as_minus,
)

#  Portuguese  #
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

#  Arabic  #
arabic_stop = analysis.token_filter("arabic_stop", type="stop", stopwords="_arabic_")
arabic_stemmer = analysis.token_filter("arabic_stemmer", type="stemmer", language="arabic")

tracim_arabic_analyzer = analyzer(
    "tracim_arabic",
    tokenizer="standard",
    filter=["lowercase", "decimal_digit", arabic_stop, "arabic_normalization", arabic_stemmer],
    char_filter=underscore_as_minus,
)
