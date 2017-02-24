<%namespace name="OLD_WIDGETS" file="tracim.templates.user_workspace_widgets"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

<%def name="TREEVIEW(dom_id, selected_id='', uniq_workspace='0', css_classes='t-spacer-above')">
    <h4 class="t-less-visible t-spacer-above textMenuColor">${_('Workspaces')}</h4>
    <div id="sidebarleft_menu"></div>
    <script src="${tg.url('/assets/js/sidebarleft.js')}"></script>
    <script>
      // (function () { })() is equivalent to window.onload (http://stackoverflow.com/questions/9899372/pure-javascript-equivalent-to-jquerys-ready-how-to-call-a-function-when-the)
      ;(function () {
        sidebarLeft(document.getElementById('sidebarleft_menu'), true, '/workspaces/treeview_root/', '?current_id=${selected_id}', '/workspaces/treeview_children', '')
      })()
    </script>
</%def>

