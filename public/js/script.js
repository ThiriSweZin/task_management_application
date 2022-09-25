/**
 * Scripts
 */
function dataTableIndexRenderer() {
  return function(d, type, row, meta) {
    return parseInt('' + meta.row) + 1;
  };
}

function dataTableLogoRenderer() {
  return function(d, type, row) {
    var html = '<img src="' + row.logo + '" height="30px" weight="100px" title="" alt="" />';
    return html;
  }
}

function dataTableImageRenderer() {
  return function(d, type, row) {
    var html = '<img src="' + row.imageurl + '" height="30px" weight="100px" title="" alt="" />';
    return html;
  }
}

function dataTableNetPriceWithCommas() {
  return function(d, type, row) {
    var parts = row.netprice.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTablePriceWithCommas() {
  return function(d, type, row) {
    var parts = row.price.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableNetAmountWithCommas() {
  return function(d, type, row) {
    var parts = row.netamount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

// for monthly order report => Total Net Amount
function TotalNetAmountWithCommas(amount) {
  // return function(d, type, row) {
    var parts = amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  // }
}

function dataTablenumberWithViewCount() {
  return function(d, type, row) {
    var vc = row.viewcount;
    if (vc > 1000000) {
      vc = vc / 1000000 + "M";
    } else if (vc > 1000) {
      vc = vc / 1000 + "K";
    }
    return vc;
  }
}

function dataTableAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.amount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableDisAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.discodeamount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableCusDisAmtWithCommas() {
  return function(d, type, row) {
    var parts = row.customerdisamount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    var customerdis = parts.join(".") + " ( " + row.customerpercent + "% )";
    return customerdis;
  }
}

function dataTableDeliFeeWithCommas() {
  return function(d, type, row) {
    var parts = row.deliveryfees.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableUnitPriceWithCommas() {
  return function(d, type, row) {
    var parts = row.unitprice.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}

function dataTableActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-warning list-action" href="./' +
      editUrl +
      "/" +
      id +
      '" title="Edit"><i class="fa fa-edit"></i></a> ';
    if (me[2] == "1")
      html +=
      '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    data-loading-text="Deleting …" data-id="' +
      id +
      '" title="Delete"><i class="fa fa-trash"></i></a>';
    return html;
  };
}

function dataTableActionsPriceRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogPriceConfirm" \
    data-loading-text="Updating Price …" data-id="' +
      id +
      '" title="Change Price"><i class="fas fa-coins"></i></a>';
    return html;
  };
}

function dataTableActionsRendererOld(editUrl) {
  console.log("editUrl ", editUrl);
  return function(d, type, row) {
    const id = row.id || "#";
    return '<a class="btn btn-warning list-action" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
    <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  };
}

function dataTableActionsRendererNew(editUrl) {
  console.log("editUrl ", editUrl);
  return function(d, type, row) {
    const id = row.id || "#";
    return '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogUnlockConfirm" \
    data-loading-text="Activating …" data-id="' + id + '" title="Status"><i class="fa fa-unlock"></i></a> \
    <a class="btn btn-warning list-action" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
    <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  };
}

function dataTableUnlockRenderer() {
  return function(d, type, row) {
    const id = row.id || "#";
    const status = row.status;
    console.log("status ", status);
    if(status === 1){
      return '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogUnlockConfirm" \
      data-loading-text="Activating …" data-id="' + id + '" title="Status"><i class="fa fa-lock"></i></a>';
    } else {
      return '<a class="btn btn-primary list-action" role="button" data-toggle="modal" data-target="#dialogUnlockConfirm" \
      data-loading-text="Activating …" data-id="' + id + '" title="Status"><i class="fa fa-unlock"></i></a>';
    }
  };
}

function dataTableEditOnlyActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    var html = "";
    if (me[0] == "1" && me[1] == "1")
      html +=
      '<a class="btn btn-warning list-action" href="./' +
      editUrl +
      '/' +
      id +
      '" title="Edit"><i class="fa fa-edit"></i></a>';
    return html;
  };
}

function dataTableCustomerIsActive() {
  return function(d, type, row) {
    var html = "";
    var id = row.id || "#";
    console.log("id ", id);
    console.log("is active ", row.is_active);
    if (row.is_active == 1)
      html +=
      '<a class="list-action" role="button" data-toggle="modal" data-target="#dialogInactiveConfirm" \
    data-loading-text="In Active …" data-id="' +
      id +'" title="Broken"><i class="active fa fa-circle"></i></a>';
    else
      html +=
      '<a class="list-action" role="button" data-toggle="modal" data-target="#dialogActiveConfirm" \
    data-loading-text="Active …" data-id="' +
      id +
      '" title="Broken"><i class="inactive fa fa-circle"></i></a>';
    
    return html;
  }
}
function dataTableDetailActionsRenderer(detailUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    var html = "";
    if (me[1] == "1")
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '" title="Detail"><i class="fa fa-list"></i></a>'
    return html;
  };
}

// for order delivery entry
function dataTableDeliveryDetailActionsRenderer(detailUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    var html = "";
    if (me[1] == "1")
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '" target="_blank" title="Detail"><i class="fa fa-list"></i></a>'
    return html;
  };
}

function dataTableFeedbackActionsRenderer(detailUrl, access) {
  var images_string;
  var images_array = [];
  var me = access.split(",");
  console.log("me ", me);
  return function(d, type, row) {
    const id = row.id || "#";
    var html = "";
    if(row.images){
      images_string = row.images;
      images_array = images_string.split(',');
      html +=
      '<a class="btn btn-info list-action" href="./feedback/image/' +
      id +
      '" title="View Images"><span class="bubble">' +
      images_array.length + '</span><i class="fa fa-image"></i></a> ';
    } else {
      html +=
      '<a class="btn btn-secondary list-action" title="No Images"><i class="fa fa-image"></i></a> ';
    }
    if (me[1] == "1") {
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '" title="Detail"><i class="fa fa-list"></i></a>'
    }
    return html;
  };
}

function dataTableDeliveryActionsRenderer(detailUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    const deliveryid = row.orderdeliveryid;
    var html = "";
    if (me[1] == "1")
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '/' +
      deliveryid +
      '" title="Detail"><i class="fa fa-list"></i></a>'
    return html;
  };
}

function dataTableReportDetailActionsRenderer(detailUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    var html = "";
    if (me[1] == "1")
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '" target="_blank" title="Detail"><i class="fa fa-list"></i></a>'
    return html;
  };
}

function dataTableMonthlyReportDetailActionsRenderer(detailUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    const id = row.id || "#";
    const status = row.status;
    var html = "";
    if (me[1] == "1")
      html += '<a class="btn btn-warning list-action" href="./' +
      detailUrl +
      '/' +
      id +
      '/' + status +
      '" target="_blank" title="Detail"><i class="fa fa-list"></i></a>'
    return html;
  };
}

function dataTableActionsImageRenderer(editUrl, imageEditUrl) {
  return function(d, type, row) {
    const id = row.id || "#";
    return '<a class="btn btn-secondary list-action" href="./' + imageEditUrl + '/' + id + '" title="Edit Images"><i class="fa fa-image"></i></a> \
    <a class="btn btn-warning list-action" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
    <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
      data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  };
}

function dataTableBundleActionsRenderer(editUrl, access) {
  var me = access.split(",");
  return function(d, type, row) {
    var id = row.id || "#";
    var html = "";
    if (row.type == 0) {
      if (me[0] == "1" && me[1] == "1") {
        console.log("images length ", row.images.length);
        if (row.images.length > 0)
          html +=
          '<a class="btn btn-info list-action" href="./bundle/image/' +
          id +
          '" title="Edit Images"><span class="bubble">' +
          row.images.length + '</span><i class="fa fa-image"></i></a> ';
        else
          html +=
          '<a class="btn btn-secondary list-action" href="./bundle/image/' +
          id +
          '" title="Edit Images"><i class="fa fa-image"></i></a> ';
        html +=
          '<a class="btn btn-warning list-action" href="./' +
          editUrl +
          "/" +
          id +
          '" title="Edit"><i class="fa fa-edit"></i></a> ';
        if (me[2] == "1")
          html +=
          '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
        data-loading-text="Deleting …" data-id="' +
          id +
          '" title="Delete"><i class="fa fa-trash"></i></a>';
      }
    } else {
      if (me[0] == "1" && me[1] == "1")
        html +=
        '<a class="btn btn-warning list-action" href="./' +
        editUrl +
        "/" +
        id +
        '" title="Edit"><i class="fa fa-edit"></i></a> ';
      if (me[2] == "1")
        html +=
        '<a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
    data-loading-text="Deleting …" data-id="' +
        id +
        '" title="Delete"><i class="fa fa-trash"></i></a>';
    }
    return html;
  };

  // return function(d, type, row) {
  //   const id = row.id || "#";
  //   if (row.type == 0) {
  //     return '<a class="btn btn-info list-action" href="./bundle/image/' + id + '" title="Edit Images"><i class="fa fa-image"></i></a> \
  //       <a class="btn btn-warning list-action ' + '" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
  //       <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
  //         data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  //   } else {
  //     return '<a class="btn btn-warning list-action" href="./' + editUrl + '/' + id + '" title="Edit"><i class="fa fa-edit"></i></a> \
  //       <a class="btn btn-danger list-action" role="button" data-toggle="modal" data-target="#dialogDeleteConfirm" \
  //         data-loading-text="Deleting …" data-id="' + id + '" title="Delete"><i class="fa fa-trash"></i></a>';
  //   }

  // };
}

function dataTableStatusRenderer() {
  return function(d, type, row, meta) {
    var result = '';
    if (/new/i.test(d)) {
      result = '<span class="badge badge-new-order">' + d + '</span>';
    } else if (/accept(ed|)/i.test(d)) {
      result = '<span class="badge badge-accept">' + d + '</span>';
    } else if (/approve(d|)/i.test(d)) {
      result = '<span class="badge badge-approved">' + d + '</span>';
    } else if (/replied|reply|(on|on\s)going/i.test(d)) {
      result = '<span class="badge badge-reply">' + d + '</span>';
    } else if (/reject(ed|)|cancel/i.test(d)) {
      result = '<span class="badge badge-reject">' + d + '</span>';
    } else if (/complete(d|)|paid|deliver(ed|)/i.test(d)) {
      result = '<span class="badge badge-delivered">' + d + '</span>';
    } else {
      result = '<span>' + d + '</span>';
    }
    return result;
  };
}

function dataTableBundleType() {
  return function(d, type, row) {
    if (row.type == 0)
      return "whole";
    else
      return "split";
  }
}

function dataTableBoolean() {
  return function(d, type, row) {
    if (row.isused == 0)
      return "No";
    else
      return "Yes";
  }
}

function dataTableAvailable() {
  return function(d, type, row) {
    if (row.available == 0)
      return "No";
    else
      return "Yes";
  }
}

function dataTableDateRenderer() {
  return $.fn.dataTable.render.date('YYYY-MM-DD', 'DD/MM/YYYY');
}

function dataTableDateTimeRenderer() {
  return $.fn.dataTable.render.date('YYYY-MM-DD HH:mm', 'DD/MM/YYYY HH:mm');
}

function doDelete(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (typeof data !== 'undefined' && typeof data.data == 'string') {
          $('#delErrorMsg').html(data.data);
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertDeleteError').show();

        } else if (typeof data === 'undefined' || data.data == 0) {
          $('#delErrorMsg').html('Cannot delete. Already Used!');
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertDeleteError').show();

        } else if (data.error) {
          $('#delErrorMsg').html('Can not delete data.');
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertDeleteError').show();
        } else {
          $('#alertDeleteError').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertDeleteSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doUnlock(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (typeof data !== 'undefined' && typeof data.data == 'string') {
          $('#delErrorMsg').html(data.data);
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertUnlockError').show();

        } else if (typeof data === 'undefined' || data.data == 0) {
          $('#delErrorMsg').html('Cannot unlock.');
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertUnlockError').show();

        } else if (data.error) {
          $('#delErrorMsg').html('Cannot unlock');
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertUnlockError').show();
        } else {
          $('#alertDeleteError').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertUnlockSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doActive(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (typeof data !== 'undefined' && typeof data.data == 'string') {
          $('#delErrorMsg').html(data.data);
          $('#alertActiveSuccess').hide();
          $('#alertActiveError').show();

        } else if (typeof data === 'undefined' || data.data == 0) {
          $('#delErrorMsg').html('Cannot Active. Already Used!');
          $('#alertActiveSuccess').hide();
          $('#alertActiveError').show();

        } else if (data.error) {
          $('#delErrorMsg').html('Cannot Active. Already Used!');
          $('#alertActiveSuccess').hide();
          $('#alertActiveError').show();
        } else {
          $('#alertActiveError').hide();
          $('#alertDeleteError').hide();
          $('#alertDeleteSuccess').hide();
          $('#alertInActiveSuccess').hide();
          $('#alertActiveSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function doInActive(url, token, successCallback) {
  if (typeof url === 'string' && url != '') {
    $.ajax({
      "url": url,
      "type": "post",
      "headers": { "authorization": "Bearer " + token },
      "success": function(data) {
        if (typeof data !== 'undefined' && typeof data.data == 'string') {
          $('#delErrorMsg').html(data.data);
          $('#alertInActiveSuccess').hide();
          $('#alertInActiveError').show();

        } else if (typeof data === 'undefined' || data.data == 0) {
          $('#delErrorMsg').html('Cannot InActive. Already Used!');
          $('#alertInActiveSuccess').hide();
          $('#alertInActiveError').show();

        } else if (data.error) {
          $('#delErrorMsg').html('Cannot InActive. Already Used!');
          $('#alertInActiveSuccess').hide();
          $('#alertInActiveError').show();
        } else {
          $('#alertInActiveError').hide();
          $('#alertDeleteError').hide();
          $('#alertDeleteSuccess').hide();
          $('#alertActiveSuccess').hide();
          $('#alertInActiveSuccess').show();

          if (typeof successCallback === 'function') {
            successCallback();
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        alert(errorThrown);
      }
    });
  }
}

function numberWithCommas(number) {
  var parts = number.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function showImage(container, eleValue) {
  var $elm = $(container);
  var $input = $(eleValue);

  var $uploadInput = $elm.find('#' + $input.attr('id') + 'File');
  if (!$uploadInput[0]) {
    $uploadInput = $('<input>', {
      id: $input.attr('id') + 'File',
      type: 'file',
      style: "display: none;",
      multiple: ""
    });
    $elm.append($uploadInput);
  }

  var imageUrl = $input.val();

  if (imageUrl != '') {
    $elm.find('.image-add-continer').hide();
    $elm.find('.form-image-preview').attr('src', '/file/stream?file=' + imageUrl);
  } else {
    $elm.find('.image-preview-container').hide();
  }
}

function show_sub(id) {
  console.log("id ", id);
  $("#" + id).slideToggle("down", function() {
    $(this).toggleClass("show");
  });
}

function clickEvent(date, month, year, offday, sabbath) {
  const day = date + '/' + month + '/' + year;
  $("#day").val(day);
  $("#name").val(offday);
  if (sabbath == "" || offday != "") {
    $('#modalHoliday').modal('show');
  }
}

// function clickEvent(data) {
//   console.log("data ", data);
//   console.log("json data ", JSON.parse(data));
// }

// function clickEvent(event) {
//   console.log("data ", data);
//   const day = data.date + '/' + data.month + '/' + data.year;
//   $("#day").val(day);
//   $("#name").val(data.offday);
//   $('#modalHoliday').modal('show');
// }

function isValidEmail(email) {
  return /^([a-zA-Z])+([a-zA-Z0-9_.+-])+\@(([a-zA-Z])+\.+?(com|co|in|org|net|edu|info|gov|vekomy))\.?(com|co|in|org|net|edu|info|gov)?$/.test(email);
}

$(function() {
  $('[data-hide="alert"]').on('click', function() {
    $(this).closest('div.alert').hide();
  });

  $('input[role="number"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d.]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="phone"]').on('keydown', function(e) {
    //alert(e.keyCode);
    // Allow: backspace, delete, tab, escape, enter, comma, space and dash
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 188, 32, 173]) !== -1 ||
      // Allow: Plus
      (e.keyCode === 61 && e.shiftKey === true) ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="time"]').on('keydown', function(e) {
    //alert(e.keyCode);
    // Allow: backspace, delete, tab, escape, enter and .
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
      // Allow: colon
      (e.keyCode === 59 && e.shiftKey === true) ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+[:\.][\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[role="date"]').on('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter and slash
    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 191]) !== -1 ||
      // Allow: Ctrl+A, Command+A
      (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  }).on('paste', function(e) {
    // Get pasted data via clipboard API
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text').toUpperCase();
    if (!(/^[\d/]+/.test(pastedData))) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  $('input[editable="false"]').on('keydown paste input propertychange', function(e) {
      e.stopPropagation();
      e.preventDefault();
    })
    .attr('autocomplete', 'off')
    .attr('tabIndex', -1)
    .attr('focusable', false);

  var nowDate = new Date(Date.now());
  $('input.date').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on('hide', function(e) {
    if (typeof e.date == 'undefined' && $(this).val() == '') {
      $(this).val(window.date.format(nowDate, "DD/MM/YYYY"));
    }
  });

  $('input.fromdate').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on("changeDate", function(e) {
    var toid = $(this).attr('to');
    if (typeof toid !== 'undefined' && toid != '') {
      $("input[id='" + toid + "']").datepicker('setStartDate', e.date);
    } else {
      $("input.todate").datepicker('setStartDate', e.date);
    }
  });

  $('input.todate').datepicker({
    format: "dd/mm/yyyy",
    autoclose: true,
    todayHighlight: true,
    orientation: 'bottom'
  }).on("changeDate", function(e) {
    var fromid = $(this).attr('from');
    if (typeof fromid !== 'undefined' && fromid != '') {
      $("input[id='" + fromid + "']").datepicker('setEndDate', e.date);
    } else {
      $("input.fromdate").datepicker('setEndDate', e.date);
    }
  });

  $('input.fromtime').timepicker({
    icons: {
      up: 'fas fa-angle-up',
      down: 'fas fa-angle-down'
    }
  }).on("changeTime", function(e) {
    var toid = $(this).attr('to');
    console.log("toid ", toid);
    if (typeof toid !== 'undefined' && toid != '') {
      $("input[id='" + toid + "']").timepicker('setStartTime', e.time);
    } else {
      $("input.totime").timepicker('setStartTime', e.time);
    }
  });

  $('input.totime').timepicker({
    icons: {
      up: 'fas fa-angle-up',
      down: 'fas fa-angle-down'
    },
  }).on("changeTime", function(e) {
    var fromid = $(this).attr('from');
    if (typeof fromid !== 'undefined' && fromid != '') {
      $("input[id='" + fromid + "']").timepicker('setEndTime', e.time);
    } else {
      $("input.fromtime").timepicker('setEndTime', e.time);
    }
  });
});

$(document).ready(function() {
  $('#list-dashboard').on('error.dt', function(e, settings, techNote, message) {
    console.log('DataTables Error: ', message);
    alert('Read data error!');
  }).DataTable({
    data: [
      ["1,001", "Lorem", "ipsum", "dolor", "sit"],
      ["1,002", "amet", "consectetur", "adipiscing", "elit"],
      ["1,003", "Integer", "nec", "odio", "Praesent"],
      ["1,003", "libero", "Sed", "cursus", "ante"],
      ["1,004", "dapibus", "diam", "Sed", "nisi"],
      ["1,005", "Nulla", "quis", "sem", "at"],
      ["1,006", "nibh", "elementum", "imperdiet", "Duis"],
      ["1,007", "sagittis", "ipsum", "Praesent", "mauris"],
      ["1,008", "Fusce", "nec", "tellus", "sed"],
      ["1,009", "augue", "semper", "porta", "Mauris"],
      ["1,010", "massa", "Vestibulum", "lacinia", "arcu"],
      ["1,011", "eget", "nulla", "Class", "aptent"],
      ["1,012", "taciti", "sociosqu", "ad", "litora"],
      ["1,013", "torquent", "per", "conubia", "nosa"],
      ["1,014", "per", "inceptos", "himenaeos", "Curabitur"],
      ["1,015", "sodales", "ligula", "in", "libero"]
    ],
    columns: [
      { title: "#" },
      { title: "Header" },
      { title: "Header" },
      { title: "Header" },
      { title: "Header" }
    ],
    "columnDefs": []
  });
});