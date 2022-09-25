$(document).ready(function() {
  $('div.sidebar-sticky li.nav-item').removeClass('active');
  $('li#menu-product').addClass('active');
  $('div#general_subitems').addClass('show');

  // $("#alert").hide();

  $('a.image-delete-product1').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#product1Image").val('');
      $('img.image-preview.img-preview-product1').attr('src', '');
      $('.container-product1').show();
      $('.preview-product1').hide();
    }
  });

  $('a.image-delete-product2').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#product2Image").val('');
      $('img.image-preview.img-preview-product2').attr('src', '');
      $('.container-product2').show();
      $('.preview-product2').hide();
    }
  });

  $('a.image-delete-product3').on('click', function(ev) {
    if (confirm('Are you sure to remove this image?')) {
      $("#product3Image").val('');
      $('img.image-preview.img-preview-product3').attr('src', '');
      $('.container-product3').show();
      $('.preview-product3').hide();
    }
  });

  $("select#status").Template({
    "template": "<option value='0'>Inactive</option><option value='1'>Active</option>"
  }).on('completed', function() {
    var selectedVal = $('#status').data('value');
    if (selectedVal) {
      $("#status option[value=" + selectedVal + "]").prop('selected', true);
    }
    $('#status').selectpicker('refresh');
  });

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

  $("#categoryid").change(function(){
    var selected = $('#categoryid option:selected').val();
    console.log("selected ", selected);
    $('#subcategoryid').empty();
    
    $('#subcategoryid').Template({
      "template": "<option value='${=id}'>${=sub_category}</option>",
      "ajax": {
        "url": "/api/sub_category?filter=categoryid,eq," + selected,
        "headers": {"authorization": "Bearer " + token},
        "dataSrc": "sub_category"
      }
    }).on('completed', function() {
      var selectedVal = $('#subcategoryid').data('value');
      if (selectedVal) {
        $('#subcategoryid').selectpicker('val', selectedVal);
      }
      $('#subcategoryid').selectpicker('refresh');
    });
  });

  $('#subcategoryid').Template({
    "template": "<option value='${=id}'>${=sub_category}</option>",
    "ajax": {
      "url": "/api/sub_category",
      "headers": {"authorization": "Bearer " + token},
      "dataSrc": "sub_category"
    }
  }).on('completed', function() {
    var selectedVal = $('#subcategoryid').data('value');
    if (selectedVal) {
      $('#subcategoryid').selectpicker('val', selectedVal);
    }
    $('#subcategoryid').selectpicker('refresh');
  });

  $("#ifpackage").change(function() {
    if($(this).prop('checked')) {
        $("#itemcount").attr("readonly", false);
      } else {
        $("#itemcount").attr("readonly", true);
        $("#itemcount").val("0");
    }
  });
  var itemcount = $("#itemcount").val();
  if(itemcount > 0){
    $("#itemcount").attr("readonly", false);
    $("#ifpackage").prop("checked", true);
  }
    
  

  imageUpload('#product1ImageContainer', '#product1Image', 'product');
  imageUpload('#product2ImageContainer', '#product2Image', 'product');
  imageUpload('#product3ImageContainer', '#product3Image', 'product');

  $("#product-code").hide();

  $("#productcode").on("change keyup", function(){

    var recordid = $("#recordid").val();
    var productcode = $("#productcode").val();
    $.ajax({
      url: "/api/productview/getProductCode?productcode=" + productcode + "&recordid=" + recordid,  
      headers: {"authorization": "Bearer " + token},
      success: function(result){
        console.log("result ", result);
        if (result == true) {
          $("#product-code").html("Already Exist!").addClass('text-danger').show();
          submitBtn.setAttribute("disabled", "");
        } else {
          $("#product-code").hide();
          submitBtn.removeAttribute("disabled");
        }
        
      }   
    });
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