<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.folder.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>

<%def name="title()">${result.folder.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.folder.workspace.id, result.folder.id))}
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
    ${TOOLBAR.SECURED_FOLDER(fake_api.current_user, result.folder.workspace, result.folder)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.HELP_MODAL_DIALOG('content-wiki-page-definition')}
    ${TIM.MODAL_DIALOG('folder-edit-modal-dialog')}
    ${TIM.MODAL_DIALOG('folder-move-modal-dialog')}
    ${TIM.MODAL_DIALOG('folder-new-modal-dialog')}
    ${TIM.MODAL_DIALOG('file-new-modal-dialog')}
    ${TIM.MODAL_DIALOG('page-new-modal-dialog')}
    ${TIM.MODAL_DIALOG('thread-new-modal-dialog')}
    ## TODO-DYNAMIC-CONTENT-HERE
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<div class="row t-page-header-row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-folder-color-border">
            <i class="fa fa-fw fa-lg fa-folder-open tracim-less-visible" style="color: #CCCC00"></i>
            ${result.folder.label}
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
          <p>${_('folder created on {date} at {time} by <b>{author}</b>').format(date=h.date(result.folder.created), time=h.time(result.folder.created), author=result.folder.owner.name)|n}</p>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-sm-7 col-sm-offset-3">

        <% user_role = h.user_role(fake_api.current_user, result.folder.workspace) %>

        <div class="t-spacer-above">
            % if user_role > 1:
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                        <i class="fa fa-plus"></i> ${_('New ...')}
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" role="menu">
                        % for content_type in result.folder.allowed_content_types:
                            % if content_type.id != 'folder' or user_role > 2:
                                ## Only show 'new folder' to content managers
                                <%
                                    new_form_content_url = tg.url('/workspaces/{}/folders/{}/{}s/new'.format(result.folder.workspace.id, result.folder.id, content_type.id), params={'workspace_id': result.folder.workspace.id, 'parent_id': result.folder.id})
                                    modal_dialog_id = '{content_type}-new-modal-dialog'.format(content_type=content_type.id)
                                    icon_classes = content_type.icon+' '+content_type.color
                                %>
                                <li>${BUTTON.DATA_TARGET_AS_TEXT_AND_ICON_MODAL_WITH_REMOTE_CONTENT(modal_dialog_id, content_type.label, new_form_content_url, icon_classes)}</li>
                            % endif
                        % endfor
                    </ul>
                </div>
            % endif

            % if len(fake_api.sub_items) > 0:
                ## INFO - D.A. - 2015-05-25
                ## We hide filtering/search buttons if no content yet.
                ## This make the interface more easy to use
                <div class="btn-group" role="group" aria-label="...">
                    ${BUTTON.TEXT('', 'btn btn-default disabled', _('hide...'))}
                    % for content_type in result.folder.allowed_content_types:
                        ${BUTTON.TEXT('toggle-{type}-visibility'.format(type=content_type.id), 'btn btn-default t-active-color disabled-has-priority', content_type.label)}
                    % endfor
                </div>

                <div class="btn-group pull-right" role="group" aria-label="...">
                    <input id="filtering"  type="text" class="form-control t-bg-grey" placeholder="${_('search...')}" aria-describedby="basic-addon1">
                </div>
            % endif
        </div>

        <div class="t-spacer-above">
            % if user_role > 1:
                ## TODO - D.A. - 2015-05-25 - Remove this part of code which becomes useless
                % if result.folder.allowed_content.page:
                    ${FORMS.NEW_PAGE_FORM('page-new', result.folder.workspace.id, result.folder.id)}
                % endif
                % if result.folder.allowed_content.thread:
                    ${FORMS.NEW_THREAD_FORM('thread-new', result.folder.workspace.id, result.folder.id)}
                % endif
                % if result.folder.allowed_content.file:
                    ## FIXME${FORMS.NEW_FILE_FORM('file-new', result.folder.workspace.id, result.folder.id)}
                    ## FIXME${FORMS.NEW_FILE_FORM('file-new', result.folder.workspace.id, result.folder.id)}
                % endif
                % if user_role > 2 and result.folder.allowed_content.folder:
                    ## FIXME${FORMS.NEW_FOLDER_FORM('folder-new', result.folder.workspace.id, result.folder.id)}
                % endif
            % endif

            % if len(fake_api.sub_items) <= 0:
                ${P.EMPTY_CONTENT(_('This folder has not yet content.'))}
            % else:
                <table class="table table-striped table-hover tablesorter" id="current-folder-content-list">
                    <thead>
                        <tr>
                            <th>${_('Type')}</th>
                            <th>${_('Title')}</th>
                            <th>${_('Status')}</th>
                            <th>${_('Remarques')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        % for content in fake_api.sub_items:
                            ${TABLE_ROW.CONTENT(content)}
                        % endfor
                    </tbody>
                </table>
            % endif
        </div>
    </div>
</div>
<script>
    $(document).ready(function() {
        $("#current-folder-content-list").DataTable({
            sDom: '',
            pageLength: -1
        });
    });

    $(document).ready(function() {
        $("#toggle-file-visibility").click(function() {
            $('.t-table-row-file').toggle();
            $('#toggle-file-visibility').toggleClass('t-active-color');
            $('#toggle-file-visibility').toggleClass('t-inactive-color');
        });
        $("#toggle-thread-visibility").click(function() {
            $('.t-table-row-thread').toggle();
            $('#toggle-thread-visibility').toggleClass('t-active-color');
            $('#toggle-thread-visibility').toggleClass('t-inactive-color');
        });
        $("#toggle-folder-visibility").click(function() {
            $('.t-table-row-folder').toggle();
            $('#toggle-folder-visibility').toggleClass('t-active-color');
            $('#toggle-folder-visibility').toggleClass('t-inactive-color');
        });
        $("#toggle-page-visibility").click(function() {
            $('.t-table-row-page').toggle();
            $('#toggle-page-visibility').toggleClass('t-active-color');
            $('#toggle-page-visibility').toggleClass('t-inactive-color');
        });
    });

    $(document).ready(function() {
        $("#filtering").on('keyup click', function() {
            $("#current-folder-content-list").DataTable().search(
                $("#filtering").val()
            ).draw();
        });
    });
</script>
