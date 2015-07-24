<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="NEW(dom_id, workspace_id, parent_id=None)">
    <div id="{dom_id}">
        <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{}/folders/{}/files'.format(workspace_id, parent_id))}">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
                <h4 class="modal-title" >${ICON.FA('fa-paperclip')} ${_('New File')}</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="file-label">${_('Title (optionnal)')}</label>
                    <input id="file-label" class="form-control" name="label" type="text" placeholder="${_('you can give a title to the file, otherwise, the filename will be used.')}">
                </div>
                <div class="form-group">
                    <label for="file-object">${_('Select a file')}</label>
                    <input id="file-object" name="file_data" type="file" placeholder="${_('choose a file')}">
                </div>
            </div>
            <div class="modal-footer">
                <span class="pull-right" style="margin-top: 0.5em;">
                    <button id="file-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
                </span>
            </div>
        </form>
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
                <span class="pull-right t-modal-form-submit-button">
                    <button id="${dom_id}-submit-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class=" fa fa-check"></i> ${_('Validate')}</button>
                </span>

                <div style="clear: both;"></div>
            </form>
        </div>
    </div>
</%def>