<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="LEFT_MENU" file="tracim.templates.widgets.left_menu"/>

<%def name="NEW(dom_id, workspace_id, parent_id=None)">
    <div id="{dom_id}">
        <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{workspace_id}/folders').format(workspace_id=workspace_id)}">
            <input type="hidden" name="parent_id" value="${parent_id}">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
                <h4 class="modal-title" >${ICON.FA('fa-folder-open-o t-folder-color')} ${_('New Folder')}</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="folder-label">${_('Folder name')}</label>
                    <input id="folder-label" class="form-control" name="label" type="text">
                </div>
                <div class="form-group">
                    <p>${_('This folder may contain:')}</p>
                    <p>
                        <label><input id="content-folders" name="can_contain_folders" type="checkbox" checked> ${TIM.FA('fa-folder-open-o fa-fw t-folder-color')} ${_('sub-folders')}</label><br/>
                        <label><input id="content-threads" name="can_contain_threads" type="checkbox" checked> ${TIM.FA('fa-comments-o fa-fw t-thread-color')} ${_('threads')}</label><br/>
                        <label><input id="content-files" name="can_contain_files" type="checkbox" checked> ${TIM.FA('fa-paperclip fa-fw t-file-color')} ${_('files')}</label><br/>
                        <label><input id="content-pages" name="can_contain_pages" type="checkbox" checked> ${TIM.FA('fa-file-text-o fa-fw t-page-color')} ${_('pages')}</label>
## FIXME - D.A. - 2015-05-25
## The help dialog is show below current dialog (so it is invisible)
##                         ${BUTTON.HELP_MODAL_DIALOG('content-wiki-page-definition', 'margin-left: 0.5em;')}
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="${_('Create folder')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
                </span>
            </div>
        </form>
    </div>
</%def>

<%def name="MOVE(dom_id, item, do_move_url, modal_title)">
    <form role="form" method="POST" action="${do_move_url}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title">${TIM.FA('fa-arrows t-less-visible')} ${modal_title}</h4>
        </div>
        <div class="modal-body">
            <div>
                <ul class="nav nav-tabs" role="tablist">
                    <li role="presentation" class="active"><a href="#move-to-same-workspace" aria-controls="move-to-same-workspace" role="tab" data-toggle="tab">${_('in current workspace...')}</a></li>
                    <li role="presentation"><a href="#move-to-another-workspace" aria-controls="move-to-another-workspace" role="tab" data-toggle="tab">${_('to another workspace')}</a></li>
                </ul>
                <div class="tab-content">
                    <div role="tabpanel" class="tab-pane active" id="move-to-same-workspace">
                        <div class="t-half-spacer-above">
                            ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
                        </div>
                    </div>
                    <div role="tabpanel" class="tab-pane" id="move-to-another-workspace">
                        <div class="t-half-spacer-above">
                            ${LEFT_MENU.TREEVIEW('sidebar-left-menu', '__')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right t-modal-form-submit-button">
                <button id="folder-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
    </form>
</%def>
