from tg import expose
from tg import tmpl_context

from tracim.controllers import TIMRestController
from tracim.controllers.page import PagesController

__all__ = ['PreviewsController']


# FIXME https://github.com/tracim/tracim/issues/272
# unused, future removal planned
class PreviewsController(TIMRestController):

    pages = PagesController()

    @expose()
    def _default(self, *args, **kwargs) -> str:
        return '<h2> Error Loading Page</h2>'

    @expose()
    def get_all(self, *args, **kwargs) -> str:
        print('getall _ document')
        return 'all the files'

    @expose()
    def get_one(self, file_id: int, *args, **kwargs) -> str:
        print('getone _ document')
        tmpl_context.file = file_id
        return 'File n°{}'.format(file_id)
