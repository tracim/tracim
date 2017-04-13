<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>
<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.file.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.file.forms"/>

<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>




<%def name="title()">${result.file.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.file.workspace.id, result.file.id))}
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

<div class="content-container ${'not-editable' if not result.file.is_editable else ''} ${'archived' if result.file.is_archived else ''} ${'deleted' if result.file.is_deleted else ''}">

    <div class="t-page-header-row bg-secondary">
        <div class="main">
            <h1 class="page-header t-file-color-border">
                <i class="fa fa-fw fa-lg fa-paperclip tracim-less-visible t-file-color"></i>
                ${result.file.label}

                <span class="pull-right">
                    ${WIDGETS.SECURED_SHOW_CHANGE_STATUS_FOR_FILE(fake_api.current_user, result.file.workspace, result.file)}
                </span>
            </h1>

            <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
                <% created_localized = h.get_with_timezone(result.file.created) %>
                <% updated_localized = h.get_with_timezone(result.file.updated) %>
                <% last_modification_author = result.file.last_modification_author.name %>
              <p>${_('file created on {date} at {time} by <b>{author}</b>').format(date=h.date(created_localized), time=h.time(created_localized), author=result.file.owner.name)|n}
                  % if result.file.revision_nb > 1:
                      ${_(' (last modification on {update_date} at {update_time} by {last_modification_author})').format(update_date=h.update_date(updated_localized), update_time=h.update_time(updated_localized), last_modification_author = last_modification_author)|n}
                  % endif
              </p>

            </div>
        </div>
    </div>

    % if (result.file.is_archived) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('Vous consultez <b>une version archivée</b> de la page courante.')|n}
        </p>
    </div>
    % elif (result.file.is_deleted) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('Vous consultez <b>une version supprimée</b> de la page courante.')|n}
        </p>
    </div>
    % endif

    % if result.file.selected_revision!='latest':
    <div class="alert alert-warning" role="alert">
        <p>
            <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
            ${_('You are reading <b>an old revision</b> of the current file. (the shown revision is r{}).').format(result.file.selected_revision)|n}
        </p>
        <a class="pull-right alert-link" href="${tg.url('/workspaces/{}/folders/{}/files/{}').format(result.file.workspace.id, result.file.parent.id, result.file.id)}">
            ${_('Show latest revision')}
        </a>
    </div>
    % endif

    % if result.file.status.id=='closed-deprecated':
    <div class="alert alert-warning" role="alert">
        <p>
            <span class="pull-left">${ICON.FA_FW_2X('fa-warning')}</span>
            ${_('<b>This file is deprecated</b>')|n}
        </p>
    </div>
    % endif

    <div class="content__detail file">
        <% download_url = tg.url('/workspaces/{}/folders/{}/files/{}/download?revision_id={}'.format(result.file.workspace.id, result.file.parent.id,result.file.id,result.file.selected_revision)) %>
        <div class="t-half-spacer-above download-file-button">
            <a style="" class="btn btn-default" tittle="${_('Download the file')}"
                href="${download_url}" >
                ${ICON.FA_FW('fa fa-download fa-2x')}
            </a>
        </div>

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
                    <% created_localized = h.get_with_timezone(result.file.created) %>
                    <td>${h.format_short(created_localized)|n} ${_('by {}').format(result.file.owner.name)}</td>
                </tr>
            </table>
        </div>

        <div class="t-half-spacer-above">
            % if result.file.status.id in ('closed-validated', 'closed-unvalidated'):
                <span style="font-size: 1.5em;"><i class="pull-right fa fa-4x ${result.file.status.css} ${result.file.status.icon}"></i></span>
            % endif
        </div>

    % if result.file.content.strip():  # only show desc if really a content
        <div class="well">
            ${result.file.content|n}
        </div>
    % endif

    % if result.file.status.id!='open':
        <p class="tracim-less-visible">${_('<b>Note</b>: You need to change status in case you want to upload a new version')|n}</p>
    % else:
        % if h.user_role(fake_api.current_user, result.file.workspace)<=1: # User must be a contributor to be allowed to upload files
            ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.file.workspace, 'file-revisions', _('File revisions'))}
            <p>${_('This file contains {} revision(s)').format(sum(1 for revision in result.file.revisions if revision.action.id=='revision'))}</p>
        % else:
            % if (h.user_role(fake_api.current_user, result.file.workspace)>1 and not result.file.is_archived and not result.file.is_deleted):
                ${BUTTON.DATA_TARGET_AS_TEXT('new-file-revision', _('upload a new revision and/or comment...'), 'btn btn-success t-spacer-below')}
                ${FORMS.NEW_FILE_REVISION_WITH_COMMENT_FORM('new-file-revision', result.file.workspace.id, result.file.parent.id, result.file.id)}
            % endif
        % endif
    % endif

    <div class="t-page-metadata-row t-spacer-above">
        <div class="t-spacer-above">
            <span id="associated-revisions"></span>
            <h4 class="anchored-title">${_('File history')}</h4>
            <div>
                <table class="table table-striped table-hover">
                    % for event in result.file.history:
                        ${WIDGETS.SECURED_HISTORY_VIRTUAL_EVENT_AS_TABLE_ROW(fake_api.current_user, event, result.file.selected_revision)}
                    % endfor
                </table>
            </div>
        </div>
    <div/>

</div>
