<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>

<%def name="EDIT_FOLDER_FORM(dom_id, folder)">
    <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}?_method=PUT').format(folder.workspace.id, folder.id)}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title">${TIM.FA('fa-edit t-less-visible')} ${_('Edit Folder')}</h4>
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
                <label><input name="can_contain_folders" type="checkbox" ${checked}> ${TIM.FA('fa-folder-open-o fa-fw t-folder-color')} ${_('sub-folders')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.thread] %>
                <label><input name="can_contain_threads" type="checkbox" ${checked}> ${TIM.FA('fa-comments-o fa-fw t-thread-color')} ${_('threads')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.file] %>
                <label><input name="can_contain_files" type="checkbox" ${checked}> ${TIM.FA('fa-paperclip fa-fw t-file-color')} ${_('files')}</label>
            </div>
            <div class="checkbox">
                <% checked = ('', 'checked')[folder.allowed_content.page] %>
                <label><input name="can_contain_pages" type="checkbox" ${checked}> ${TIM.FA('fa-file-text-o fa-fw t-page-color')} ${_('Wiki pages')} </label>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right t-modal-form-submit-button">
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
                <span class="pull-right t-modal-form-submit-button">
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
                <span class="pull-right t-modal-form-submit-button">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Create this page')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>
                
                <div style="clear: both;"></div>
            </form>
        </div>
        <hr/>
    </div>
</%def>

<%def name="USER_EDIT_FORM(dom_id, user, target_url, next_url='')">
    <form id="${dom_id}" role="form" method="POST" action="${target_url}">
        <input type="hidden" name="next_url" id="next_url" value="${next_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.FA('fa-edit t-less-visible')} ${_('Edit User')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="name">${_('Name')}</label>
                <input name="name" type="text" class="form-control" id="name" placeholder="${_('Name')}" value="${user.name}" ${'readonly="readonly"' if h.is_user_externalized_field('name') else ''}>
            </div>
            <div class="form-group">
                <label for="email">${_('Email')}</label>
                <input name="email" type="text" class="form-control" id="email" placeholder="${_('Name')}" value="${user.email}" ${'readonly="readonly"' if h.is_user_externalized_field('email') else ''}>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right t-modal-form-submit-button">
                <button type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
    </form>
</%def>

