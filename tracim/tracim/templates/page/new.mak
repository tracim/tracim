<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="PAGE_FORMS" file="tracim.templates.page.forms"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

${PAGE_FORMS.NEW('form-page-new', result.item.workspace.id, result.item.parent.id)}
<script src="${tg.url('/assets/tinymce/js/tinymce/tinymce.min.js')}"></script>
${TIM.TINYMCE_INIT_SCRIPT('.pod-rich-textarea')}
