<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="THREAD_FORMS" file="tracim.templates.thread.forms"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>

${THREAD_FORMS.NEW('form-thread-new', result.item.workspace.id, result.item.parent.id)}
<script src="${tg.url('/assets/tinymce/js/tinymce/tinymce.min.js')}"></script>
${TIM.TINYMCE_INIT_SCRIPT('.pod-rich-textarea')}

