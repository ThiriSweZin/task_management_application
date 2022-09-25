$(document).ready(function() {
  $('div.sidebar-sticky li.nav-item').removeClass('active');
  $('li#menu-bundle').addClass('active');
  $('div#general_subitems').addClass('show');

  $("#alert").hide();

  $("#bundle-name").hide();

  $("#code").on('change keyup', function() {
    var ori_bundle = $("#bundles").val();
    ori_bundle = JSON.parse(ori_bundle);
    var code = $("#code").val();
    var productcode = $("#productcode").val();
    var isExit = false;
    var submitBtn = document.getElementById("submitBtn");

    ori_bundle.forEach(bundle => {
      if (!isExit) {
        if (productcode == bundle.productcode || (productcode == bundle.productcode && code == bundle.code)) {
          isExit = true;
          $("#bundle-name").html("Already Exist!").addClass('text-danger').show();

          submitBtn.setAttribute("disabled", "");
        }
      }
    });
    if (!isExit) {
      $("#bundle-name").hide();
      submitBtn.removeAttribute("disabled");
    }
  })

  $("#productcode").on('change keyup', function() {
    var ori_bundle = $("#bundles").val();
    ori_bundle = JSON.parse(ori_bundle);
    var code = $("#code").val();
    var productcode = $("#productcode").val();
    var isExit = false;
    var submitBtn = document.getElementById("submitBtn");

    ori_bundle.forEach(bundle => {
      if (!isExit) {
        if (productcode == bundle.productcode || (productcode == bundle.productcode && code == bundle.code)) {
          isExit = true;
          $("#bundle-name").html("Already Exist!").addClass('text-danger').show();

          submitBtn.setAttribute("disabled", "");
        }
      }
    });
    if (!isExit) {
      $("#bundle-name").hide();
      submitBtn.removeAttribute("disabled");
    }
  })

  $('a.image-delete-whole').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#wholeImage").val('');
      $('img.image-preview.img-preview-whole').attr('src', '');
      $('.container-whole').show();
      $('.preview-whole').hide();
    }
  })

  $('a.image-delete-splita').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#splitAImage").val('');
      $('img.image-preview.img-preview-splita').attr('src', '');
      $('.container-splita').show();
      $('.preview-splita').hide();
    }
  })

  $('a.image-delete-splitb').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#splitBImage").val('');
      $('img.image-preview.img-preview-splitb').attr('src', '');
      $('.container-splitb').show();
      $('.preview-splitb').hide();
    }
  })

  $("#brandid").Template({
    "template": "<option value='${=id}'>${=brand}</option>",
    "ajax": {
      url: "/api/brand",
      "headers": { "authorization": "Bearer " + token },
      "dataSrc": "brand"
    }
  }).on('completed', function() {
    var selectedVal = $('#brandid').data('value');
    if (selectedVal) {
      // $("#brandid option[value='" + selectedVal + "']").prop('selected', true);
      $("#brandid").selectpicker('val', selectedVal);
    }
    $('#brandid').selectpicker('refresh');
  });

  // $("select#categoryid").Template({
  //   "template": "<option value=''>[Select one]</option>"
  // });

  $("select#categoryid").Template({
    "template": "<option value='${=id}'>${=category}</option>",
    "ajax": {
      url: "/api/category",
      "headers": { "authorization": "Bearer " + token },
      "dataSrc": "category"
    }
  }).on('completed', function() {
    var selectedVal = $('#categoryid').data('value');
    console.log("selectedVal ", selectedVal);
    if (selectedVal) {
      $("#categoryid option[value='" + selectedVal + "']").prop('selected', true);
    }
    $('#categoryid').selectpicker('refresh');
  });

  $("select#type").Template({
    "template": "<option value='0'>Whole</option><option value='1'>Split</option>"
  }).on('completed', function() {
    var selectedVal = $('#type').data('value');
    if (selectedVal) {
      $("#type option[value='" + selectedVal + "']").prop('selected', true);
    }
    $('#type').selectpicker('refresh');
  })

  $("select#available").Template({
    "template": "<option value='0'>Inactive</option><option value='1'>Active</option>"
  }).on('completed', function() {
    var selectedVal = $('#available').data('value');
    console.log("available ", selectedVal);
    if (selectedVal) {
      $("#available option[value='" + selectedVal + "']").prop('selected', true);
    }
    $('#available').selectpicker('refresh');
  })

  imageUpload('#wholeImageContainer', '#wholeImage', 'bundle');
  imageUpload('#splitAImageContainer', '#splitAImage', 'bundle');
  imageUpload('#splitBImageContainer', '#splitBImage', 'bundle');

  var changeType = function(type) {
    console.log("type ", type);
    if (type == 0) {
      $('#imageType').hide();
      // $('#wholeImageLabel').hide();
      // $('#wholeImageContainer').hide();
      // $('#splitAImageLabel').hide();
      // $('#splitAImageContainer').hide();
      // $('#splitBImageLabel').hide();
      // $('#splitBImageContainer').hide();

    } else {
      $('#imageType').show();
      // $('#wholeImageLabel').show();
      // $('#wholeImageContainer').show();
      // $('#splitAImageLabel').show();
      // $('#splitAImageContainer').show();
      // $('#splitBImageLabel').show();
      // $('#splitBImageContainer').show();
    }
  }
  changeType(bundleType);

  $('#type').change(function(ev) {
    changeType($(this).val());
  });

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