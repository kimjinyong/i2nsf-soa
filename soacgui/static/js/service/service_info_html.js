var modalUtil = new ModalUtil();
var service = {
    name: "",
    description: "",
    policy_list: [],
    vrouter_list: [],
    network_list: [],
    vm_template_list: [],
    auto_scaling_list: [],
    loadbalancer_list: [],
    volume: []
};

function deletePolicyHtml(elem) {$(elem).parent().remove();}

/*function appendPolicyHtml() {
    var serviceInfoHtml = "";
    serviceInfoHtml += "<div class='policy_group center-block' style='max-width:600px;'>";
    serviceInfoHtml += getInputHtmlForResource("title", {text:"이름"});
    serviceInfoHtml += getInputHtmlForResource("input", {it:"text", key:"policy_name", io:"placeholder='이름'"});
    serviceInfoHtml += getInputHtmlForResource("title", {text:"정책", attr:"style='float:left; padding-top:8px;'"});
    var comboItem = [{"ANTI-AFFINITY":"ANTI-AFFINITY"}, {"AFFINITY":"AFFINITY"}];
    serviceInfoHtml += getInputHtmlForResource("combo",{item:comboItem, key:"policy"});
    serviceInfoHtml += getInputHtmlForResource("title", {text:"적용 대상 가상머신"});
    serviceInfoHtml += getInputHtmlForResource("select",{key:"server_name", io:"placeholder='가상 네트워크를 연결하세요.'"});
    serviceInfoHtml += getInputHtmlForResource("custom", {class:"clear_float"});
    serviceInfoHtml += "<button onclick=\"deletePolicyHtml(this)\" style='background-color:#bbb;width:50px;height:30px;'>삭제</button>";
    serviceInfoHtml += getInputHtmlForResource("custom", {class:"clear_float"});
    serviceInfoHtml += "</div>";
    $("#policy_for_create_vm").append(serviceInfoHtml);
}*/


function dropdownEventModal(sel, key, value){
//    console.log($(sel).parents("ul").siblings("button"));
//    console.log($(sel).parent().siblings("button").html());
    $(sel).parents("ul").siblings("button").html('<span class="caret" style="float:right;margin-top:8px;"></span><span style="width:310px;float:right;text-align:center;">' + key + '</span>');
    $(sel).parents("ul").siblings("input").val(value);
}

function appendVMIntoPolicyList(elem, vm_name) {
    $(elem).parents("table").siblings("select").append("<option>" + vm_name + "</option>");
    $(elem).parents("tr").remove();
}

function showPolicyHtml(elem) {
    var appendedPolicyList = [];
    $.each($(elem).siblings("select").children(), function(index, element) {
        appendedPolicyList.push(element.text);
    });
    // 적용 대상 가상머신 - + 가상머신 추가
    var resource_VM = nodes.filter(function(d) {
        return d.resource_type == VM;
    });
    var tbodyHtml = "";
    var tdClass = ["rs_td02", "rs_td03"]
    for (var i = 0; i < resource_VM.length; i++) {
        if (appendedPolicyList.indexOf(resource_VM[i].name) == -1) {
//            tbodyHtml += "<tr><td class='td_nm'>" + resource_VM[i].name + "</td><td class='td_bt'><button type='button' class='btn btn-success' onclick=\"appendVMIntoPolicyList(this,\'" + resource_VM[i].name + "\')\"><i class='icon-trash'></i>추가</button></td></tr>";
            tbodyHtml += "<tr><td class='td_nm " + tdClass[i%2] + "'>" + resource_VM[i].name + "</td>";
            tbodyHtml += "<td class='td_bt " + tdClass[i%2] + "'>";
            tbodyHtml += "<button type='button' class='btn btn-success' onclick=\"appendVMIntoPolicyList(this,\'" + resource_VM[i].name + "\')\">추가</button>";
            tbodyHtml += "</td></tr>";
        }
    }
    $(elem).siblings("table").children("tbody").html(tbodyHtml);
}

function addVMIntoPolicy(elem) {
    if($(elem).siblings("table").attr("hidden") == "hidden"){
        showPolicyHtml(elem);
        $(elem).attr("src", "/static/img/dashboard/service/list_close_bt_01.png");
        $(elem).siblings("table").removeAttr("hidden");
    } else {
        $(elem).attr("src", "/static/img/dashboard/service/list_open_bt_01.png");
        $(elem).siblings("table").attr("hidden","");
    }
}

function removeVMinPolicy(elem) {
    var selected_vm = $(elem).siblings("select").children("option:selected");
    $.each(selected_vm, function(index, el){el.remove();});
    showPolicyHtml(elem);
}

/*var policyCnt = 0;
var policy_list = [];*/
function appendPolicyHtml() {
    //가상머신 생성 정책 정의 - + 정책 추가
    var policyHtml = $("#append_policy_html").html();
//    policyHtml += '<div class="policy_group center-block" style="max-width:600px;">';
//    policyHtml += '    <div class="pop02_d02">';
//    policyHtml += '        <input class="pop01_text01" name="policy_name" type="text" placeholder="이름">';
//    policyHtml += '    </div>';
//    policyHtml += '    <div class="pop01_d03"><div class="clear_float"></div><label class="pop01_d02 control-label">정책</label>';
//    policyHtml += '        <div class="inline_btn" style="float:right;width:350px;"><div class="btn-group btn-block ">';
//    policyHtml += '        <button type="button" class="btn btn-default dropdown-toggle btn-block service1" data-toggle="dropdown" aria-expanded="false">';
//    policyHtml += '        <span class="caret" style="float:right;margin-top:8px;"></span><span style="width:310px;float:right;text-align:center;">ANTI-AFFINITY</span></button>';
//    policyHtml += '        <ul class="dropdown-menu dropdown-menu-right" role="menu" style="width:350px;">';
//    policyHtml += '        <li><a href="#" onclick="dropdownEventModal(this, \'ANTI-AFFINITY\', \'ANTI-AFFINITY\')">ANTI-AFFINITY</a></li>';
//    policyHtml += '        <li><a href="#" onclick="dropdownEventModal(this, \'AFFINITY\', \'AFFINITY\')">AFFINITY</a></li>';
//    policyHtml += '        </ul><input name="policy" value="ANTI-AFFINITY" type="hidden">';
//    policyHtml += '        </div></div>';
//    policyHtml += '    <div class="clear_float"></div></div>';
//    policyHtml += '    <div class="pop01_d03">';
//    policyHtml += '        <div class="pop01_d02">';
//    policyHtml += '            <span style="margin-right:55px;">적용 대상 가상머신</span>';
//    policyHtml += '            <button onclick="addVMIntoPolicy(this)" class="btn btn-primary openclose" style="margin-right:10px;"><i class="icon-arrow-down"></i> 목록열기</button>';
//    policyHtml += '            <button onclick="removeVMinPolicy(this)" class="btn removevm"><i class="icon-trash"></i>가상머신 제거</button>';
//    policyHtml += '        </div>';
//    policyHtml += '        <table hidden class="table table-bordered table-striped service"></table>';
//    policyHtml += '        <div class="clear_float"></div>';
//    policyHtml += '        <select class="form-control service_select" multiple name="server_name"></select>';
//    policyHtml += '        <div class="clear_float"></div>';
//    policyHtml += '    </div>';
//    policyHtml += "    <button onclick=\"deletePolicyHtml(this)\" class='btn deletediv'><i class='icon-trash'></i>삭제</button>";
//    policyHtml += '    <div class="clear_float"></div>';
//    policyHtml += '    <div class="pop01_d03"></div>';
//    policyHtml += '</div>';
    $("#policy_for_create_vm").append(policyHtml);
}



$(function(){
    var urlStr = $(location).attr('pathname');
    var match = new RegExp("/dashboard/service/([\\w-]+)/.*").exec(urlStr);
    var service_id = match[1];
    $("#chainTab").attr("href", "/dashboard/service/" +service_id + "/chaining");
    $("#telemeterTab").attr("href", "/dashboard/telemeter/" +service_id + "/detail");
    $("#routingTab").attr("href", "/dashboard/service/" +service_id + "/routing");
    getServiceAjax();

    $("#saveBtn").on("click", function() {
        if ($(".right_pop").is(":visible")) {
            var confirmData = {
                title: gettext("저장하기"),
                message: gettext("입력중인 정보창이 닫혀있지 않습니다.<br/><br/>저장하시겠습니까?"),
                func:function() {
                    $("#resource_update").trigger("click");
                    submitSaveService();
                },
                cancelFunc:function() {
                    selected_link = null;
                    selected_node = null;
                    showNodeInfo();
                    restart();
                    submitSaveService();
                }
            };
            var rType = selected_node.resource_type;
            confirmInfoPop(rType, confirmData);
        } else {
            submitSaveService();
        }
    });

    $(".modal-content.login_d01").css("width","420px");
});

function submitSaveService() {
    // $("table").attr("hidden", "");
    modalUtil.setOption({
        "selector":"#modal",
        "width":"558px",
        "title": gettext("서비스 생성"),
        "body":"#modalServiceBody",
        "footer":"#modalServiceFooter"
    });
    modalUtil.bindHtml();

    if (modifyFlag) {
        $("input[name=service_name]").val(service.name);
        $("textarea[name=description]").val(service.description);
        $("input[name=service_name]").attr("disabled", true);
        $("textarea[name=description]").attr("disabled", true);
    }
    $("#append_policy").unbind("click");
    $('#append_policy').click(function () {appendPolicyHtml()});
    $("#modal").modal();
    // $(".right_pop").show();
    $("#submit").on("click");
    $("#submit").on("click", function() {
        var name = $("input[name=service_name]").val();
        var check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        if(check.test(name)) {
            U.msg(gettext("이름은 영어로 입력하세요."));
            return;
        }
        var description = $("textarea[name=description]").val();
        var policy_list = [];
        var policyGroupTag = $("#policy_for_create_vm .policy_group");
        policyGroupTag.each(function() {
            var policy_name = $(this).find("input[name=policy_name]").val();
            var policy = $(this).find("select[name=policy] option:selected").val();
            var select_server_name = $(this).find("select[name=server_name] option");
            var server_name = [];
            select_server_name.each(function(i, v){
               server_name.push($(v).val());
            });
            // console.log(server_name);
            // U.msg(server_name);
            var policy_map = {policy_name: policy_name, policy: policy, server_name: server_name};
            policy_list.push(policy_map);
        });
        service = {
            name: name,
            description: description,
            policy_list: policy_list,
            vrouter_list: [],
            network_list: [],
            vm_template_list: [],
            auto_scaling_list: [],
            loadbalancer_list: [],
            volume: []
        };
        saveServiceAjax();
    });
}