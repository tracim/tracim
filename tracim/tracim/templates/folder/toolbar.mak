<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="SECURED_FOLDER(user, workspace, folder)">
##    <div style="width: 100%; text-align: center;">
##        <a href="" title="Add to favorites" ><i class="fa fa-3x fa-fw fa-star-o tracim-less-visible"></i></a>
##        <a href="" title="Subscribe to email notifications" ><i class="fa fa-3x fa-fw fa-envelope-o tracim-less-visible"></i></a>
##        <hr/>
##        <a href="" title="Remove from favorites" ><i class="fa fa-3x fa-fw fa-star"></i></a>
##        <a href="" title="Unsubscribe" ><i class="fa fa-3x fa-fw fa-envelope"></i></a>
##        <hr/>
##        <a href="" class="btn btn-success" style="text-align: center;">
##            <i class="fa fa-4x fa-fw fa-eye"></i><br/>
##            <span style="color: #FFF">${_('mark read')}</span>
##        </a>
##        <hr/>
##        <a href="" class="btn btn-default" style="text-align: center;">
##            <i class="fa fa-4x fa-fw fa-eye-slash tracim-less-visible"></i><br/>
##            <span class="tracim-less-visible">${_('mark unread')}</span>
##        </a>
##    </div>
##    <p></p>
##    <hr/>

    <% edit_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed'] %>
    <%
        ## FIXME - This control should be based on the user role
        move_disabled = ('', 'disabled')[folder.selected_revision!='latest' or folder.status.id[:6]=='closed']
    %>
    
    <% delete_or_archive_disabled = ('', 'disabled')[folder.selected_revision!='latest'] %> 
    % if h.user_role(user, workspace)>2:
        <div class="btn-group btn-group-vertical">
            ## This action is allowed for content managers only
            <a title="${_('Edit current folder')}" class="btn btn-default ${edit_disabled}" data-toggle="modal" data-target="#folder-edit-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/edit'.format(folder.workspace.id, folder.id))}" ><i class="fa fa-edit fa-fw tracim-less-visible"></i> ${_('Edit')}</a>
        </div>
        <p></p>
    % endif
    
    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        <div class="btn-group btn-group-vertical">
            ## This action is allowed for content managers only
            <a title="${_('Move current folder')}" class="btn btn-default ${move_disabled}" data-toggle="modal" data-target="#folder-move-modal-dialog" data-remote="${tg.url('/workspaces/{}/folders/{}/location/{}/edit'.format(folder.workspace.id, folder.id, folder.id))}" ><i class="fa fa-arrows fa-fw tracim-less-visible"></i> ${_('Move')}</a>
        </div>
        <p></p>
    % endif

    % if user.profile.id>=3 or h.user_role(user, workspace)>=4:
        ## if the user can see the toolbar, it means he is the workspace manager.
        ## So now, we need to know if he alsa has right to delete workspaces
        <div class="btn-group btn-group-vertical">
            <a title="${_('Archive thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/put_archive'.format(folder.workspace.id, folder.id))}"><i class="fa fa-archive fa-fw tracim-less-visible"></i> ${_('Archive')}</a>
            <a title="${_('Delete thread')}" class="btn btn-default ${delete_or_archive_disabled}" href="${tg.url('/workspaces/{}/folders/{}/put_delete'.format(folder.workspace.id, folder.id))}"><i class="fa fa-trash-o fa-fw tracim-less-visible"></i> ${_('Delete')}</a>
        </div>
        <p></p>
    % endif

</%def>

