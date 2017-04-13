<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.folder.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="UI" file="tracim.templates.widgets.ui"/>

<%def name="title()">${result.folder.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    ${LEFT_MENU.TREEVIEW('sidebar-left-menu', 'workspace_{}__item_{}'.format(result.folder.workspace.id, result.folder.id))}
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

<div class="folder-container ${'not-editable' if not result.folder.is_editable else ''} ${'archived' if result.folder.is_archived else ''} ${'deleted' if result.folder.is_deleted else ''}">

    <div class="t-page-header-row bg-secondary">
        <div class=" main">
            <h1 class="page-header t-folder-color-border">
                <i class="fa fa-fw fa-lg fa-folder-open tracim-less-visible" style="color: #CCCC00"></i>
                ${result.folder.label}
            </h1>

            <div style="margin: -1.5em auto -1.5em auto;" class="tracim-less-visible">
                <% created_localized = h.get_with_timezone(result.folder.created) %>
                <% updated_localized = h.get_with_timezone(result.folder.updated) %>
                <% last_modification_author = result.folder.last_modification_author.name %>
                <p>${_('folder created on {date} at {time} by <b>{author}</b>').format(date=h.date(created_localized), time=h.time(created_localized), author=result.folder.owner.name)|n}
                    % if result.folder.revision_nb > 1:
                      ${_(' (last modification on {update_date} at {update_time} by {last_modification_author})').format(update_date=h.update_date(updated_localized), update_time=h.update_time(updated_localized), last_modification_author = last_modification_author)|n}
                    % endif
                </p>
            </div>
        </div>
    </div>

    % if (result.folder.is_archived) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('Vous consultez <b>une version archivée</b> de la page courante.')|n}
        </p>
    </div>
    % elif (result.folder.is_deleted) :
    <div class="alert alert-info" role="alert">
        <p>
            <span class="pull-left"><i class="fa fa-fw fa-2x fa-warning" alt="" title=""></i></span>
            ${_('Vous consultez <b>une version supprimée</b> de la page courante.')|n}
        </p>
    </div>
    % endif

    <div class="content__detail folder">
        <% user_role = h.user_role(fake_api.current_user, result.folder.workspace) %>

        <div class="t-spacer-above">
            <div class="row">
                <div class="col-md-4 col-sx-12">
                    % if user_role > 1:
                        <div class="btn-group" role="group">
                            % if (not result.folder.is_archived and not result.folder.is_deleted) :
                                <button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                    <i class="fa fa-plus"></i> ${_('New ...')}
                                    <span class="caret"></span>
                                </button>
                            % endif
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
                </div>
                <div class="col-md-8 text-right">
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
                        <p></p>
                        ${UI.GENERIC_DISPLAY_VIEW_BUTTONS_CONTAINER(tg.url('/workspaces/{}/folders/{}'.format(result.folder.workspace.id, result.folder.id)))}
                        <p></p>
                        <div class="btn-group" role="group" aria-label="...">
                            <input id="filtering"  type="text" class="form-control t-bg-grey" placeholder="${_('filter...')}" aria-describedby="basic-addon1">
                        </div>
                    % endif
                </div>
            </div>
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
                <table class="table table-striped table-hover tablesorter folder__content__list" id="current-folder-content-list">
                    <thead>
                        <tr>
                            <th>${_('Title')}</th>
                            <th>${_('Status')}</th>
                            <th>${_('Notes')}</th>
                            <th>${_('Type')}</th>
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

</div> <!-- end .folder-container -->
