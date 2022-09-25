$(document).ready(function() {
  $("#alert").hide();

  imageUpload('#logoContainer', '#logo', 'bank');

  $('#entryForm').submit(function(event) {
    event.preventDefault();

    $.ajax({
      url: $(this).attr("action"),
      type: $(this).attr("method"),
      data: $(this).formSerialize(),
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
      processData: false,
      success: function(data) {
        if (data.success) {
          $("#alertTitle").html("Success");
          $("#alertMessage").html("Save Success!");
          $("#alert").addClass("alert-success").show();

          var postFrm = $('#postSuccessForm');
          var params = $.url(postFrm.attr('action')).param();
          if (!params) {
            for (var key in params) {
              postFrm.append($('<input type="hidden" name="' + key + '" value="' + params[key] + '" />'));
            }
          }
          window.setTimeout(function() {
            postFrm.submit();
          }, 2 * 1000);

        } else {
          $("#alertTitle").html("Error");
          $("#alertMessage").html("Error on save!");
          $("#alert").addClass("alert-danger").show();
        }
      }
    });
  });
});