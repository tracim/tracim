$(document).ready(function () {

  // add select2 for admin/workspace/<id> for user selection
  if ($('#add-role-from-existing-user-form').length > 0) {
    $('#user_id').select2({
      "language": {
        "noResults": function () {
          return "Aucun résultats"
        }
      },
      escapeMarkup: function (markup) {
        return markup
      }
    })
  }
})
