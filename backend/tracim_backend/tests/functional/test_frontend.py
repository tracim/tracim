from tracim_backend.tests import FunctionalTest


class TestFrontendEnabled(FunctionalTest):
    config_section = 'functional_test_frontend_enabled'

    def test_api__check_index_html_generated__ok_200__nominal_case(self):
        res = self.testapp.get('/', status=200)
        assert res.content_type == 'text/html'


class TestFrontendDisabled(FunctionalTest):

    def test_api__check_index_html_generated__ok_200__nominal_case(self):
        res = self.testapp.get('/', status=404)
