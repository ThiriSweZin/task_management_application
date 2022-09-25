/**
 * Bundle Image
 */
function createImageItem(filename) {
  const $imageBox = $("<div></div>", { class: "form-image wide" });
  const $previewContainer = $("<span></span>", { class: "image-preview-container" });
  const $input = $("<input></input>", { name: "image", type: "hidden", value: filename });
  const $img = $("<img></img>", { class: "form-image-preview", src: "/file/stream?file=" + filename, alt: "Image" });
  const $deleteContainer = $("<div></div>", { class: "image-delete-container" });
  const $delete = $("<a></a>", { class: "image-delete", title: "Remove" });
  $delete.append($("<i></i>", { class: "fa fa-trash" }));
  $delete.on("click", function(ev) {
    ev.preventDefault();
    $.post("/file/delete", { file: filename }, function(data, status) {
      if (data && data.message == "success") {
        $imageBox.remove();
      }
    });
  });
  $deleteContainer.append($delete);
  $previewContainer.append($input).append($img).append($deleteContainer);
  $imageBox.append($previewContainer);
  return $imageBox;
}

Dropzone.options.imageUploads = {
  maxFilesize: 2,
  acceptedFiles: "image/jpeg,image/png",
  success: function(file, response, done) {
    if (response && response.message == "success" && response.files) {
      for (const i in response.files) {
        $("#imageList").append(createImageItem(response.files[i]));
      }
    }
  }
};

$(document).ready(function() {
  $('div.sidebar-sticky li.nav-item').removeClass('active');
  $('li#menu-bundle').addClass('active');
  $('div#general_subitems').addClass('show');

  $("#alert").hide();

  $(".image-delete").on("click", function(ev) {
    ev.preventDefault();
    const $container = $(this).parent().parent();
    const filename = $container.find("[name='image']").val();
    // $.post("/file/delete", { file: filename }, function(data, status) {
    //   if (data && data.message == "success") {
    $container.parent().remove();
    // }
    // });
  });

  $('#entryForm').submit(function(ev) {
    ev.preventDefault();

    $.ajax({
      url: $("#entryForm").attr('action'),
      type: 'post',
      data: $("#entryForm").serialize(),
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