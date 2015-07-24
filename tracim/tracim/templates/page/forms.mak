<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="BUTTON" file="tracim.templates.widgets.button"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="WIDGETS" file="tracim.templates.user_workspace_widgets"/>

<%def name="NEW(dom_id, workspace_id, parent_id=None)">
    <div id="{dom_id}">
        <form role="form" method="POST" enctype="multipart/form-data" action="${tg.url('/workspaces/{}/folders/{}/pages'.format(workspace_id, parent_id))}">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">${_('Close')}</span></button>
                <h4 class="modal-title" >${ICON.FA('fa-file-text-o t-page-color')} ${_('New Page')}</h4>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="page-title">${_('Page title')}</label>
                    <input name="label" type="text" class="form-control" id="page-title" placeholder="${_('Title')}">
                </div>

                <div class="form-group">
                    <label for="page-content">${_('Content')}</label>
                    <iframe id="page-content-textarea" name="content" class="form-control pod-rich-textarea" id="page-content" placeholder="${_('Write here the page content')}"></iframe>
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
