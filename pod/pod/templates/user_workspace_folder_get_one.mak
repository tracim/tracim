<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="POD" file="pod.templates.pod"/>
<%namespace name="TOOLBAR" file="pod.templates.folder_toolbars"/>
<%namespace name="FORMS" file="pod.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="pod.templates.user_workspace_widgets"/>

<%def name="title()">${result.folder.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__folder_{}'.format(result.folder.workspace.id, result.folder.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_FOLDER(fake_api.current_user, result.folder.workspace, result.folder)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${POD.HELP_MODAL_DIALOG('content-wiki-page-definition')}
    ${POD.MODAL_DIALOG('folder-edit-modal-dialog')}
    ${POD.MODAL_DIALOG('folder-move-modal-dialog')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<h1 class="page-header">
    ${POD.ICO(32, 'places/jstree-folder')} ${result.folder.label}

    <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
</h1>
${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

<div style="margin: -1.5em auto 1em auto;">
  <p>${_('created on {} by <b>{}</b>').format(h.date_time_in_long_format(result.folder.created), result.folder.owner.name)|n}</p>
</div>
<p>   
    <b>${_('Content:')}</b>
    % if result.folder.allowed_content.folder:
        ${POD.ICO_BADGED(16, 'places/jstree-folder', _('sub-folders'))}
    % endif
    % if result.folder.allowed_content.thread:
        ${POD.ICO_BADGED(16, 'apps/internet-group-chat', _('threads'))}
    % endif
    % if result.folder.allowed_content.file:
        ${POD.ICO_BADGED(16, 'mimetypes/text-x-generic-template', _('files'))}
    % endif
    % if result.folder.allowed_content.page:
        ${POD.ICO_BADGED(16, 'mimetypes/text-html', _('pages'))}
    % endif
</p>
<hr class="pod-panel-separator"/>

% if result.folder.allowed_content.folder:
    % if h.user_role(fake_api.current_user, result.folder.workspace)<=2: # User must be a content manager to be allowed to create folders
        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'sub-folders', _('Sub-folders'))}
    % else:
        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'sub-folders', _('Sub-folders'), 'folder-new', _('create new folder...'))}
        ${FORMS.NEW_FOLDER_FORM('folder-new', result.folder.workspace.id, result.folder.id)}
    % endif
    <p>
        ${WIDGETS.FOLDER_LIST('subfolder-list', result.folder.workspace.id, fake_api.current_folder_subfolders)}
    </p>
    <hr/>
% endif

% if result.folder.allowed_content.thread:
    ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'threads', _('Threads'), 'thread-new', _('start new thread...'))}
    ${FORMS.NEW_THREAD_FORM('thread-new', result.folder.workspace.id, result.folder.id)}

    <p>
        ${WIDGETS.THREAD_LIST('thread-list', result.folder.workspace.id, fake_api.current_folder_threads)}
    </p>
    <hr/>
% endif

% if result.folder.allowed_content.file:
    ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'files', _('Files'), 'file-new', _('add new file...'))}
    ${FORMS.NEW_FILE_FORM('file-new', result.folder.workspace.id, result.folder.id)}

    <p>
        ${WIDGETS.FILE_LIST('thread-list', result.folder.workspace.id, fake_api.current_folder_files)}
    </p>
    <hr/>
% endif

% if result.folder.allowed_content.page:
    ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.folder.workspace, 'pages', _('Pages'), 'page-new', _('create new page...'))}
    ${FORMS.NEW_PAGE_FORM('page-new', result.folder.workspace.id, result.folder.id)}

    <p>
        ${WIDGETS.PAGE_LIST('page-list', result.folder.workspace.id, fake_api.current_folder_pages)}
    </p>
    <hr/>
% endif
