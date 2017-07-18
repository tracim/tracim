import tg
from tg import expose
from tg import tmpl_context
from preview_generator.manager import PreviewManager

from tracim.config.app_cfg import CFG
from tracim.controllers import TIMRestController
from tracim.lib.content import ContentApi
from tracim.model.data import ContentType

__all__ = ['PagesController']


class PagesController(TIMRestController):

    @expose()
    def _default(self):
        return '<h2> Error Loading Page</h2>'

    @expose()
    def get_all(self, *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))
        return 'all the pages of document {}'.format(file_id)

    # FIXME https://github.com/tracim/tracim/issues/271
    @expose(content_type='image/jpeg')
    def get_one(self,
                page_id: str='-1',
                revision_id: str=None,
                size: int=300,
                *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))
        page = int(page_id)
        revision_id = int(revision_id) if revision_id != 'latest' else None
        cache_path = CFG.get_instance().PREVIEW_CACHE_DIR
        preview_manager = PreviewManager(cache_path, create_folder=True)
        user = tmpl_context.current_user
        content_api = ContentApi(user,
                                 show_archived=True,
                                 show_deleted=True)
        if revision_id:
            file_path = content_api.get_one_revision_filepath(revision_id)
        else:
            file = content_api.get_one(file_id, self._item_type)
            file_path = content_api.get_one_revision_filepath(file.revision_id)
        path = preview_manager.get_jpeg_preview(file_path=file_path,
                                                page=page,
                                                height=size,
                                                width=size)
        with open(path, 'rb') as large:
            return large.read()

    @expose(content_type='image/jpeg')
    def high_quality(self,
                     page_id: str='-1',
                     revision_id: int=None,
                     size: int=1000,
                     *args, **kwargs):
        result = self.get_one(page_id=page_id,
                              revision_id=revision_id,
                              size=size,
                              args=args,
                              kwargs=kwargs)
        return result

    @expose(content_type='application/pdf')
    def download_pdf_full(self,
                          page_id: str,
                          revision_id: str='-1',
                          *args, **kwargs):
        return self.download_pdf_one(page_id='-1',
                                     revision_id=revision_id,
                                     args=args, kwargs=kwargs)

    # FIXME https://github.com/tracim/tracim/issues/271
    @expose(content_type='application/pdf')
    def download_pdf_one(self,
                         page_id: str,
                         revision_id: str=None,
                         *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))
        revision_id = int(revision_id) if revision_id != 'latest' else None
        page = int(page_id)
        cache_path = CFG.get_instance().PREVIEW_CACHE_DIR
        preview_manager = PreviewManager(cache_path, create_folder=True)
        user = tmpl_context.current_user
        content_api = ContentApi(user,
                                 show_archived=True,
                                 show_deleted=True)
        file = content_api.get_one(file_id, self._item_type)
        if revision_id:
            file_path = content_api.get_one_revision_filepath(revision_id)
        else:
            file = content_api.get_one(file_id, self._item_type)
            file_path = content_api.get_one_revision_filepath(file.revision_id)
        path = preview_manager.get_pdf_preview(file_path=file_path,
                                               page=page)
        tg.response.headers['Content-Disposition'] = \
            'attachment; filename="{}"'.format(file.file_name)
        with open(path, 'rb') as pdf:
            return pdf.read()

    @property
    def _item_type(self):
        return ContentType.File
