<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.file_toolbars"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="title()">${result.file.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.file.workspace.id, result.file.id))}
    <hr/>
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_FILE(fake_api.current_user, result.file.workspace, result.file)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')}
    ${TIM.MODAL_DIALOG('file-edit-modal-dialog', 'modal-lg')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

% if result.file.selected_revision!='latest':
    <div class="alert alert-warning" role="alert" style="margin-top: 1em;">
        ${TIM.ICO(16, 'status/dialog-warning')}
        ${_('You are reading <b>an old revision</b> of the current file. (the shown revision is r{}).').format(result.file.selected_revision)|n}
        <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/files/{}').format(result.file.workspace.id, result.file.parent.id, result.file.id)}">${_('Show latest revision')}</a>
    </div>
% endif

% if result.file.status.id=='closed-deprecated':
    <div class="alert alert-warning" role="alert" style="margin-top: 1em;">
        ${TIM.ICO(16, 'status/status-outdated')}
        ${_('<b>This information is deprecated</b>')|n}
    </div>
% endif


<h1 class="page-header">
    ${TIM.ICO(32, result.file.icon)} ${result.file.label}
    <button id="current-page-breadcrumb-toggle-button" class="btn btn-link" title="${_('Show localisation')}"><i class="fa fa-map-marker"></i></button>
</h1>
${WIDGETS.BREADCRUMB('current-page-breadcrumb', fake_api.breadcrumb)}

<p style="margin: -1.5em auto 1em auto;">
    ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_FILE(fake_api.current_user, result.file.workspace, result.file)}
    &mdash;&nbsp;&nbsp;&nbsp;
    ${_('created on {} by <b>{}</b>').format(h.date_time_in_long_format(result.file.created), result.file.owner.name)|n}</p>
</p>

<% download_url = tg.url('/workspaces/{}/folders/{}/files/{}/download?revision_id={}'.format(result.file.workspace.id, result.file.parent.id,result.file.id,result.file.selected_revision)) %>
<div class="row">
    <div class="col-md-2">
        <img src="" style="width: 128px; border: 1px solid #999;"/>
        <a style="margin-top: -148px; margin-left: 32px;" class="btn btn-default" tittle="${_('Download the file (last revision)')}"
           href="${download_url}" >
            ${TIM.ICO(32, 'actions/go-bottom')}
        </a>
    </div>
    <div class="col-md-6">
        <table class="table table-hover table-condensed table-striped table-bordered">
            <tr>
                <td class="tracim-title">${_('File')}</td>
                <td>
                    <a href="${download_url}" tittle="${_('Download the file (last revision)')}">
                        ${result.file.file.name}
                        <span class="pull-right">${TIM.ICO(16, 'actions/go-bottom')}</span>
                    </a>
                </td>
            </tr>
            <tr>
                <td class="tracim-title">${_('Size')}</td>
                <td>${h.user_friendly_file_size(result.file.file.size)}</td>
            </tr>
            <tr>
                <td class="tracim-title">${_('Modified')}</td>
                <td>${h.format_short(result.file.created)|n} ${_('by {}').format(result.file.owner.name)}</td>
            </tr>
        </table>
    </div>
    <div class="col-md-4">
        % if result.file.content:
            <span class="tracim-title">${_('Description')}</span>
            <p>
                ${result.file.content|n}
            </p>
        % endif
    </div>
</div>

% if result.file.status.id!='open':
    <p class="tracim-less-visible">${_('<b>Note</b>: You need to change status in case you want to upload a new version')|n}</p>
    <hr class="tracim-panel-separator"/>
% else:
    % if h.user_role(fake_api.current_user, result.file.workspace)<=1: # User must be a contributor to be allowed to upload files
        <hr class="tracim-panel-separator"/>
        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.file.workspace, 'file-revisions', _('File revisions'))}
        <p>${_('This file contains {} revision(s)').format(sum(1 for revision in result.file.revisions if revision.action.id=='revision'))}</p>
    % else:
        <hr class="tracim-panel-separator"/>
        ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.file.workspace, 'file-revisions', _('File revisions'), 'new-file-revision', _('upload a new revision and/or comment...'))}
        <p>${_('This file contains {} revision(s)').format(sum(1 for revision in result.file.revisions if revision.action.id in ('creation', 'revision')))}</p>
        ${FORMS.NEW_FILE_REVISION_WITH_COMMENT_FORM('new-file-revision', result.file.workspace.id, result.file.parent.id, result.file.id)}
    % endif
% endif    

<div>
    <table class="table table-striped table-hover">
        % for revid, revision in reversed(list(enumerate(reversed([revision for revision in result.file.revisions if revision.action.id in ('creation', 'revision')])))):
            ## INFO - D.A. - 2014-10-22
            ## We do not show status update and other editions that are not revisions
            ## (at least in this revision list table)
            <% warning_or_not = ('', 'warning')[result.file.selected_revision==revision.id] %>
            <tr class="${warning_or_not}">
                <td><span class="label label-default">v${revid}</span></td>
                <td>${revision.owner.name}</td>
                <td><a href="${tg.url('/workspaces/{}/folders/{}/files/{}?revision_id={}').format(result.file.workspace.id, result.file.parent.id, result.file.id, revision.id)}">${revision.label}</a></td>
                <% rev_download_url = tg.url('/workspaces/{}/folders/{}/files/{}/download?revision_id={}'.format(result.file.workspace.id, result.file.parent.id, result.file.id, revision.id)) %>
                <td><a href="${rev_download_url}">${TIM.ICO(16, 'actions/go-bottom', _('Download this particular revision'))}</a></td>
                <td>${h.date_time_in_long_format(revision.created, _('%Y-%m-%d at %H:%M'))}</td>
                <td>${TIM.ICO_TOOLTIP(16, revision.action.icon, revision.action.label)}</td>
                <td>
                    % if warning_or_not:
                        ${TIM.ICO(16, 'actions/go-previous')} <strong>${_('Revision r{}').format(result.file.selected_revision)}</strong>
                    % endif
                </td>
            </tr>
        % endfor
    </table>
</div>


