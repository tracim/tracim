from tracim.controllers import TIMRestController
from tg import expose, tmpl_context
from tracim.controllers.page import PagesController

__all__ = ['PreviewsController']

class PreviewsController(TIMRestController):

    pages = PagesController()

    @expose()
    def _default(self, *args, **kwargs):
        return '<h2> Error Loading Page</h2>'

    @expose()
    def get_all(self, *args, **kwargs):
        print('getall _ document')
        return 'all the files'

    @expose()
    def get_one(self, file_id, *args, **kwargs):
        print('getone _ document')
        tmpl_context.file = file_id
        return 'File n°{}'.format(file_id)
