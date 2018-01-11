<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()"></%def>

<%def name="FORM(file)">
    <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}/files/{}?_method=PUT'.format(file.workspace.id, file.parent.id, file.id))}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.ICO(32, 'mimetypes/text-html')} ${_('Edit file')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="file-title">${_('Title')}</label>
                <input name="label" type="text" class="form-control" id="file-title" placeholder="${_('Title')}" value="${file.label}">
            </div>
            <div class="form-group">
                <label for="file-content">${_('Description')}</label>
                <textarea id="file-content-textarea" name="comment" class="form-control pod-rich-textarea" id="file-content" placeholder="${_('Write here the file content')}">${file.content}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button id="file-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
        ${TIM.TINYMCE_INIT_SCRIPT('#file-content-textarea')}
    </form> 
</%def>

${FORM(result.item)}

