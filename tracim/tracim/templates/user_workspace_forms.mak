<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="NEW_FOLDER_FORM(dom_id, workspace_id, parent_id=None)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            <form method="POST" action="${tg.url('/workspaces/{}/folders').format(workspace_id)}">
                <input type="hidden" name="parent_id" value="${parent_id}">
                <p>
                    <label for="folder-name">${_('Folder name')}</label>
                    <input id="folder-name" name="label" type="text">
                </p>
                <p>
                    ${_('This folder may contain:')}
                </p>
                <p>
                    <label><input id="content-folders" name="can_contain_folders" type="checkbox"> ${TIM.ICO(16, 'places/jstree-folder')} ${_('sub-folders')}</label><br/>
                    <label><input id="content-threads" name="can_contain_threads" type="checkbox"> ${TIM.ICO(16, 'apps/internet-group-chat')} ${_('threads')}</label><br/>
                    <label><input id="content-files" name="can_contain_files" type="checkbox"> ${TIM.ICO(16, 'mimetypes/text-x-generic-template')} ${_('files')}</label><br/>
                    <label><input id="content-pages" name="can_contain_pages" type="checkbox"> ${TIM.ICO(16, 'mimetypes/text-html')} ${_('Wiki pages')}</label>
                    ${TIM.HELP_MODAL_DIALOG_BUTTON('content-wiki-page-definition', 'margin-left: 0.5em;')}
                </p>

                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Create this folder')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="EDIT_FOLDER_FORM(dom_id, folder)">
    <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}?_method=PUT').format(folder.workspace.id, folder.id)}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.ICO(32, 'apps/internet-group-chat')} ${_('Edit Folder')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="folder-name">${_('Name')}</label>
                <input name="label" type="text" class="form-control" id="name" placeholder="${_('Name')}" value="${folder.label}">
            </div>
            <p>
                ${_('This folder may contain:')}
            </p>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.folder] %>
                <label><input name="can_contain_folders" type="checkbox" ${checked}> ${TIM.ICO(16, 'places/jstree-folder')} ${_('sub-folders')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.thread] %>
                <label><input name="can_contain_threads" type="checkbox" ${checked}> ${TIM.ICO(16, 'apps/internet-group-chat')} ${_('threads')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.file] %>
                <label><input name="can_contain_files" type="checkbox" ${checked}> ${TIM.ICO(16, 'mimetypes/text-x-generic-template')} ${_('files')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.page] %>
                <label><input name="can_contain_pages" type="checkbox" ${checked}> ${TIM.ICO(16, 'mimetypes/text-html')} ${_('Wiki pages')} </label>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
    </form> 
</%def>



<%def name="ITEM_MOVE_FORM(dom_id, item, do_move_url, modal_title)">
    <form role="form" method="POST" action="${do_move_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.ICO(32, 'actions/item-move')} ${modal_title}</h4>
        </div>
        <div class="modal-body">
            <%
                selected_id = 'workspace_{}__folder_{}'.format(item.workspace.id, item.folder.id if item.folder else '')
                get_root_url = tg.url("/workspaces/treeview_root", dict(current_id=selected_id, all_workspaces=0, folder_allowed_content_types='folder', ignore_id=item.id))
                get_children_url = tg.url("/workspaces/treeview_children", dict(removed_item=item.id, ignore_id=item.id))
            %>

            ${WIDGETS.TREEVIEW_DYNAMIC('move-item-treeview', selected_id, get_root_url, get_children_url, 'move_mode')}
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
    </form> 
</%def>


<%def name="NEW_PAGE_FORM(dom_id, workspace_id, parent_id=None)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            <form method="POST" action="${tg.url('/workspaces/{}/folders/{}/pages').format(workspace_id, parent_id)}">
                <div class="form-group">
                    <label for="page-title">${_('Page title')}</label>
                    <input name="label" type="text" class="form-control" id="page-title" placeholder="${_('Title')}">
                </div>
                <div class="form-group">
                    <label for="page-content">${_('Content')}</label>
                    <textarea id="page-content-textarea" name="content" class="form-control pod-rich-textarea" id="page-content" placeholder="${_('Write here the page content')}"></textarea>
                </div>
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Create this page')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="NEW_THREAD_FORM(dom_id, workspace_id, parent_id=None)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}/threads').format(workspace_id, parent_id)}">
                <div class="form-group">
                    <label for="thread-name">${_('Subject')}</label>
                    <input id="thread-name" class="form-control" name="label" type="text" placeholder="${_('...')}">
                </div>
                <div class="form-group">
                    <label for="thread-message">${_('Message')}</label>
                    <textarea id="thread-message" class="form-control pod-rich-textarea" name="content" type="text" placeholder="${_('...')}"></textarea>
                </div>
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Create this page')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="NEW_FILE_FORM(dom_id, workspace_id, parent_id=None)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{}/folders/{}/files').format(workspace_id, parent_id)}">
                <div class="form-group">
                    <label for="file-label">${_('Title (optionnal)')}</label>
                    <input id="file-label" class="form-control" name="label" type="text" placeholder="${_('you can give a title to this file')}">
                </div>
                <div class="form-group">
                    <label for="file-object">${_('Select a file')}</label>
                    <input id="file-object" name="file_data" type="file" placeholder="${_('choose a file')}">
                </div>
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="NEW_FILE_REVISION_WITH_COMMENT_FORM(dom_id, workspace_id, folder_id, file_id=None)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            % if file_id:
                <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{}/folders/{}/files/{}?_method=PUT').format(workspace_id, folder_id, file_id)}">
            % else:
                <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{}/folders/{}/files').format(workspace_id, folder_id)}">
            % endif
                <div class="form-group">
                    <label for="file-object">${_('Select new file revision')}</label>
                    <input id="file-object" name="file_data" type="file" placeholder="${_('choose a file')}">
                </div>
                <div class="form-group">
                    <label for="file-label">${_('Your comment...')}</label>
                    <textarea id="file-label" class="form-control pod-rich-textarea" name="comment" type="text" placeholder=""></textarea>
                </div>
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="NEW_COMMENT_FORM_IN_THREAD(dom_id, workspace_id, folder_id, thread_id)">
    <div id="${dom_id}" class="collapse">
        <div class="pod-inline-form" >
            <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}/threads/{}/comments').format(workspace_id, folder_id, thread_id)}">
                <div class="form-group">
                    <label for="thread-message">${_('Your message')}</label>
                    <textarea id="thread-message" class="form-control pod-rich-textarea" name="content" type="text" placeholder="${_('...')}"></textarea>
                </div>
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="USER_EDIT_FORM(dom_id, user, target_url)">
    <form id="${dom_id}" role="form" method="POST" action="${target_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.ICO(32, 'actions/contact-new')} ${_('Edit User')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="name">${_('Name')}</label>
                <input name="name" type="text" class="form-control" id="name" placeholder="${_('Name')}" value="${user.name}">
            </div>
            <div class="form-group">
                <label for="email">${_('Email')}</label>
                <input name="email" type="text" class="form-control" id="email" placeholder="${_('Name')}" value="${user.email}">
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
    </form>
</%def>

<%def name="USER_PASSWORD_EDIT_FORM(dom_id, user, target_url)">
    <form id='${dom_id}' role="form" method="POST" action="${target_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title">${TIM.ICO(32, 'actions/system-lock-screen')} ${_('Change password')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="currentPassword" class="control-label">${_('Current password')}</label>
                <div><input class="form-control" type="password" id="currentPassword" name="current_password" placeholder="${_('Current password')}"></div>
            </div>
            <div class="form-group">
                <label for="newPassword1" class="control-label">${_('New password')}</label>
                <div><input class="form-control" type="password" id="newPassword1" name="new_password1" placeholder="${_('New password')}"></div>
            </div>
            <div class="form-group">
                <label for="newPassword2" class="control-label">${_('Retype password')}</label>
                    <div><input class="form-control" type="password" id="newPassword2" name="new_password2" placeholder="${_('Retype password')}"></div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-success pull-right"><i class="fa fa-check"></i> ${_('Save changes')}</button>
            </div>
        </div>
    </form>
</%def>
