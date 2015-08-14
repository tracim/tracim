<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()"></%def>

<%def name="FORM(page)">
    <form role="form" method="POST" action="${tg.url('/workspaces/{}/folders/{}/pages/{}?_method=PUT'.format(page.workspace.id, page.parent.id, page.id))}">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
            <h4 class="modal-title" id="myModalLabel">${TIM.ICO(32, 'mimetypes/text-html')} ${_('Edit Page')}</h4>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="page-title">${_('Title')}</label>
                <input name="label" type="text" class="form-control" id="page-title" placeholder="${_('Title')}" value="${page.label}">
            </div>
            <div class="form-group">
                <label for="page-content">${_('Content')}</label>
                <textarea id="page-content-textarea" name="content" class="form-control pod-rich-textarea" id="page-content" placeholder="${_('Write here the page content')}">${page.content}</textarea>
            </div>
        </div>
        <div class="modal-footer">
            <span class="pull-right" style="margin-top: 0.5em;">
                <button id="page-save-button" type="submit" class="btn btn-small btn-success" title="${_('Validate')}"><i class="fa fa-check"></i> ${_('Validate')}</button>
            </span>
        </div>
        ${TIM.TINYMCE_INIT_SCRIPT('#page-content-textarea')}
    </form> 
</%def>

${FORM(result.item)}

