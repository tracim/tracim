<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.file.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.file.forms"/>

<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>




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
    ${TIM.MODAL_DIALOG('file-edit-modal-dialog', 'modal-lg')}
    ${TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')}
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<div class="row t-page-header-row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-file-color-border">
            <i class="fa fa-fw fa-lg fa-paperclip tracim-less-visible t-file-color"></i>
            ${result.file.label}

            <span class="pull-right">
                ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_FILE(fake_api.current_user, result.file.workspace, result.file)}
            </span>
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
          <p>${_('file created on {date} at {time} by <b>{author}</b>').format(date=h.date(result.file.created), time=h.time(result.file.created), author=result.file.owner.name)|n}</p>
        </div>
    </div>
</div>

% if result.file.selected_revision!='latest':
    <div class="row alert alert-warning" role="alert">
        <div class="col-sm-7 col-sm-offset-3">
            <p>
                <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
                ${_('You are reading <b>an old revision</b> of the current file. (the shown revision is r{}).').format(result.file.selected_revision)|n}
            </p>
            <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/files/{}').format(result.file.workspace.id, result.file.parent.id, result.file.id)}">${_('Show latest revision')}</a>
        </div>
    </div>
% endif

% if result.file.status.id=='closed-deprecated':
    <div class="row alert alert-warning" role="alert">
        <div class="col-sm-7 col-sm-offset-3">
            <p>
                <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
                ${_('<b>This file is deprecated</b>')|n}
            </p>
        </div>
    </div>
% endif

<div class="row">
    <% download_url = tg.url('/workspaces/{}/folders/{}/files/{}/download?revision_id={}'.format(result.file.workspace.id, result.file.parent.id,result.file.id,result.file.selected_revision)) %>
    <div class="col-sm-1 col-sm-offset-3">
        <div class="t-half-spacer-above download-file-button">
            <a style="" class="btn btn-default" tittle="${_('Download the file')}"
                href="${download_url}" >
                ${ICON.FA_FW('fa fa-download fa-2x')}
            </a>
        </div>
    </div>
    <div class="col-md-5">
        <div class="t-half-spacer-above">
            <table class="table table-hover table-condensed table-striped table-bordered">
                <tr>
                    <td class="tracim-title">${_('File')}</td>
                    <td>
                        <a href="${download_url}" tittle="${_('Download the file (last revision)')}">
                            ${result.file.file.name}
                            <span class="pull-right">
                                ${ICON.FA_FW('fa fa-download')}
                            </span>

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
    </div>
    <div class="col-md-1">
        <div class="t-half-spacer-above">
            % if result.file.status.id in ('closed-validated', 'closed-unvalidated'):
                <span style="font-size: 1.5em;"><i class="pull-right fa fa-4x ${result.file.status.css} ${result.file.status.icon}"></i></span>
            % endif
        </div>
    </div>
</div>

% if result.file.content.strip():  # only show desc if really a content
    <div class="row">
        <div class="col-md-7 col-sm-offset-3">
            <div class="well">
                ${result.file.content|n}
            </div>
        </div>
    </div>
% endif

<div class="row">
    <div class="col-md-7 col-sm-offset-3">
        % if result.file.status.id!='open':
            <p class="tracim-less-visible">${_('<b>Note</b>: You need to change status in case you want to upload a new version')|n}</p>
        % else:
            % if h.user_role(fake_api.current_user, result.file.workspace)<=1: # User must be a contributor to be allowed to upload files
                ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.file.workspace, 'file-revisions', _('File revisions'))}
                <p>${_('This file contains {} revision(s)').format(sum(1 for revision in result.file.revisions if revision.action.id=='revision'))}</p>
            % else:
                % if h.user_role(fake_api.current_user, result.file.workspace)>1:
                    ${BUTTON.DATA_TARGET_AS_TEXT('new-file-revision', _('upload a new revision and/or comment...'), 'btn btn-success t-spacer-below')}
                    ${FORMS.NEW_FILE_REVISION_WITH_COMMENT_FORM('new-file-revision', result.file.workspace.id, result.file.parent.id, result.file.id)}
                % endif
            % endif
        % endif
    </div>
</div>

<div class="row t-page-metadata-row t-spacer-above">
    <div class="col-sm-7 col-sm-offset-3">
        <div class="t-spacer-above">
            <span id="associated-revisions" ></span>
            <h4 class="anchored-title">${_('File history')}</h4>
            <div>
                <table class="table table-striped table-hover">
                    % for event in result.file.history:
                        ${WIDGETS.SECURED_HISTORY_VIRTUAL_EVENT_AS_TABLE_ROW(fake_api.current_user, event, result.file.selected_revision)}
                    % endfor
                </table>
            </div>
        </div>
    </div>
<div/>

