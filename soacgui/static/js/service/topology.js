// set up SVG for D3
// set up initial nodes and links
// 설정 초기 노드와 링크
//  - nodes are known by 'id', not by index in array.
// - nodes 는 배열의 인덱스가 아니라, 'ID' 로 알려져있다.
//  - reflexive edges are indicated on the node (as a bold black circle).
// - reflexive : 가장자리 ( 굵은 검은 색 원으로 ) node 에 표시됩니다.
//  - links are always source < target; edge directions are set by 'left' and 'right'.
// - links 는 항상 source < target; 가장자리 방향은 '왼쪽'과 '오른쪽' 으로 설정됩니다.


var re = new RegExp("/dashboard/service?/(\\w+)");
var re1 = new RegExp("/dashboard/service?/[\\w-]+/(\\w+)");
var urlStr = $(location).attr('pathname').replace("/intent", "");
var new_service_url = urlStr.replace(re, "$1").replace("/","");
var modify_service_url = urlStr.replace(re1, "$1").replace("/","");
var security_resources = [];
var security_types = [];
var availabilityZoneList = null;
var modifyBtnSrc = "/static/img/dashboard/service/service_save_bt_01.png";
var reload = null;
var revoked_token = false;
var tempAsLinks = [];

function nodeOnClickEvent(d, e) {
    $(".actionPopUp").offset({top: e.clientY, left: e.clientX});
    $(".actionPopUp").slideDown("fast");
    setResourceMenu(d);
}
var temp_id = 0;
function loadNode(data, key, x=1, y=1) {
    x = parseInt(Math.random() * width / 2) + parseInt(width /4);
    y = parseInt(Math.random() * height / 2) + parseInt(height /4);
    var id;
    var name;
    var resource_type;
    switch(key) {
        case INTERNET:
            id = data.id;
            name = data.name;
            resource_type = INTERNET
            break;
        case "volume":
        case "volume_list": // TODO: 볼륨은 리스트가아님?
            id = data.volume_id;
            name = data.volume_name;
            resource_type = VOLUME;

            break;
        case "vm_template_list":
        case "vm_list":
            id = data.vm_id;
            name = data.vm_name;
            if (modifyFlag || intentFlag) {
                name = data.server_name; // TODO: 바꿔달라하자
                data.tenant_net_list = data.vnic_list;
                for (var i=0; i < data.volume_list.length; i++) {
//                    data.volume_list[i].name = data.volume_list[i].name.replace(name + "_","");
                    data.volume_list[i].vm_template = name;
                    loadNode(data.volume_list[i], "volume_list");
                }
            }
            resource_type = VM;
            break;
        case "network_list":
            id = data.network_id;
            name = data.network_name;
            resource_type = NETWORK;
            break;
        case "vrouter_list":
            id = data.vrouter_id;
            name = data.vrouter_name;
            resource_type = ROUTER;
            break;
        case "auto_scaling_list":
            id = guid();
            name = data.name;
            resource_type = AUTOSCALING;
            data.as_nodes = [
                {
                    id: guid(),
                    name: data.vm_resource.name,
                    data: {
                        name: data.vm_resource.name,
                        flavor: data.vm_resource.flavor,
                        image: data.vm_resource.image,
                        vnic_list: data.vm_resource.vnic_list
                    },
                    resource_type: "as_" + VM,
                    x: 225,
                    y: 250
                }
            ];
            $.each(data.vm_resource.volume_list, function(i, volume) {
                data.as_nodes.push({
                    id: guid(),
                    name: volume.name,
                    data: volume,
                    resource_type: "as_" + VOLUME,
                    x: 300,
                    y: 325
                })
            });
            delete data.vm_resource;
            break;
        case "lb_list":
            id = data.lb_id;
            name = data.lb_name;

            break;
        case "loadbalancer_list":
            id = guid();
            name = data.name;
            resource_type = LOADBALANCER;
            break;
        /*
        case "firewall_list":
            id = data.fw_id;
            name = data.fw_name;
            resource_type = FIREWALL;
            break;
        case "vpn_list":
            return;
        */
        /*
            id = data.vpn_id;
            name = data.vpn_name;
            resource_type = VPN;
            break;
        */
        default:
            resource_type = UNKNOWN;
            break;
    }
    if (isEmpty(id)) id = temp_id++;
    var node = {
        id: id,
        name: name,
        reflexive: false,
        fixed: false,
        resource_type: resource_type,
        data: data,
        x: x,y: y
    }
    if (modifyFlag) {
        if (typeof node.id == "undefined") node.id = guid();
        if (typeof node.name == "undefined") node.name = data.name;
    }
    nodes.push(node);
    if (node.resource_type == NETWORK) {
        var group = { id: node.id, nodeList: [node] };
        groups.push(group);
    }
    /*if (lastNodeX%100 <= 10) {
        lastNodeX += 100;
    } else {
        lastNodeX = 0;
    }*/
}

/* autoscaling 구조
{
    "auto_scaling": [{
        "name": "", "cooldown": 60, "desired_capacity": 1, "min_size": 1, "max_size": 5,
        "vm_resource": {
            "flavor": "", "key_name": "", "image": "",
            "user_data_format": "", "user_data": "", "pool_id": "", "subnet": "",
            "vnic_list": [{"name": "", "tenant_net": "", "public_ip": false}]
        },
        "scaling_policy": [{
            "name": "", "adjustment_type": "", "scaling_adjustment": 0, "cooldown": 0, "meter_name": "",
            "threshold": 0, "statistic": "", "period": 60, "evaluation_periods": 1, "comparison_operator": ""
        }]
    }],
    "loadbalancer": [{
        "name": "", "description": "", "tenant_net": "", "public_vip": false, "external_network": "",
        "lb_algorithm": "ROUND_ROBIN", "protocol": "", "protocol_port": 0, "connection_limit": 0,
        "persistence": "SOURCE_IP", "cookie_name": "",
        "pool_member": {"name": "", "protocol_port": 0, "weight": 1, "subnet": ""},
        "monitor": [{"name": "", "type": "", "delay": 0, "timeout": 5, "max_retries": 5, "http_method": "", "url_path": ""}]
    }]
}
*/
/*
{
    link_list: [
        {
            source: "name",
            target: "name1"
        }
    ],
    resource_list: [
        {
            name: "name1",
            resource_type: "virtual_machine"
        }
    ]
}
*/
//    nodes.filter(function(node, i) {
//        return ;
//    });
function saveServiceAjax() {
    // service template setting
    for ( var node_i = 0; node_i < nodes.length; node_i++ ) { // 볼륨 이외 저장
        if (nodes[node_i].resource_type != VOLUME) {
            saveNode(nodes[node_i]);
        }
    }
    for ( var node_i = 0; node_i < nodes.length; node_i++ ) { // 볼륨저장
        if (nodes[node_i].resource_type == VOLUME) {
            saveNode(nodes[node_i]);
        }
    }

    // mapdata setting
    var resource_list = [];
    var used_security_group_list = [];
    for ( var node_i = 0; node_i < nodes.length; node_i++ ) {
        var node = nodes[node_i];
        var resource = {
            name: node.name,
            resource_type: node.resource_type
        }
        resource_list.push(resource);
        // AS 내부의 LB, Network도 mapdata-resource_list에 추가
        if (node.resource_type == AUTOSCALING) {
            var loadbalancer = getResourceInAutoScaling(node, LOADBALANCER);
            resource_list.push({name: loadbalancer.name, resource_type: loadbalancer.resource_type});
            var network = getResourceInAutoScaling(node, NETWORK);
            resource_list.push({name: network.name, resource_type: network.resource_type});
        }
        if (node.data.security) {
            if (!node.data.security_group) {
                node.data.security_group = {id: "", type: "fw"};
            }
            var used_security_group = {
                vm_name: node.name,
                security_id: node.data.security_group.id,
                security_type: node.data.security_group.type
            };
            used_security_group_list.push(used_security_group);
            delete node.data.security;
            delete node.data.security_group;
        }
    }

    var link_list = [];
    for ( var link_i = 0; link_i < links.length; link_i++ ) {
        link_list.push({
            "source": {"name": links[link_i].source.name, "resource_type": links[link_i].source.resource_type},
            "target": {"name": links[link_i].target.name, "resource_type": links[link_i].target.resource_type}
        });
    }
    var as_link_list = [];
    for ( var as_link_i = 0; as_link_i < asLinks.length; as_link_i++ ) {
        var target_name = asLinks[as_link_i].target.name;
        if (asLinks[as_link_i].target.resource_type == "as_" + VM) {
            target_name = getAutoScalingOfResource(asLinks[as_link_i].target).name;
        }
        as_link_list.push({
            "source": {"name": asLinks[as_link_i].source.name, "resource_type": asLinks[as_link_i].source.resource_type},
            "target": {"name": target_name, "resource_type": asLinks[as_link_i].target.resource_type}
        });
    }

    var mapData = {
        "resources": resource_list,
        "links": link_list,
        "asLinks": as_link_list,
        "security_types": security_types,
        "used_security_group_list": used_security_group_list
    };

//    U.lobiboxMessage(JSON.stringify(service));
    var url = "";
    if (!modifyFlag) {
        url = 'save';
        if (intentFlag) {
            url = '/dashboard/service/new_service/save';
        }
        service.name = $("input[name=service_name]").val();
        service.description = $("textarea[name=description]").val();
    } else {
        url = urlStr + '/save';
    }

    //console.log({service_templates : JSON.stringify(service), mapData: JSON.stringify(mapData)}); // saveServiceAjax() parameter 확인
    //return ;
    U.ajax({
        progress: true,
        url : url,
        data : {
            service_templates : JSON.stringify(service),
            mapData: JSON.stringify(mapData),
            soam_synchronize: $("input[name=SOAM_synchronize]").prop("checked")
//            link_map : JSON.stringify(linkMap)
        },
        success: function(jsonData) {
            if (typeof jsonData.success == "undefined") {
//                U.lobiboxMessage("제목: " + jsonData.error.title + "\n메세지: " + jsonData.error.message);
                U.lobibox(jsonData.error.message, "error", jsonData.error.title);
            } else {
                deleteCookie("nodes");
                deleteCookie("links");
                U.lobiboxMessage(U.replaceEmptyText(jsonData.success.message), "info", jsonData.success.title);
//                window.setTimeout(function() {
                location.replace("/dashboard/service");
//                },3000);
            }
        }
        // end success
    });
}

function mappingLBData(service_detail) {
    var lb_list = service_detail.lb_list;
    $.each(lb_list, function(lb_i, lb) {
        if (!isEmpty(lb.lb_pools)) {
            lb["lb_monitors"] = lb.lb_pools.map(function(lb_pool) {
                var result_monitor = service_detail.lb_monitor_list.filter(function(lb_monitor) {
                    for (var mp_i = 0; mp_i < lb_monitor.monitor_pools.length; mp_i++) {
                        if (lb_pool.id == lb_monitor.monitor_pools[mp_i].id) {
                            return true;
                        }
                    }
                    return false;
                });
                if (result_monitor.length == 1) {
                    return result_monitor[0];
                } else {
                    return;
                }
            });
        }
        if (!isEmpty(service_detail.lb_floating_list)) {
            lb["lb_vip_list"] = service_detail.lb_floating_list.filter(lb_floating => lb.lb_vip_port_id == lb_floating.port_id);
        }
        if (!isEmpty(lb.lb_pools)) {
            lb["lb_pools"] = lb.lb_pools.map(function(lb_pool) {
                if (!isEmpty(service_detail.lb_pool_list)) {
                    var result_pool = service_detail.lb_pool_list.filter(s_pool => lb_pool.id == s_pool.pool_id);
                    if (result_pool.length == 1) {
                        return result_pool[0];
                    } else {
                        return lb_pool;
                    }
                }
            });
        }
        if (!isEmpty(lb.lb_listeners)) {
            lb["lb_listeners"] = lb.lb_listeners.map(function(lb_listener) {
                var result_listener = service_detail.lb_listener_list.filter(s_listener => lb_listener.id == s_listener.listener_id);
                if (result_listener.length == 1) {
                    return result_listener[0];
                } else {
                    return lb_listener;
                }
            });
        }

    });
    return lb_list;
}

function getService(jsonData) {
    var service_detail = jsonData.success.service_detail;
    var user_template = jsonData.success.template;
    if (isEmpty(user_template)) {
        user_template = service_detail;
    }
    $("#service_name").html(service_detail.name);
    service = {
        id : jsonData.success.service_id,
        name: service_detail.name,
        description: jsonData.success.service_description,
        stack_id: jsonData.success.stack_id
    };
    $.each(user_template.auto_scaling_list, function(i, auto_scaling) {
        if (!isEmpty(auto_scaling) && !isEmpty(auto_scaling.vm_resource.volume_list)) {
            service["volume_search"] = true;
            return;
        }
    });

    $.each(jsonData.public_network, function(index, public_net) {
        loadNode(public_net, INTERNET);
    });
    if (editFlag) { // 수정/생성모드
        for (var key in service_detail) {
            if (service_detail[key] instanceof Array) {
                if (["network_list", "vrouter_list", "vm_template_list", "vm_list", "volume_list", "loadbalancer_list", "auto_scaling_list"].indexOf(key) == -1) continue;
                for (var i = 0; i < service_detail[key].length; i++) {
                    loadNode(service_detail[key][i], key);
                }// end for
            }// end if
        }//end for
    } else { // 조회모드
        var lbDataList = mappingLBData(service_detail);
        for (var key in user_template) {
            if (user_template[key] instanceof Array) {
                if (["loadbalancer_list", "auto_scaling_list"].indexOf(key) == -1) continue;
                for (var i = 0; i < user_template[key].length; i++) {
                    if (key == 'loadbalancer_list') {
                        user_template[key][i]["detail"] = lbDataList.filter(lbData => lbData.lb_name == user_template[key][i].name);
                    }
                    loadNode(user_template[key][i], key);
                }// end for
            }// end if
        }
        for (var key in service_detail) {

            if (service_detail[key] instanceof Array) {
                if (["network_list", "vrouter_list", "vm_template_list", "vm_list", "volume_list"].indexOf(key) == -1) continue;
                for (var i = 0; i < service_detail[key].length; i++) {
                    loadNode(service_detail[key][i], key);
                }// end for
            }// end if
        }//end for
    }
    setAutoScalingForGetService(jsonData);
    if (!isEmpty(jsonData.links)) {
        for (var index = 0; index < jsonData.links.length; index++) {
            var source_name;
            var target_name;
            if (typeof jsonData.links[index].source == "string") { source_name = jsonData.links[index].source; }
            else { source_name = jsonData.links[index].source.name; }
            if (typeof jsonData.links[index].target == "string") { target_name = jsonData.links[index].target;}
            else { target_name = jsonData.links[index].target.name; }

            var source = findNodeByName(source_name, jsonData.links[index].source.resource_type, true);
            var target = findNodeByName(target_name, jsonData.links[index].target.resource_type, true);
            insertNewLink(source, target);
        }
    }
    if (!isEmpty(jsonData.security_types)) {
        security_types = jsonData.security_types;
        $.each(security_types, function(idx, val) {
            var securityNode = findNodeByName(val.name, VM);
            if (!isEmpty(securityNode)) {
                securityNode.data["security_type"] = val.security_type;
                securityNode.data["security"] = true;
            }
        });
    }
    restart();
}

function setAutoScalingForGetService(jsonData) {
    // auto scaling Links가 있으면
    if (!isEmpty(jsonData.asLinks)) {
        var asLinkVMs = jsonData.asLinks.filter(function(asLink) {
            return asLink.target.resource_type == "as_" + VM;
        });
        var asLinkLBs = jsonData.asLinks.filter(function(asLink) {
            return asLink.target.resource_type == LOADBALANCER && asLink.source.resource_type == "as_" + NETWORK;
        });
        if (asLinkVMs.length > 0) {
            $.each(asLinkVMs, function(i, asLink) {
                $.each(asLinkLBs, function(j, asLinkLB) {
                    if (asLink.source.name == asLinkLB.source.name && asLink.source.resource_type == "as_" + NETWORK) {
                        var asNetwork = findNodeByName(asLink.source.name);
                        var spliceIndex = nodes.indexOf(asNetwork);
                        asNetwork.resource_type = "as_" + NETWORK;
                        asNetwork.x = 150;
                        asNetwork.y = 175;
                        var as = findNodeByName(asLink.target.name);
                        if (!isEmpty(as)) {
                            as.data.as_nodes.push(asNetwork);
                            var groupToSplice = groups.filter(function(g) {
                                return g.id == asNetwork.id;
                            });
                            groupToSplice.map(function(g) {
                                groups.splice(groups.indexOf(g), 1);
                            });
                            nodes.splice(spliceIndex, 1);
                        }
                    }
                });
            });
            if (asLinkLBs.length > 0) {
                $.each(asLinkLBs, function(i, asLink) {
                    var asNetwork = findNodeByName(asLink.source.name, "as_" + NETWORK, true);
                    var as = getAutoScalingOfResource(asNetwork);
                    var loadbalancer = findNodeByName(asLink.target.name, LOADBALANCER, true);
                    loadbalancer.x = 75;
                    loadbalancer.y = 100;
                    var spliceIndex = nodes.indexOf(loadbalancer);
                    as.data.as_nodes.push(loadbalancer);
                    nodes.splice(spliceIndex, 1);
                });
            }
        }
    //        $.each(nodes, function(index, node) {
    //            if (node.resource_type == AUTOSCALING) {
    //            }
    //        });
        getAutoscalingVM(); // autoscaling 가상서버 동적 조회
        $.each(jsonData.asLinks, function(index, asLink) {
            var source_name;
            var target_name;
            if (typeof asLink.source == "string") { source_name = asLink.source; }
            else { source_name = asLink.source.name; }
            if (typeof asLink.target == "string") { target_name = asLink.target;}
            else { target_name = asLink.target.name; }

            if (jsonData.asLinks[index].target.resource_type != "as_" + VM) {
                var source = findNodeByName(source_name, asLink.source.resource_type, true);
                var target = findNodeByName(target_name, asLink.target.resource_type, true);
                asLinks.push({source: source, target: target});
            } else {
                tempAsLinks.push(asLink);
            }
        });
        if (modifyFlag) {
            $.each(tempAsLinks, function(i, tempAsLink) {
                var tempAs = findNodeByName(tempAsLink.target.name, AUTOSCALING);
                var source = findNodeByName(tempAsLink.source.name, tempAsLink.source.resource_type);
                var target = getResourceInAutoScaling(tempAs, VM);
                asLinks.push({source: source, target: target});
            });
        }
    }
}

function getAutoscalingVM() {
    if (!editFlag) {
        U.ajax({
            progress : true,
            url : '/dashboard/service/get_stack_resource',
            data: {
                "name": service.name,
                "stack_id": service.stack_id
            },
            success: function(jsonData) {
                if (jsonData.success) {
                    $.each(nodes, function(i, node) {
                        if (node.resource_type == AUTOSCALING) {
                            var as_vm = getResourceInAutoScaling(node, VM);
                            var spliceIndex = node.data.as_nodes.indexOf(as_vm);
                            if (spliceIndex != -1) {
                                node.data["vm_resource"] = node.data.as_nodes[spliceIndex].data;
                                node.data.as_nodes.splice(spliceIndex, 1);
                            }
                        }
                    });
                    $.each(jsonData.success.resources, function(i, resource) {
                        for (var as_i = 0; as_i < nodes.length; as_i++) {
                            if (resource.logical_resource_id.indexOf(nodes[as_i].name) != -1) {
                                if (typeof nodes[as_i].data.autoscaling_group == "undefined") {
                                    nodes[as_i].data.autoscaling_group = [];
                                }
                                nodes[as_i].data.autoscaling_group.push(resource);
                                break;
                            }
                        }
                    });
                }
            }
        });
    }
}

function getServiceAjax() { // token, tenant_name, user_name, service_id
    var data = {};
    var query = window.location.search.replace("?", "");
    if (!isEmpty(query) && query.indexOf("rule_key") != -1) {
        var ruleKey = query.replace("rule_key=", "");
        data["rule_key"] = ruleKey;
    }
    console.log(data);
    U.ajax({
        progress : true,
        url : '',
        data: data,
        dataType: 'json',
        success: function(jsonData) {
            if (typeof jsonData.success != 'undefined') {
                var error_msg_list = jsonData.success.service_detail.error_msg_list;
                if (typeof error_msg_list != "undefined") {
                    $.each(error_msg_list, function(idx, error_msg) {
                        U.lobibox(error_msg, "error", "에러");
                    });
                }
                getService(jsonData);
                if (getCookie("nodes") && editFlag) {
                    U.confirm({
                        title: gettext("불러오기"),
                        message: gettext("작업중인 데이터가 있습니다. 데이터를 불러오겠습니까?"),
                        func: function() {
                            var nodesTemp = JSON.parse(getCookie("nodes"));
                            var linksTemp = JSON.parse(getCookie("links"));
                            var asLinkCookie = getCookie("as_links");
                            if (isEmpty(asLinkCookie)) {
                                asLinkCookie = "[]";
                            }
                            var asLinksTemp = JSON.parse(asLinkCookie);
                            for (var i = 0; i < nodesTemp.length; i++) {
                                if (nodesTemp[i].resource_type != INTERNET) {
                                    nodes.push(nodesTemp[i]);
                                    if (nodesTemp[i].resource_type == NETWORK) {
                                        var group = { id: nodesTemp[i].id, nodeList: [nodesTemp[i]] };
                                        groups.push(group);
                                    }
                                }
                            }
                            for (var i = 0; i < linksTemp.length; i++) {
                                if (linksTemp[i].resource_type != INTERNET) {
                                    var source = findNodeById(linksTemp[i].source.id);
                                    var target = findNodeById(linksTemp[i].target.id);
                                    insertNewLink(source, target);
                                }
                            }
                            for (var i = 0; i < asLinksTemp.length; i++) {
                                if (asLinksTemp[i].resource_type != INTERNET) {
                                    var source = findNodeById(asLinksTemp[i].source.id);
                                    var target = findNodeById(asLinksTemp[i].target.id);
                                    asLinks.push({source: source, target: target});
                                }
                            }
                            restart();
                        }
                    });
                } else if (!editFlag) { // 조회모드
                    $("#chainTab").removeAttr("href");
                    var jsonData = {"success": {"service": jsonData.success, "links": jsonData.links, "public_network": jsonData.public_network}};
                    $("#chainTab").click(function() {postMove("./chaining/", JSON.stringify(jsonData))});
                    $("#chainTab").css("cursor", "pointer");

                    var as_list = nodes.filter(node => node.resource_type == AUTOSCALING);
                    $.each(as_list, function(i, as) {
                        as.data.get_vm = true;
                        getAutoScalingVm(as, false);
                        reload = setInterval(function() {
                            getAutoScalingVm(as, false);
                            as.data.get_vm = true;
                            if (revoked_token) {
                                clearInterval(reload);
                            }
                        }, 5000);
                    });
                }
            }
            if (typeof jsonData.error != 'undefined') {
//                U.lobiboxMessage("제목: " + jsonData.error.title + "\n메세지: " + jsonData.error.message);
                U.lobibox(jsonData.error.message, "error", jsonData.error.title);
            }
        }
        // end success
    });
}