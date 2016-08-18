<%inherit file="local:templates.master_authenticated_left_treeview_right_toolbar"/>

<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="TOOLBAR" file="tracim.templates.workspace.toolbar"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="P" file="tracim.templates.widgets.paragraph"/>
<%namespace name="TITLE" file="tracim.templates.widgets.title"/>
<%namespace name="TABLE_ROW" file="tracim.templates.widgets.table_row"/>

<%def name="title()">${result.workspace.label}</%def>

<%def name="SIDEBAR_LEFT_CONTENT()">
    <h4>${_('Workspaces')}</h4>
    ${WIDGETS.TREEVIEW('sidebar-left-menu', 'workspace_{}__'.format(result.workspace.id))}
</%def>

<%def name="SIDEBAR_RIGHT_CONTENT()">
##    {TOOLBAR.SECURED_FOLDER(fake_api.current_user, result.folder.workspace, result.folder)}
</%def>

<%def name="REQUIRED_DIALOGS()">
    ${TIM.MODAL_DIALOG('folder-edit-modal-dialog')}
    ${TIM.MODAL_DIALOG('folder-move-modal-dialog')}
    ${TIM.MODAL_DIALOG('file-new-modal-dialog')}
    ${TIM.MODAL_DIALOG('folder-new-modal-dialog')}
    ## TODO-DYNAMIC-CONTENT-HERE
</%def>

############################################################################
##
## PAGE CONTENT BELOW
##
############################################################################

<div class="row t-page-header-row">
    <div class="col-sm-7 col-sm-offset-3 main">
        <h1 class="page-header t-less-visible-border">
            <i class="fa fa-fw fa-lg fa-bank t-less-visible"></i>
            ${result.workspace.label}
        </h1>

        <div style="margin: -1.5em auto -1.5em auto;" class="t-less-visible">
          <p>${_('workspace created on {date} at {time}').format(date=h.date(result.workspace.created), time=h.time(result.workspace.created))|n}</p>
        </div>
    </div>
</div>



<div class="row">
    <div class="col-sm-7 col-md-offset-3">
        ${TITLE.H3(_('Detail'), 'fa-align-justify', 'workspace-members')}
        % if result.workspace.description:
            <p>${result.workspace.description}</p>
        % else:
            <p class="t-less-visible">${_('No description available')}</p>
        % endif

        <% member_nb = len(result.workspace.members) %>
        <% viewable_members = h.get_viewable_members_for_role(fake_api.current_user_workspace_role, result.workspace.members) %>
        <% viewable_member_nb = len(viewable_members) %>
        % if member_nb<=0:
            ${P.EMPTY_CONTENT(_('There are no members in this workspace'))}
        % else:
            <p>
                % if member_nb == 1:
                    ${_('This workspace has {a_open}one member{a_close}').format(a_open='<a data-toggle="collapse" href="#memberList" aria-expanded="false" aria-controls="memberList">', a_close='</a>')|n}
                % else:
                    ${_('This workspace has {a_open}{member_nb} members{a_close}').format(a_open='<a data-toggle="collapse" href="#memberList" aria-expanded="false" aria-controls="memberList">', member_nb=member_nb, a_close='</a>')|n}
                    % if viewable_member_nb != member_nb:
                        <span id="members-whose" style="display: none;">${ _('whose') }:</span>
                    % endif
                % endif
            </p>
            <div class="collapse" id="memberList">
                <table class="table">
                    % for member in viewable_members:
                        <tr>
                            <td><strong>${member.name}</strong></td>
                            <td>
                                ${TIM.ICO_FA_BADGED('fa fa-fw fa-flag', member.role_description, member.style)}
                                ${member.role_description}
                            </td>
                        </tr>
                    % endfor
                </table>
            </div>
            <script>
                $(document).ready(function(){
                    $('#memberList').on('show.bs.collapse', function() {
                        $('#members-whose').show();
                    });
                    $('#memberList').on('hide.bs.collapse', function() {
                        $('#members-whose').hide();
                    });
                });
            </script>
        % endif

        % if result.workspace.calendar_enabled:
            <p>
                ${_('This workspace has {a_open}an associated calendar{a_close}').format(a_open='<a data-toggle="collapse" href="#calendarConfig" aria-expanded="false" aria-controls="calendarConfig">', a_close='</a>')|n}
            </p>
            <div class="collapse" id="calendarConfig">
                <p>${_('You can access the calendar using your own software: Outlook, Thunderbird, etc.')}</p>
                <p>${_('The url to setup is the following one:')}</p>
                <p class="form-control">${result.workspace.calendar_url}</p>
            </div>
        % endif

    </div>
</div>

<div class="row">
    <div class="col-sm-7 col-sm-offset-3">
        <div class="t-half-spacer-above t-less-visible">
        </div>
    </div>
</div>

<div class="row">
    <div class="col-sm-7 col-sm-offset-3">
        <div class="t-half-spacer-above">
            <% user_role = h.user_role(fake_api.current_user, result.workspace) %>

            ${TITLE.H3(_('Content'), 'fa-copy', 'workspace-content')}

            % if user_role > 1:
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                        <i class="fa fa-plus"></i> ${_('New ...')}
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" role="menu">
                        % for content_type in result.workspace.allowed_content_types:
                            % if content_type.id == 'folder' and user_role > 2:
                                ## Only show 'new folder' to content managers
                                <%
                                    new_form_content_url = tg.url('/workspaces/{}/folders/new'.format(result.workspace.id), params={'workspace_id': result.workspace.id, 'parent_id': None})
                                    modal_dialog_id = '{content_type}-new-modal-dialog'.format(content_type=content_type.id)
                                    icon_classes = content_type.icon+' '+content_type.color
                                %>
                                <li>${BUTTON.DATA_TARGET_AS_TEXT_AND_ICON_MODAL_WITH_REMOTE_CONTENT(modal_dialog_id, content_type.label, new_form_content_url, icon_classes)}</li>
                            % else:
                                <li>${BUTTON.DATA_TARGET_AS_TEXT_AND_ICON_MODAL_WITH_REMOTE_CONTENT('', _('You are not allowed to create content'), '', 't-less-visible fa fa-ban')}</li>
## Show new content entries in the menu is currently not available at root of a workspace
## TODO - D.A. - 2015-08-20 - Allow to put content at root (and show related entry in the menu
##                             % if user_role == 2:
##                                 ## Only show 'new folder' to content managers
##                                 <%
##                                     new_form_content_url = tg.url('/workspaces/{}/folders/{}/{}s/new'.format(result.folder.workspace.id, result.folder.id, content_type.id), params={'workspace_id': result.folder.workspace.id, 'parent_id': result.folder.id})
##                                     modal_dialog_id = '{content_type}-new-modal-dialog'.format(content_type=content_type.id)
##                                     icon_classes = content_type.icon+' '+content_type.color
##                                 %>
##                                 <li>${BUTTON.DATA_TARGET_AS_TEXT_AND_ICON_MODAL_WITH_REMOTE_CONTENT(modal_dialog_id, content_type.label, new_form_content_url, icon_classes)}</li>
##                             % endif
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
                    % for content_type in result.workspace.allowed_content_types:
                        ${BUTTON.TEXT('toggle-{type}-visibility'.format(type=content_type.id), 'btn btn-default t-active-color disabled-has-priority', content_type.label)}
                    % endfor
                </div>

                <div class="btn-group pull-right" role="group" aria-label="...">
                    <input id="filtering"  type="text" class="form-control t-bg-grey" placeholder="${_('search...')}" aria-describedby="basic-addon1">
                </div>
            % endif

        </div>
        <div class="t-spacer-above">

            % if len(fake_api.sub_items) <= 0:
                ${P.EMPTY_CONTENT(_('This folder has not yet content.'))}
            % else:
                <table class="table table-striped table-hover tablesorter" id="current-workspace-content-list">
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

##             % if h.user_role(fake_api.current_user, result.workspace)<=2: # User must be a content manager to be allowed to create folders
##                 ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'))}
##             % else:
##                 ${WIDGETS.SECURED_SECTION_TITLE(fake_api.current_user, result.workspace, 'sub-folders', _('Folders'), 'folder-new', _('Add a folder...'))}
##                 {FORMS.NEW_FOLDER_FORM('folder-new', result.workspace.id)}
##             % endif
##
##             <p>
##                 ${WIDGETS.FOLDER_LIST('subfolder-list', result.workspace.id, fake_api.current_workspace_folders)}
##             </p>
##             % if len(fake_api.current_workspace_folders)<=0 and fake_api.current_user:
##                 % if h.user_role(fake_api.current_user, result.workspace)>2: # User must be a content manager to be allowed to create folders
##                     <p>
##                         ${_('You need folders to organize your content.')}
##                         <a class="btn btn-small btn-primary" data-toggle="collapse" data-target="#folder-new"><i class="fa fa-check"></i> <b>${_('Create a folder now')}</b></a>
##                     </p>
##                 % endif
##             % endif
        </div>
    </div>
</div>

<script>
    $(document).ready(function() {
        $("#current-workspace-content-list").DataTable({
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
            $("#current-workspace-content-list").DataTable().search(
                $("#filtering").val()
            ).draw();
        });
    });
</script>
