import tg
from preview_generator.manager import PreviewManager
from tg import expose, tmpl_context
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

    @expose(content_type='image/jpeg')
    def get_one(self, page_id: int, revision_id: int=None, *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))

        # For now it's done through database content
        # but soon it'll be with disk access

        user = tmpl_context.current_user
        content_api = ContentApi(
            user,
            show_archived=True,
            show_deleted=True,
        )
        if revision_id:
            file_path = content_api.get_one_revision_filepath(revision_id)
        else:
            file = content_api.get_one(file_id, self._item_type)
            file_path = content_api.get_one_revision_filepath(file.revision_id)

        cfg = CFG.get_instance()
        cache_path = cfg.PREVIEW_CACHE

        preview_manager = PreviewManager(cache_path, create_folder=True)
        path = preview_manager.get_jpeg_preview(
            file_path=file_path,
            page=page_id,
            height=500,
            width=500
        )

        with open(path, 'rb') as large:
            return large.read()

    @expose(content_type='image/jpeg')
    def high_quality(self, page_id: int, *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))

        # For now it's done through database content
        # but soon it'll be with disk access

        user = tmpl_context.current_user
        content_api = ContentApi(
            user,
            show_archived=True,
            show_deleted=True,
        )
        file_name = content_api.get_one(file_id, self._item_type).file_name
        cache_path = '/home/alexis/Pictures/cache/'

        preview_manager = PreviewManager(cache_path, create_folder=True)
        path = preview_manager.get_jpeg_preview(
            file_path='/home/alexis/Pictures/cache/{}'.format(file_name),
            page=page_id,
            height=5000,
            width=5000
        )

        with open(path, 'rb') as large:
            return large.read()

    @expose(content_type='application/pdf')
    def download_pdf_full(self, *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))

        # For now it's done through database content
        # but soon it'll be with disk access

        user = tmpl_context.current_user
        content_api = ContentApi(
            user,
            show_archived=True,
            show_deleted=True,
        )
        file_name = content_api.get_one(file_id, self._item_type).file_name
        cache_path = '/home/alexis/Pictures/cache/'

        preview_manager = PreviewManager(cache_path, create_folder=True)
        path = preview_manager.get_pdf_preview(
            file_path='/home/alexis/Pictures/cache/{}'.format(file_name),
        )

        tg.response.headers['Content-Disposition'] = \
            str('attachment; filename="{}"'.format(file_name))
        with open(path, 'rb') as pdf:
            return pdf.read()

    @expose(content_type='application/pdf')
    def download_pdf_one(self, page_id: int, *args, **kwargs):
        file_id = int(tg.request.controller_state.routing_args.get('file_id'))
        page_id = int(page_id)
        # page_id = int(tg.request.controller_state.routing_args.get('page_id'))

        # For now it's done through database content
        # but soon it'll be with disk access

        user = tmpl_context.current_user
        content_api = ContentApi(
            user,
            show_archived=True,
            show_deleted=True,
        )
        file_name = content_api.get_one(file_id, self._item_type).file_name

        cache_path = '/home/alexis/Pictures/cache/'

        preview_manager = PreviewManager(cache_path, create_folder=True)
        path = preview_manager.get_pdf_preview(
            file_path='/home/alexis/Pictures/cache/{}'.format(file_name),
            page=page_id,
        )

        tg.response.headers['Content-Disposition'] = \
            str('attachment; filename="{}"'.format(file_name))
        with open(path, 'rb') as pdf:
            return pdf.read()

    @property
    def _item_type(self):
        return ContentType.File
