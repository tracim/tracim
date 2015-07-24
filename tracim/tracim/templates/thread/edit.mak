<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="title()"></%def>

<%def name="FORM(thread)">
    <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}/threads/{}?_method=PUT'.format(thread.workspace.id, thread.parent.id, thread.id))}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title" id="myModalLabel">${ICON.FA_FW('fa fa-comments-o t-thread-color')} ${_('Edit Subject')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="thread-title">${_('Subject')}</label>
                <input name="label" type="text" class="form-control" id="thread-title" placeholder="${_('Subject')}" value="${thread.label}">
            </div>
            <div class="form-group">
                <label for="thread-content">${_('Description')}</label>
                <textarea id="thread-content-textarea" name="content" class="form-control pod-rich-textarea" id="thread-content" placeholder="${_('Optionnaly, you can describe the subject')}">${thread.content}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button id="thread-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
        ${TIM.TINYMCE_INIT_SCRIPT('#thread-content-textarea')}
    </form> 
</%def>

${FORM(result.item)}

