var modifyFlag = false;
var progress_flag = false;
//var pre_progress_flag = false;
var progress_list = [];

function sleep(msecs) {
    var start = new Date().getTime();
    var cur = start;
    while(cur - start < msecs) {
        cur = new Date().getTime();
    }
}
var topologyList = [];

$(function() {
    U.ajax({
        progress : true,
        url : '',
        success:function(jsonData) {
//            var statusBuffer = "service_green_iocn";
            if(typeof jsonData.error != "undefined") {
//                U.msg("제목: " + jsonData.error.title + "\n메세지: " + jsonData.error.message);
                U.lobibox(jsonData.error.message, "error", jsonData.error.title);
            // fail
            }
            if(typeof jsonData.success != "undefined") {
                var security_resources = jsonData.success.security_resources;
                $.each(security_resources, function(idx, security) {
                    var security_type = "ips";
                    if (!isEmpty(JSON.parse(security.data.security_types))) {
                        $.each(JSON.parse(security.data.security_types), function(s_i, security_types) {
                            if (!isEmpty(security_types.security_type)) {
                                security_type = security_types.security_type;
                            }
                        });
                    }
                    var securityHtml ="";
                    securityHtml += '<div class="security_card_d01" id="securityCard'+idx+'">';
                    securityHtml += '   <div class="ind_d02">';
                    securityHtml += '       <div class="ind_d05" id="title'+idx+'">';
                    securityHtml += '           <img class="security_card_img01" id="titleImg'+idx+'">';
                    securityHtml += '       </div>';
                    securityHtml += '       <div class="clear_float"></div>';
                    securityHtml += '   </div>';
                    securityHtml += '   <div class="security_card_d02" id="security_img'+idx+'"></div>'
                    securityHtml += '   <table class="security_card_tab01 except-hover table-security" cellpadding="0" cellspacing="0" border="0"></table>';
                    securityHtml += '   <div class="clear_float"></div>';
                    securityHtml += '   <div class="security_card_d03" id="btnDiv">';
                    securityHtml += '       <input type="hidden" class="securityId" id="securityId'+idx+'">';
                    securityHtml += '       <button class="infoBtn btn-custom" id="infoBtn'+idx+'" style="min-width: 100px; padding: 10px 15px; margin-top: 4px;">' + gettext("상세 정보") + "</button>";
                    securityHtml += '       <button class="editBtn btn-custom1" id="editBtn'+idx+'" style="min-width: 100px; padding: 10px 15px; margin-top: 4px;">' + gettext("수정") + "</button>";
                    securityHtml += '       <button class="delBtn btn-cancel" id="delBtn'+idx+'" style="min-width: 100px; padding: 10px 15px; margin-top: 4px; margin-right: 0px;">' + gettext("삭제") + "</button>";
                    // securityHtml += '       <img src="/static/img/common/btn/info_bt_01.png" class="infoBtn" id="infoBtn'+idx+'" alt="#">';
                    // securityHtml += '       <img src="/static/img/common/btn/edit_bt_01.png" class="editBtn" id="editBtn'+idx+'" alt="#">';
                    // securityHtml += '       <img src="/static/img/common/btn/del_bt_01.png" class="delBtn" id="delBtn'+idx+'" alt="#">';
                    securityHtml += '   </div>';
                    securityHtml += '</div>';
                    $(".contents").append(securityHtml);
                    $("#title"+idx).append(security.security_name);
                    $("#infoBtn"+idx).on('click', function() {
                        detail(security);
                    });

                    var dataTable = new DataTable({
                        "selector" : "#securityCard"+idx,
                        "columns"  : {
                            "software_version"  : '<img class="br_img03" src="/static/img/common/br_img_03.png" alt="#">' + gettext('버전'),
                            "manufacturer_name" : '<img class="br_img03" src="/static/img/common/br_img_03.png" alt="#">' + gettext('제조사'),
                            "security_type" : '<img class="br_img03" src="/static/img/common/br_img_03.png" alt="#">' + gettext('유형'),
                            "insdate" : '<img class="br_img03" src="/static/img/common/br_img_03.png" alt="#">' + gettext('등록일')
                        },
                        "data" : security,
                        "vertical" : true
                    });
                    dataTable.showDataTable();
                    $(".table-security").each(function(i, tableSecurity) {
                        $(tableSecurity).find("th:eq(0)").attr("title", gettext('버전'));
                        console.log($(tableSecurity).find("th:eq(0)"));
                        $(tableSecurity).find("th:eq(1)").attr("title", gettext('제조사'));
                        $(tableSecurity).find("th:eq(2)").attr("title", gettext('유형'));
                        $(tableSecurity).find("th:eq(3)").attr("title", gettext('등록일'));
                    });
                    $(".table-security th").attr('class', 'security_card_td01');
                    $(".table-security td").attr('class', 'security_card_td02');
                    $("#securityId"+idx).text(security.security_id);
                    $("#titleImg"+idx).attr("src","/static/img/common/title_" + security_type + "_icon_01.png");
                    $("#securityCard" + idx + " .security_card_td02:eq(2)").text(security_type.toUpperCase());
                    replaceAllDateTimeFormatFromTD("#securityCard" + idx + " .security_card_td02:eq(3)");
                    if (!isEmpty(security.manufacturer_icon)) {
                        $("#securityCard" + idx + " .security_card_td02:eq(1)").html("<img src='" + security.manufacturer_icon + "' style='height:15px;'>");
                    }
                    if (isEmpty(security.security_icon)) {
                        $("#security_img"+idx).css({"background":"url(/static/img/common/bg_" + security_type + "_icon_01.png)", 'background-repeat':'no-repeat', 'background-position':'center center'});
                    } else {
                        $("#security_img"+idx).css({
                            "background":"url(" + security.security_icon + ")",
                            'background-repeat':'no-repeat',
                            'background-position':'center center',
                            'background-size': '100%' // cover:꽉차지만 잘림, container:꽉차지만 공백있음
                        });
                    }
                });
                $(".editBtn").on("click", function() {
                    var security_id = $(this).prevAll(".securityId").text();
                    location.href = "/dashboard/security/" + security_id + "/modify";
                });
                $(".delBtn").on("click", function() {
                    var id = $(this).prevAll(".securityId").text();
                    U.confirm({
                        title:"삭제",
                        message:"삭제하시겠습니까?",
                        func:function() {
                            U.ajax({
                                url: "/dashboard/security/" +id+ "/delete",
                                success:function(jsonData) {
                                    if (typeof jsonData.success != "undefined") {
                                        location.reload();
                                    }
                                }
                            });
                        }
                    });
                });
//                $(".action").on("click", function() {
//                    U.lobiboxMessage("준비중입니다.", "info");
//                });
            } // success
        }
        // end success
    });

    $("#detail").on("click", ".xml-detail", function() {
        if ($("#detail .tr-capability-contents").is(":visible")) {
            $("#detail .tr-capability-contents").hide();
        } else {
            $("#detail .tr-capability-contents").show();
        }
    });
    $("#detail").on("click", ".xml-send", function() {
        var xmlPath = $("#detail .capability-xml").data("xml_path");
        U.ajax({
            url: "/dashboard/security/capability/send",
            data: {"capability_xml": xmlPath},
            success: function(result) {
                if (result.success) {
                    U.lobiboxMessage(result.success.message, "info", result.success.title);
                } else {
                    U.lobiboxErrorMessage(result);
                }
            }
        });
    });
});
function detail(security) {
    var description = security.description;
    description = description.replaceAll("\n","</br>");

    $("#detail .security_description").html(description.replace(/\n/g, "<br/>"));
    $("#detail").css("text-align", "left");
    $("#detail .security_image").text(security.image_name);
    if (security.capability_xml) {
        $("#detail_modal .modal-container").width(640);
        $("#detail_modal .security_info_pop_tab01").width(584);
        var capabilityXml = security.capability_xml.split("/").pop();
        $("#detail .tr-capability").show();
        $("#detail .capability-xml").data("xml_path", security.capability_xml);
        $("#detail .capability-xml").text(capabilityXml);
        $("#detail .capability-contents").html(security.xml_contents.replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br/>").replaceAll("    ", "&nbsp;&nbsp;&nbsp;&nbsp;"));
    } else {
        $("#detail_modal .modal-container").width(510);
        $("#detail_modal .security_info_pop_tab01").width(454);
        $("#detail .tr-capability").hide();
        $("#detail .tr-capability-contents").hide();
        $("#detail .capability-xml").text("");
        $("#detail .capability-contents").html("");
    }
    $("#modalTitle").text(security.security_name);
    $("#detail_modal").modal();
}