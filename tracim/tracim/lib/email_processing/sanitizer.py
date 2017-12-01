from bs4 import BeautifulSoup, Tag

# TODO BS 20171124: Think about replace thin dict config by object
BEAUTIFULSOUP_HTML_BODY_SANITIZE_CONFIG = {
    'tag_blacklist': ['script', 'style'],
    'class_blacklist': [],
    'id_blacklist': ['reply-intro'],
    'tag_whitelist': ['a', 'b', 'strong', 'i', 'br', 'ul', 'li', 'ol',
                      'em', 'i', 'u', 'blockquote', 'h1', 'h2', 'h3', 'h4',
                      'thead', 'tr', 'td', 'tbody', 'table', 'p', 'pre'],
    'attrs_whitelist': ['href'],
}


class HtmlSanitizer(object):

    @classmethod
    def sanitize(cls, html_body: str) -> str:
        soup = BeautifulSoup(html_body, 'html.parser')
        config = BEAUTIFULSOUP_HTML_BODY_SANITIZE_CONFIG
        for tag in soup.findAll():
            if cls._tag_to_extract(tag):
                tag.extract()
            elif tag.name.lower() in config['tag_whitelist']:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in config['attrs_whitelist']:
                        del tag.attrs[attr]
            else:
                tag.unwrap()
        return str(soup)

    @classmethod
    def _tag_to_extract(cls, tag: Tag) -> bool:
        config = BEAUTIFULSOUP_HTML_BODY_SANITIZE_CONFIG
        if tag.name.lower() in config['tag_blacklist']:
            return True
        if 'class' in tag.attrs:
            for elem in config['class_blacklist']:
                if elem in tag.attrs['class']:
                    return True
        if 'id' in tag.attrs:
            for elem in config['id_blacklist']:
                if elem in tag.attrs['id']:
                    return True
        return False
