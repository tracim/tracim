<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_FILE(user, workspace, file)">
    <% edit_disabled = ('', 'disabled')[file.selected_revision!='latest' or file.status.id[:6]=='closed'] %>
    <% delete_or_archive_disabled = ('', 'disabled')[file.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>1:
        <div class="btn-group btn-group-vertical">
            <a title="${_('Edit current file')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#file-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/files/{}/edit'.format(file.workspace.id, file.parent.id, file.id))}" >${TIM.ICO(32, 'apps/accessories-text-editor')}</a>
        </div>
        <p></p>
    % endif
    
    <div class="btn-group btn-group-vertical">
        <a href="#file-versions" role="button" class="btn btn-default" data-toggle="modal" title="${_('View versions of the file')}">${TIM.ICO(32, 'actions/gnome-document-open-recent')}</a>
## RESTORE LINKS IF REQUIRED        <a href="#file-associated-links" role="button" class="btn btn-default" data-toggle="modal" title="${_('View all links')}">${TIM.ICO(32, 'apps/internet-web-browser')}</a>
    </div>
    <p></p>
    
    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive file')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/files/{}/put_archive'.format(file.workspace.id, file.parent.id, file.id))}">${TIM.ICO(32, 'mimetypes/package-x-generic')}</a>
            <a title="${_('Delete file')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/files/{}/put_delete'.format(file.workspace.id, file.parent.id, file.id))}">${TIM.ICO(32, 'status/user-trash-full')}</a>
        </div>
    % endif
</%def>

