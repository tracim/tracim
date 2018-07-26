from tracim.tests import FunctionalTest


class TestDoc(FunctionalTest):

    def test_api__check_doc_index_html_page__ok_200__nominal_case(self):
        res = self.testapp.get('/api/v2/doc/', status=200)
        assert res.content_type == 'text/html'

    def test_api__check_spec_yaml_file__ok_200__nominal_case(self):
        res = self.testapp.get('/api/v2/doc/spec.yml', status=200)
        assert res.content_type == 'text/x-yaml'

    def test_api__check_docs_assets__ok_200__nominal_case(self):
        res = self.testapp.get(
            '/api/v2/doc/favicon-32x32.png',
            status=200,
        )
        assert res.content_type == 'image/png'
        res = self.testapp.get(
            '/api/v2/doc/favicon-16x16.png',
            status=200
        )
        assert res.content_type == 'image/png'
        res = self.testapp.get(
            '/api/v2/doc/swagger-ui.js',
            status=200
        )
        assert res.content_type == 'application/javascript'
        res = self.testapp.get(
            '/api/v2/doc/swagger-ui-standalone-preset.js',
            status=200
        )
        assert res.content_type == 'application/javascript'
        res = self.testapp.get(
            '/api/v2/doc/swagger-ui-bundle.js',
            status=200
        )
        assert res.content_type == 'application/javascript'
        res = self.testapp.get(
            '/api/v2/doc/swagger-ui.css',
            status=200
        )
        assert res.content_type == 'text/css'
