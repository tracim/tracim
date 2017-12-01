from bs4 import BeautifulSoup, Tag


class HtmlSanitizerConfig(object):
    # some Default_html_tags type
    HTML_Heading_tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    HTML_Text_parts_tag = ['p',
                           'br', 'hr',
                           'pre', 'code', 'samp',  # preformatted content
                           'q', 'blockquote',  # quotes
                           ]
    HTML_Text_format_tag = ['b', 'i', 'u', 'small', 'sub', 'sup', ]
    HTML_Text_semantic_tag = ['strong', 'em',
                              'mark', 'cite', 'dfn',
                              'del', 'ins', ]
    HTML_Table_tag = ['table',
                      'thead', 'tfoot', 'tbody',
                      'tr', 'td', 'caption', ]

    HTML_List_tag = ['ul', 'li', 'ol',  # simple list
                     'dl', 'dt', 'dd', ]  # definition list

    # Rules
    Tag_whitelist = HTML_Heading_tag \
                    + HTML_Text_parts_tag \
                    + HTML_Text_format_tag \
                    + HTML_Text_semantic_tag \
                    + HTML_Table_tag \
                    + HTML_List_tag

    Tag_blacklist = ['script', 'style']

    # TODO - G.M - 2017-12-01 - Think about removing class/id Blacklist
    # These elements are no longer required.
    Class_blacklist = []
    Id_blacklist = []

    Attrs_whitelist = ['href']


class HtmlSanitizer(object):
    """
    Sanitize Html Rules :
    - Tag :
      - Remove Tag_blacklist tag
      - Keep Tag_whitelist tag
      - Unwrap others tags
    - Attrs :
      - Remove non-whitelisted attributes
    """

    @classmethod
    def sanitize(cls, html_body: str) -> str:
        soup = BeautifulSoup(html_body, 'html.parser')
        for tag in soup.findAll():
            if cls._tag_to_extract(tag):
                tag.extract()
            elif tag.name.lower() in HtmlSanitizerConfig.Tag_whitelist:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in HtmlSanitizerConfig.Attrs_whitelist:
                        del tag.attrs[attr]
            else:
                tag.unwrap()
        return str(soup)

    @classmethod
    def _tag_to_extract(cls, tag: Tag) -> bool:
        if tag.name.lower() in HtmlSanitizerConfig.Tag_blacklist:
            return True
        if 'class' in tag.attrs:
            for elem in HtmlSanitizerConfig.Class_blacklist:
                if elem in tag.attrs['class']:
                    return True
        if 'id' in tag.attrs:
            for elem in HtmlSanitizerConfig.Id_blacklist:
                if elem in tag.attrs['id']:
                    return True
        return False
