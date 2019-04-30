from bs4 import BeautifulSoup
import pytest

from tracim_backend.lib.mail_fetcher.email_processing.checkers import HtmlMailQuoteChecker
from tracim_backend.lib.mail_fetcher.email_processing.checkers import HtmlMailSignatureChecker
from tracim_backend.lib.mail_fetcher.email_processing.models import BodyMailPart
from tracim_backend.lib.mail_fetcher.email_processing.models import BodyMailParts
from tracim_backend.lib.mail_fetcher.email_processing.models import BodyMailPartType
from tracim_backend.lib.mail_fetcher.email_processing.parser import ParsedHTMLMail


class TestHtmlMailQuoteChecker(object):
    def test_unit__is_standard_quote_ok(self):
        soup = BeautifulSoup("<blockquote></blockquote>", "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_standard_quote(main_elem) is True

    def test_unit__is_standard_quote_no(self):
        soup = BeautifulSoup("<a></a>", "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_standard_quote(main_elem) is False

    def test_unit__is_thunderbird_quote_ok(self):
        soup = BeautifulSoup('<div class="moz-cite-prefix"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_thunderbird_quote(main_elem) is True

    def test_unit__is_thunderbird_quote_no(self):
        soup = BeautifulSoup('<div class="nothing"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_thunderbird_quote(main_elem) is False

    def test_unit__is_gmail_quote_ok(self):
        html = '<div class="gmail_extra">' + '<a></a><div class="gmail_quote"></div>' + "</div>"
        soup = BeautifulSoup(html, "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_gmail_quote(main_elem) is True

    def test_unit__is_gmail_quote_no(self):
        soup = BeautifulSoup('<div class="nothing"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_gmail_quote(main_elem) is False

    def test_unit__is_gmail_quote_no_2(self):
        html = '<div class="gmail_extra">' + '<a></a><div class="gmail_signature"></div>' + "</div>"
        soup = BeautifulSoup(html, "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_gmail_quote(main_elem) is False

    def test_unit__is_outlook_com_quote_ok(self):
        soup = BeautifulSoup('<div id="divRplyFwdMsg"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_outlook_com_quote(main_elem) is True

    def test_unit__is_outlook_com_quote_no(self):
        soup = BeautifulSoup('<div id="Signature"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailQuoteChecker._is_outlook_com_quote(main_elem) is False

    # TODO - G.M - 2017-11-24 - Check Yahoo and New roundcube html mail with
    # correct mail example


class TestHtmlMailSignatureChecker(object):
    def test_unit__is_thunderbird_signature_ok(self):
        soup = BeautifulSoup('<div class="moz-signature"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_thunderbird_signature(main_elem) is True

    def test_unit__is_thunderbird_signature_no(self):
        soup = BeautifulSoup('<div class="other"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_thunderbird_signature(main_elem) is False

    def test_unit__is_gmail_signature_ok(self):
        html = '<div class="gmail_extra">' + '<a></a><div class="gmail_quote"></div>' + "</div>"
        soup = BeautifulSoup(html, "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_gmail_signature(main_elem) is False

    def test_unit__is_gmail_signature_no(self):
        soup = BeautifulSoup('<div class="nothing"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_gmail_signature(main_elem) is False

    def test_unit__is_gmail_signature_yes(self):
        html = '<div class="gmail_extra">' + '<a></a><div class="gmail_signature"></div>' + "</div>"
        soup = BeautifulSoup(html, "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_gmail_signature(main_elem) is True

    def test_unit__is_gmail_signature_yes_2(self):
        html = '<div class="gmail_signature">' + "</div>"
        soup = BeautifulSoup(html, "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_gmail_signature(main_elem) is True

    def test_unit__is_outlook_com_signature_no(self):
        soup = BeautifulSoup('<div id="divRplyFwdMsg"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_outlook_com_signature(main_elem) is False

    def test_unit__is_outlook_com_signature_ok(self):
        soup = BeautifulSoup('<div id="Signature"></div>', "html.parser")
        main_elem = soup.find()
        assert HtmlMailSignatureChecker._is_outlook_com_signature(main_elem) is True


class TestBodyMailsParts(object):
    def test_unit__std_list_methods(self):
        mail_parts = BodyMailParts()
        assert len(mail_parts) == 0
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        assert len(mail_parts) == 1
        assert mail_parts[0] == a
        del mail_parts[0]
        assert len(mail_parts) == 0

    def test_unit__append_same_type(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._append(a)
        b = BodyMailPart("b", BodyMailPartType.Main)
        mail_parts._append(b)
        assert len(mail_parts) == 1
        assert mail_parts[0].part_type == BodyMailPartType.Main
        assert mail_parts[0].text == "ab"

    def test_unit__append_different_type(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts.append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._append(b)
        assert len(mail_parts) == 2
        assert mail_parts[0] == a
        assert mail_parts[1] == b

    def test_unit__append_follow(self):
        mail_parts = BodyMailParts()
        mail_parts.follow = True
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._append(b)
        assert len(mail_parts) == 1
        assert mail_parts[0].part_type == BodyMailPartType.Main
        assert mail_parts[0].text == "ab"

    def test_unit__append_dont_follow_when_first(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._append(a, follow=True)
        assert len(mail_parts) == 1
        assert mail_parts[0].part_type == BodyMailPartType.Main
        assert mail_parts[0].text == "a"

    def test_unit__check_value__type_error(self):
        mail_parts = BodyMailParts()
        with pytest.raises(TypeError):
            mail_parts._check_value("a")

    def test_unit__check_value__ok(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._check_value(a)

    def test_unit__drop_part_type(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._list.append(b)
        c = BodyMailPart("c", BodyMailPartType.Signature)
        mail_parts._list.append(c)
        mail_parts.drop_part_type(BodyMailPartType.Quote)
        assert len(mail_parts) == 2
        assert mail_parts[0].text == "a"
        assert mail_parts[0].part_type == BodyMailPartType.Main
        assert len(mail_parts) == 2
        assert mail_parts[1].text == "c"
        assert mail_parts[1].part_type == BodyMailPartType.Signature

    def test_unit__drop_part_type_verify_no_follow_incidence(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._list.append(b)
        c = BodyMailPart("c", BodyMailPartType.Signature)
        mail_parts._list.append(c)
        mail_parts.follow = True
        mail_parts.drop_part_type(BodyMailPartType.Quote)
        assert len(mail_parts) == 2
        assert mail_parts[0].text == "a"
        assert mail_parts[0].part_type == BodyMailPartType.Main
        assert len(mail_parts) == 2
        assert mail_parts[1].text == "c"
        assert mail_parts[1].part_type == BodyMailPartType.Signature

    def test_unit__drop_part_type_consistence(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._list.append(b)
        c = BodyMailPart("c", BodyMailPartType.Main)
        mail_parts._list.append(c)
        mail_parts.drop_part_type(BodyMailPartType.Quote)
        assert len(mail_parts) == 1
        assert mail_parts[0].text == "ac"
        assert mail_parts[0].part_type == BodyMailPartType.Main

    def test_unit__get_nb_part_type(self):
        mail_parts = BodyMailParts()
        assert mail_parts.get_nb_part_type(BodyMailPartType.Main) == 0
        assert mail_parts.get_nb_part_type(BodyMailPartType.Quote) == 0
        assert mail_parts.get_nb_part_type(BodyMailPartType.Signature) == 0
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        assert mail_parts.get_nb_part_type(BodyMailPartType.Main) == 1
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._list.append(b)
        assert mail_parts.get_nb_part_type(BodyMailPartType.Quote) == 1
        c = BodyMailPart("c", BodyMailPartType.Signature)
        mail_parts._list.append(c)
        assert mail_parts.get_nb_part_type(BodyMailPartType.Main) == 1
        assert mail_parts.get_nb_part_type(BodyMailPartType.Quote) == 1
        assert mail_parts.get_nb_part_type(BodyMailPartType.Signature) == 1

    def test_unit__str(self):
        mail_parts = BodyMailParts()
        a = BodyMailPart("a", BodyMailPartType.Main)
        mail_parts._list.append(a)
        b = BodyMailPart("b", BodyMailPartType.Quote)
        mail_parts._list.append(b)
        c = BodyMailPart("c", BodyMailPartType.Signature)
        mail_parts._list.append(c)
        assert str(mail_parts) == "abc"


class TestParsedMail(object):
    def test_other__check_gmail_mail_text_only(self):
        text_only = """<div dir="ltr">Voici le texte<br></div>"""
        mail = ParsedHTMLMail(text_only)
        elements = mail.get_elements()
        assert len(elements) == 1
        assert elements[0].part_type == BodyMailPartType.Main

    def test_other__check_gmail_mail_text_signature(self):
        text_and_signature = """
        <div dir="ltr">POF<br clear="all"><div><br>-- <br>
        <div class="gmail_signature" data-smartmail="gmail_signature">
        <div dir="ltr">Voici Ma signature. En HTML <br><ol>
        <li>Plop</li>
        <li>Plip</li>
        <li>Plop<br>
        </li></ol></div></div></div></div>
        """
        mail = ParsedHTMLMail(text_and_signature)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Signature

    def test_other__check_gmail_mail_text_quote(self):
        text_and_quote = """
        <div dir="ltr">Réponse<br>
        <div class="gmail_extra"><br>
        <div class="gmail_quote">Le 28 novembre 2017 à 10:29, John Doe <span
        dir="ltr">&lt;<a href="mailto:bidule@localhost.fr"
        target="_blank">bidule@localhost.fr</a>&gt;</span>
        a écrit :<br>
        <blockquote class="gmail_quote" style="margin:0 0 0
        .8ex;border-left:1px #ccc solid;padding-left:1ex">Voici ma réponse<br>
        <br><br>
        Le 28/11/2017 à 10:05, Foo Bar a écrit&nbsp;:<br>
        <blockquote class="gmail_quote" style="margin:0 0 0
        .8ex;border-left:1px #ccc solid;padding-left:1ex">
        Voici le texte<span class="HOEnZb"><font color="#888888"><br>
        </font></span></blockquote>
        <span class="HOEnZb"><font color="#888888">
        <br>
        -- <br>
        TEST DE signature<br>
        </font></span></blockquote>
        </div><br></div></div>
        """
        mail = ParsedHTMLMail(text_and_quote)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote

    def test_other__check_gmail_mail_text_quote_text(self):
        text_quote_text = """<div dir="ltr">Avant<br>
              <div class="gmail_extra"><br>
              <div class="gmail_quote">Le 28 novembre 2017 à 10:29, John Doe
              <span dir="ltr">&lt;<a href="mailto:bidule@localhost.fr"
              target="_blank">bidule@localhost.fr</a>&gt;</span>
              a écrit :<br>
              <blockquote class="gmail_quote" style="margin:0 0 0
              .8ex;border-left:1px #ccc solid;padding-left:1ex">Voici ma
              réponse<br>
              <br>
              <br>
              Le 28/11/2017 à 10:05, Foo Bar a écrit&nbsp;:<br>
              <blockquote class="gmail_quote" style="margin:0 0 0
              .8ex;border-left:1px #ccc solid;padding-left:1ex">
              Voici le texte<span class="HOEnZb"><font color="#888888"><br>
              </font></span></blockquote>
              <span class="HOEnZb"><font color="#888888">
              <br>
              -- <br>
              TEST DE signature<br>
              </font></span></blockquote>
              </div>
              <br>
              </div>
              <div class="gmail_extra">Aprés<br>
              </div>
              </div>"""

        mail = ParsedHTMLMail(text_quote_text)
        elements = mail.get_elements()
        assert len(elements) == 3
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote
        assert elements[2].part_type == BodyMailPartType.Main

    def test_other__check_gmail_mail_text_quote_signature(self):
        text_quote_signature = """
        <div dir="ltr">Hey !<br>
                 </div>
                 <div class="gmail_extra"><br>
                 <div class="gmail_quote">Le 28 novembre 2017 à 10:29,
                  John Doe <span
                 dir="ltr">&lt;<a href="mailto:bidule@localhost.fr"
                 target="_blank">bidule@localhost.fr</a>&gt;</span>
                 a écrit :<br>
                 <blockquote class="gmail_quote" style="margin:0 0 0
                 .8ex;border-left:1px #ccc solid;padding-left:1ex">Voici ma
                 réponse<br>
                 <br>
                 <br>
                  Le 28/11/2017 à 10:05, Foo Bar a écrit&nbsp;:<br>
                  <blockquote class="gmail_quote" style="margin:0 0 0
                  .8ex;border-left:1px #ccc solid;padding-left:1ex">
                  Voici le texte<span class="HOEnZb"><font color="#888888"><br>
                  </font></span></blockquote>
                  <span class="HOEnZb"><font color="#888888">
                  <br>
                  -- <br>
                  TEST DE signature<br>
                  </font></span></blockquote>
                  </div>
                  <br>
                  <br clear="all">
                  <br>
                  -- <br>
                  <div class="gmail_signature" data-smartmail="gmail_signature">
                  <div dir="ltr">Voici Ma signature. En HTML <br>
                  <ol>
                  <li>Plop</li>
                  <li>Plip</li>
                  <li>Plop<br>
                  </li>
                  </ol>
                  </div>
                  </div>
                  </div>
                 """

        # INFO - G.M - 2017-11-28 -
        # Now Quote + Signature block in Gmail is considered as one Quote
        # Block.
        mail = ParsedHTMLMail(text_quote_signature)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote

    def test_other__check_gmail_mail_text_quote_text_signature(self):
        text_quote_text_sign = """
        <div dir="ltr">Test<br>
        <div class="gmail_extra"><br>
        <div class="gmail_quote">Le 28 novembre 2017 à 10:29, John Doe <span
        dir="ltr">&lt;<a href="mailto:bidule@localhost.fr"
        target="_blank">bidule@localhost.fr</a>&gt;</span>
        a écrit :<br>
        <blockquote class="gmail_quote" style="margin:0 0 0
        .8ex;border-left:1px #ccc solid;padding-left:1ex">Voici ma
        réponse<br>
        <br>
        <br>
        Le 28/11/2017 à 10:05, Foo Bar a écrit&nbsp;:<br>
        <blockquote class="gmail_quote" style="margin:0 0 0
        .8ex;border-left:1px #ccc solid;padding-left:1ex">
        Voici le texte<span class="HOEnZb"><font color="#888888"><br>
        </font></span></blockquote>
        <span class="HOEnZb"><font color="#888888">
        <br>
        -- <br>
        TEST DE signature<br>
        </font></span></blockquote>
        </div>
        <br>
        <br>
        </div>
        <div class="gmail_extra">RE test<br clear="all">
        </div>
        <div class="gmail_extra"><br>
        -- <br>
        <div class="gmail_signature" data-smartmail="gmail_signature">
        <div dir="ltr">Voici Ma signature. En HTML <br>
        <ol>
        <li>Plop</li>
        <li>Plip</li>
        <li>Plop<br>
        </li>
        </ol>
        </div>
        </div>
        </div>
        </div>
        """

        mail = ParsedHTMLMail(text_quote_text_sign)
        elements = mail.get_elements()
        assert len(elements) == 4
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote
        assert elements[2].part_type == BodyMailPartType.Main
        assert elements[3].part_type == BodyMailPartType.Signature

    def test_other__check_thunderbird_mail_text_only(self):

        text_only = """Coucou<br><br><br>"""
        mail = ParsedHTMLMail(text_only)
        elements = mail.get_elements()
        assert len(elements) == 1
        assert elements[0].part_type == BodyMailPartType.Main

    def test_other__check_thunderbird_mail_text_signature(self):
        text_and_signature = """
        <p>Test<br>
        </p>
        <div class="moz-signature">-- <br>
          TEST DE signature</div>
        """
        mail = ParsedHTMLMail(text_and_signature)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Signature

    def test_other__check_thunderbird_mail_text_quote(self):
        text_and_quote = """<p>Pof<br>
            </p>
            <br>
            <div class="moz-cite-prefix">Le 28/11/2017 à 11:21, John Doe a
              écrit&nbsp;:<br>
            </div>
            <blockquote type="cite"
              cite="mid:658592c1-14de-2958-5187-3571edea0aac@localhost.fr">
              <meta http-equiv="Context-Type"
              content="text/html; charset=utf-8">
              <p>Test<br>
              </p>
              <div class="moz-signature">-- <br>
                TEST DE signature</div>
            </blockquote>
            <br>"""
        mail = ParsedHTMLMail(text_and_quote)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote

    def test_other__check_thunderbird_mail_text_quote_text(self):
        text_quote_text = """
        <p>Pof<br>
        </p>
        <br>
        <div class="moz-cite-prefix">Le 28/11/2017 à 11:54,
         Bidule a
          écrit&nbsp;:<br>
        </div>
        <blockquote type="cite"
          cite="mid:b541b451-bb31-77a4-45b9-ad89969d7962@localhost.fr">
          <meta http-equiv="Context-Type"
          content="text/html; charset=utf-8">
          <p>Pof<br>
          </p>
          <br>
          <div class="moz-cite-prefix">Le 28/11/2017 à 11:21, John Doe a
            écrit&nbsp;:<br>
          </div>
          <blockquote type="cite"
            cite="mid:658592c1-14de-2958-5187-3571edea0aac@localhost.fr">
            <p>Test<br>
            </p>
            <div class="moz-signature">-- <br>
              TEST DE signature</div>
          </blockquote>
          <br>
        </blockquote>
        Pif<br>
        """

        mail = ParsedHTMLMail(text_quote_text)
        elements = mail.get_elements()
        assert len(elements) == 3
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote
        assert elements[2].part_type == BodyMailPartType.Main

    def test_other__check_thunderbird_mail_text_quote_signature(self):
        text_quote_signature = """
        <p>Coucou<br>
        </p>
        <br>
        <div class="moz-cite-prefix">Le 28/11/2017 à 11:22, Bidule a
        écrit&nbsp;:<br>
        </div>
        <blockquote type="cite"
        cite="mid:4e6923e2-796d-eccf-84b7-6824da4151ee@localhost.fr">Réponse<br>
        <br>
        Le 28/11/2017 à 11:21, John Doe a écrit&nbsp;: <br>
        <blockquote type="cite"> <br>
        Test <br>
        <br>
        --&nbsp;<br>
        TEST DE signature <br>
        </blockquote>
        <br>
        </blockquote>
        <br>
        <div class="moz-signature">-- <br>
        TEST DE signature</div>
        """

        mail = ParsedHTMLMail(text_quote_signature)
        elements = mail.get_elements()
        assert len(elements) == 3
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote
        assert elements[2].part_type == BodyMailPartType.Signature

    def test_other__check_thunderbird_mail_text_quote_text_signature(self):
        text_quote_text_sign = """
        <p>Avant<br>
        </p>
        <br>
        <div class="moz-cite-prefix">Le 28/11/2017 à 11:19, Bidule a
          écrit&nbsp;:<br>
        </div>
        <blockquote type="cite"
          cite="mid:635df73c-d3c9-f2e9-2304-24ff536bfa16@localhost.fr">Coucou
          <br><br>
        </blockquote>
        Aprés<br>
        <br>
        <div class="moz-signature">-- <br>
          TEST DE signature</div>
        """

        mail = ParsedHTMLMail(text_quote_text_sign)
        elements = mail.get_elements()
        assert len(elements) == 4
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote
        assert elements[2].part_type == BodyMailPartType.Main
        assert elements[3].part_type == BodyMailPartType.Signature

    # INFO - G.M - 2017-11-28 - Test for outlook.com webapp html mail
    # outlook.com ui doesn't seems to allow complex reply, new message
    # and signature are always before quoted one.

    def test_other__check_outlook_com_mail_text_only(self):

        text_only = """
        <div id="divtagdefaultwrapper"
        style="font-size:12pt;color:#000000;
        font-family:Calibri,Helvetica,sans-serif;"
        dir="ltr">
        <p style="margin-top:0;margin-bottom:0">message<br>
        </p>
        </div>
        """
        mail = ParsedHTMLMail(text_only)
        elements = mail.get_elements()
        assert len(elements) == 1
        assert elements[0].part_type == BodyMailPartType.Main

    def test_other__check_outlook_com_mail_text_signature(self):
        text_and_signature = """
        <div id="divtagdefaultwrapper"
        style="font-size:12pt;color:#000000;
        font-family:Calibri,Helvetica,sans-serif;"
          dir="ltr">
          <p style="margin-top:0;margin-bottom:0">Test<br>
          </p>
          <p style="margin-top:0;margin-bottom:0"><br>
          </p>
          <div id="Signature">
            <div id="divtagdefaultwrapper" style="font-size: 12pt; color:
              rgb(0, 0, 0); background-color: rgb(255, 255, 255);
              font-family:
              Calibri,Arial,Helvetica,sans-serif,&quot;EmojiFont&quot;,&quot;Apple
              Color Emoji&quot;,&quot;Segoe UI
              Emoji&quot;,NotoColorEmoji,&quot;Segoe UI
              Symbol&quot;,&quot;Android Emoji&quot;,EmojiSymbols;">
              Envoyé à partir de <a href="http://aka.ms/weboutlook"
                id="LPNoLP">Outlook</a></div>
          </div>
        </div>
        """
        mail = ParsedHTMLMail(text_and_signature)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Signature

    def test_other__check_outlook_com_mail_text_quote(self):
        text_and_quote = """
        <div id="divtagdefaultwrapper"
        style="font-size:12pt;color:#000000;font-family:Calibri,Helvetica,sans-serif;"
        dir="ltr">
        <p style="margin-top:0;margin-bottom:0">Salut !<br>
        </p>
        </div>
        <hr style="display:inline-block;width:98%" tabindex="-1">
        <div id="divRplyFwdMsg" dir="ltr"><font style="font-size:11pt"
        color="#000000" face="Calibri, sans-serif"><b>De :</b> John Doe<br>
        <b>Envoyé :</b> mardi 28 novembre 2017 12:44:59<br>
        <b>À :</b> dev.bidule@localhost.fr<br>
        <b>Objet :</b> voila</font>
        <div>&nbsp;</div>
        </div>
        <style type="text/css" style="display:none">
        <!--
        p
        &#x09;{margin-top:0;
        &#x09;margin-bottom:0}
        -->
        </style>
        <div dir="ltr">
        <div id="x_divtagdefaultwrapper" dir="ltr" style="font-size:12pt;
        color:#000000; font-family:Calibri,Helvetica,sans-serif">
        Contenu
        <p style="margin-top:0; margin-bottom:0"><br>
        </p>
        <div id="x_Signature">
          <div id="x_divtagdefaultwrapper" dir="ltr"
            style="font-size:12pt; color:rgb(0,0,0);
            background-color:rgb(255,255,255);
        font-family:Calibri,Arial,Helvetica,sans-serif,&quot;EmojiFont&quot;,&quot;Apple
            Color Emoji&quot;,&quot;Segoe UI
            Emoji&quot;,NotoColorEmoji,&quot;Segoe UI
            Symbol&quot;,&quot;Android Emoji&quot;,EmojiSymbols">
            DLMQDNLQNDMLQS<br>
            qs<br>
            dqsd<br>
            d<br>
            qsd<br>
          </div>
        </div>
        </div>
        </div>
        """
        mail = ParsedHTMLMail(text_and_quote)
        elements = mail.get_elements()
        assert len(elements) == 2
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Quote

    def test_other__check_outlook_com_mail_text_signature_quote(self):
        text_signature_quote = """
        <div id="divtagdefaultwrapper"
        style="font-size:12pt;color:#000000;font-family:Calibri,Helvetica,sans-serif;"
        dir="ltr">
        <p style="margin-top:0;margin-bottom:0">Salut !<br>
        </p>
        <p style="margin-top:0;margin-bottom:0"><br>
        </p>
        <div id="Signature">
        <div id="divtagdefaultwrapper" dir="ltr" style="font-size: 12pt;
        color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);
        font-family:
        Calibri,Arial,Helvetica,sans-serif,&quot;EmojiFont&quot;,&quot;Apple
        Color Emoji&quot;,&quot;Segoe UI
        Emoji&quot;,NotoColorEmoji,&quot;Segoe UI
        Symbol&quot;,&quot;Android Emoji&quot;,EmojiSymbols;">
        Envoyée depuis Outlook<br>
        </div>
        </div>
        </div>
        <hr style="display:inline-block;width:98%" tabindex="-1">
        <div id="divRplyFwdMsg" dir="ltr"><font style="font-size:11pt"
        color="#000000" face="Calibri, sans-serif"><b>De :</b> John Doe
        &lt;dev.bidule@localhost.fr&gt;<br>
        <b>Envoyé :</b> mardi 28 novembre 2017 12:51:42<br>
        <b>À :</b> John Doe<br>
        <b>Objet :</b> Re: Test</font>
        <div>&nbsp;</div>
        </div>
        <div style="background-color:#FFFFFF">
        <p>Coucou<br>
        </p>
        <br>
        <div class="x_moz-cite-prefix">Le 28/11/2017 à 12:39, John Doe a
        écrit&nbsp;:<br>
        </div>
        <blockquote type="cite">
        <div id="x_divtagdefaultwrapper" dir="ltr">
        <p>Test<br>
        </p>
        <p><br>
        </p>
        <div id="x_Signature">
        <div id="x_divtagdefaultwrapper">Envoyé à partir de <a
        href="http://aka.ms/weboutlook" id="LPNoLP">
        Outlook</a></div>
        </div>
        </div>
        </blockquote>
        <br>
        <div class="x_moz-signature">-- <br>
        TEST DE signature</div>
        </div>
        """

        mail = ParsedHTMLMail(text_signature_quote)
        elements = mail.get_elements()
        assert len(elements) == 3
        assert elements[0].part_type == BodyMailPartType.Main
        assert elements[1].part_type == BodyMailPartType.Signature
        assert elements[2].part_type == BodyMailPartType.Quote
