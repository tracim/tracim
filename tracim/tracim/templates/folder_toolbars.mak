<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_FOLDER(user, workspace, folder)">
    <% edit_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed'] %>
    <%
        ## FIXME - This control should be based on the user role
        move_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed']
    %>
    
    <% delete_or_archive_disabled = ('', 'disabled')[folder.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>2:
        <div class="btn-group btn-group-vertical">
            ## This action is allowed for content managers only
            <a title="${_('Edit current folder')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#folder-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/edit'.format(folder.workspace.id, folder.id))}" >${TIM.ICO(32, 'apps/accessories-text-editor')}</a>
        </div>
        <p></p>
    % endif
    
    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        <div class="btn-group btn-group-vertical">
            ## This action is allowed for content managers only
            <a title="${_('Move current folder')}" class="btn btn-default ${move_disabled}" data-toggle="modal" data-target="#folder-move-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/location/{}/edit'.format(folder.workspace.id, folder.id, folder.id))}" >${TIM.ICO(32, 'actions/item-move')}</a>
        </div>
        <p></p>
    % endif

    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/put_archive'.format(folder.workspace.id, folder.id))}">${TIM.ICO(32, 'mimetypes/package-x-generic')}</a>
            <a title="${_('Delete thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/put_delete'.format(folder.workspace.id, folder.id))}">${TIM.ICO(32, 'status/user-trash-full')}</a>
        </div>
        <p></p>
    % endif

</%def>

