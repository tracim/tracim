# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup

from tracim_backend.lib.mail_fetcher.email_processing.checkers import HtmlMailQuoteChecker
from tracim_backend.lib.mail_fetcher.email_processing.checkers import HtmlMailSignatureChecker
from tracim_backend.lib.mail_fetcher.email_processing.checkers import ProprietaryHTMLAttrValues
from tracim_backend.lib.mail_fetcher.email_processing.models import BodyMailPart
from tracim_backend.lib.mail_fetcher.email_processing.models import BodyMailPartType
from tracim_backend.lib.mail_fetcher.email_processing.models import HtmlBodyMailParts


class PreSanitizeConfig(object):
    """
    To avoid problems, html need to be sanitize a bit during parsing to distinct
    Main,Quote and Signature elements
    """

    meta_tag = ["body", "div"]


class ParsedHTMLMail(object):
    """
    Parse HTML Mail depending of some rules.
    Distinct part of html mail body using BodyMailParts object and
    process differents rules using HtmlChecker(s)
    """

    def __init__(self, html_body: str):
        self.src_html_body = html_body

    def __str__(self):
        return str(self._parse_mail())

    def get_elements(self) -> HtmlBodyMailParts:
        tree = self._get_proper_main_body_tree()
        return self._distinct_elements(tree)

    def _parse_mail(self) -> HtmlBodyMailParts:
        elements = self.get_elements()
        elements = self._process_elements(elements)
        return elements

    def _get_proper_main_body_tree(self) -> BeautifulSoup:
        """
        Get html body tree without some kind of wrapper.
        We need to have text, quote and signature parts at the same tree level
        """
        tree = BeautifulSoup(self.src_html_body, "html.parser")

        # Only parse body part of html if available
        subtree = tree.find("body")
        if subtree:
            tree = BeautifulSoup(str(subtree), "html.parser")

        # if some kind of "meta_div", unwrap it
        while (
            len(tree.findAll(recursive=None)) == 1
            and tree.find().name.lower() in PreSanitizeConfig.meta_tag
        ):
            tree.find().unwrap()

        for tag in tree.findAll():
            # HACK - G.M - 2017-11-28 - Unwrap outlook.com mail
            # if Text -> Signature -> Quote Mail
            # Text and signature are wrapped into divtagdefaultwrapper
            if tag.attrs.get("id"):
                if ProprietaryHTMLAttrValues.Outlook_com_wrapper_id in tag.attrs["id"]:
                    tag.unwrap()
        return tree

    @classmethod
    def _distinct_elements(cls, tree: BeautifulSoup) -> HtmlBodyMailParts:
        parts = HtmlBodyMailParts()
        for elem in list(tree):
            part_txt = str(elem)
            part_type = BodyMailPartType.Main

            if HtmlMailQuoteChecker.is_quote(elem):
                part_type = BodyMailPartType.Quote
            elif HtmlMailSignatureChecker.is_signature(elem):
                part_type = BodyMailPartType.Signature

            part = BodyMailPart(part_txt, part_type)
            parts.append(part)
            # INFO - G.M - 2017-11-28 - Outlook.com special case
            # all after quote tag is quote
            if HtmlMailQuoteChecker._is_outlook_com_quote(elem):
                parts.follow = True
        return parts

    @classmethod
    def _process_elements(cls, elements: HtmlBodyMailParts) -> HtmlBodyMailParts:
        if len(elements) >= 2:
            # Case 1 and 2, only one main and one quote
            if elements.get_nb_part_type("main") == 1 and elements.get_nb_part_type("quote") == 1:
                # Case 1 : Main first
                if elements[0].part_type == BodyMailPartType.Main:
                    cls._process_main_first_case(elements)
                # Case 2 : Quote first
                if elements[0].part_type == BodyMailPartType.Quote:
                    cls._process_quote_first_case(elements)
            else:
                # Case 3 : Multiple quotes and/or main
                cls._process_multiples_elems_case(elements)
        else:
            cls._process_default_case(elements)
            # default case (only one element or empty list)
        return elements

    @classmethod
    def _process_quote_first_case(cls, elements: HtmlBodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_main_first_case(cls, elements: HtmlBodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Quote)
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_multiples_elems_case(cls, elements: HtmlBodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_default_case(cls, elements: HtmlBodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Quote)
        elements.drop_part_type(BodyMailPartType.Signature)
