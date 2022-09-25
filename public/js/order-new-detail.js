/**
 * Order Detail
 */

$(document).ready(function() {
  $('div.sidebar-sticky li.nav-item').removeClass('active');
  $('li#menu-order-new').addClass('active');
  $('div#order_subitems').addClass('show');
  $("#alert").hide();

  $(".avalqty").change(function() {
    $netamount = 0;

    $('span[id^="avalible"]').each(function() {
      var id = $(this).attr("data-id");
      var itemtype = $(this).attr("data-type");
      let avaliblestatus = parseInt($(this).find("input[name='avalible_" + itemtype + "_" + id + "']:checked").val() || 0);
      var qty = 0;
      if (avaliblestatus == 3) {
        console.log(" avaliblestatus == 3 ");
        qty = parseInt($(this).find("input[name='avalible_" + itemtype + "_qty_" + id + "']").val() || 0);
        qty = qty > $("#orderqty_" + id).val() ? $("#orderqty_" + id).val() : qty;
      } else if (avaliblestatus == 1) {
        console.log(" avaliblestatus == 1 ");
        qty = $("#orderqty_" + id).val();
      }
      console.log("org price >> ", $("#price_" + id).val());
      var price = $("#price_" + id).val().split(',').join('');
      var amount = qty * price;
      $netamount += amount;
    });
    // $("#netamount").val($netamount);
    const parts = $netamount.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    console.log("parts[0] ", parts[0]);
    $("#netamount").val(parts[0]);

  });

  $("#btnModelSave").on("click", function(ev) {
    var dateNow = new Date();
    var dateStr = dateNow.getFullYear() + "/" + (dateNow.getMonth() + 1) + "/" + dateNow.getDate();
    var netamount_old = $("#netamount").val();
    var netamount_new = netamount_old.replace(/,/g, "");
    var data = {
      orderid: $("#rowid").val(),
      ordercode: $("#ordercode").val(),
      customerid: $("#customerid").val(),
      status: "reply",
      reply_remark: $('#reply_remark').val(),
      netamount: netamount_new,
      createddate: dateStr,
      updateddate: dateStr
    };
    data.items = [];
    $('span[id^="avalible"]').each(function() {
      var id = $(this).attr("data-id");
      var itemtype = $(this).attr("data-type");
      console.log("itemtype ", itemtype);
      let avaliblestatus = parseInt($(this).find("input[name='avalible_" + itemtype + "_" + id + "']:checked").val() || 0);
      
      var qty = 0;
      var total = 0;
      if (avaliblestatus == 3) {
        qty = parseInt($(this).find("input[name='avalible_" + itemtype + "_qty_" + id + "']").val() || 0);
        qty = qty > $("#orderqty_" + id).val() ? $("#orderqty_" + id).val() : qty;
        console.log("qty if 3 ", qty);
      } else if (avaliblestatus == 1) {
        qty = $("#orderqty_" + id).val();
        console.log("qty if 1 ", qty);
      }
      var price = $("#price_" + id).val().replace(',', '');
      var total = qty * price;
      var i = {
        orderitemid: $("#orderitemid_" + id).val(),
        replyqty: qty,
      };
      if (avaliblestatus != 2) {
        data.items.push(i);
      }
    });
    // console.log("data.items ", data.items);

    $.ajax({
      url: "/order-new/reply",
      method: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: function(data) {
        if (data && data.order_reply && data.order_reply == "success") {
          $("#alertTitle").html("Success");
          $("#alertMessage").html("Reply Success!");
          $("#alert").addClass("alert-success").show();

          $("#btnModelSave").remove();
          location.reload();
        } else {
          $("#alertTitle").html("Error");
          $("#alertMessage").html("Error on save!");
          $("#alert").addClass("alert-danger").show();

          // $("#actionReply").show();
        }
      }
    });
    //- $("#actionReply").remove();
  });
});