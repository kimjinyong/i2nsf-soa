# _*_ coding:utf-8 _*_

import time
from datetime import datetime
from django.http import JsonResponse
from django.shortcuts import render, redirect

from sdsecgui.tools.openstack_restapi import NovaRestAPI, KeystoneRestAPI
from sdsecgui.tools.keystone_exception import Unauthorized


def retrieve_useage_list(request):
    if request.is_ajax() and request.method == 'POST':
        pass
    else:
        token = request.session.get('passToken')
        auth_url = request.session.get("auth_url")
        start_str = request.GET.get("start")
        end_str = request.GET.get("end")
        if start_str is None:
            yesterday = datetime.fromtimestamp(time.time() - 3600 * 24 * 2)
            start_date = datetime(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0)
        else:
            date = start_str.split("-")
            start_date = datetime(int(date[0]), int(date[1]), int(date[2]), 0, 0, 0)
        if end_str is None:
            today = datetime.fromtimestamp(time.time() + 3600 * 24 * 0)
            end_date = datetime(today.year, today.month, today.day, 23, 59, 59)
        else:
            date = end_str.split("-")
            end_date = datetime(int(date[0]), int(date[1]), int(date[2]), 23, 59, 59)
        nova = NovaRestAPI(auth_url, token)
        start = start_date.isoformat()
        end = end_date.isoformat()
        result_usage_list = nova.get_usages(start, end)
        total_usage = {
            "instance_cnt": 0,
            "total_memory_mb": 0,
            "total_vcpus_usage": 0,
            "total_local_gb_usage": 0,
            "total_memory_mb_usage": 0,
            "vcpus": 0,
            "local_gb": 0,
            "memory_mb": 0
        }
        if result_usage_list.get("success"):
            usage_list = result_usage_list["success"].get("tenant_usages")
            keystone = KeystoneRestAPI(auth_url, token)
            projects = []
            p_result = keystone.get_project_list({"domain_id": request.session.get("domain_id")})
            if p_result.get("success"):
                projects = p_result["success"].get("projects")
            for usage in usage_list:
                server_usages = {"vcpus": 0, "local_gb": 0, "memory_mb": 0}
                for server_usage in usage.get("server_usages"):
                    for k, v in server_usage.items():
                        if k in ["vcpus", "local_gb", "memory_mb"]:
                            if "gb" in k:
                                v = v * 1024**3
                            elif "mb" in k:
                                v = v * 1024**2
                            server_usages[k] += v
                            total_usage[k] += v
                for key in ["total_vcpus_usage", "total_local_gb_usage", "total_memory_mb_usage"]:
                    total_usage[key] += usage.get(key)
                total_usage["instance_cnt"] += 1
                usage["server_usages_time"] = server_usages
                names = [project["name"] for project in projects if project["id"] == usage["tenant_id"]]
                if len(names) == 1:
                    name = names[0]
                else:
                    name = usage["tenant_id"]
                usage["project"] = {"id": usage["tenant_id"], "name": name}
        else:
            usage_list = result_usage_list

        return render(request, 'admin/index.html', {"total_usage": total_usage, 'usage_list': usage_list, "start_date": start_date.strftime('%Y-%m-%d'), "end_date": end_date.strftime('%Y-%m-%d')})

# def retrieve_useage_list(request, startStr=None, endStr=None):
#     if request.is_ajax() and request.method == 'POST':
#         sess = login("admin", "chiron", "admin", "http://192.168.10.6/identity/v3", 'default')
#         # sess = login(auth_url="http://129.254.173.151:5000/v3")
#         if startStr == None:
#             start = datetime.fromtimestamp(time.time() - 3600 * 24 * 1)
#         else:
#             date = startStr.split("-")
#             start = datetime(int(date[0]), int(date[1]), int(date[2]))
#         if endStr == None:
#             end = datetime.fromtimestamp(time.time() - 3600 * 24 * 0)
#         else:
#             date = endStr.split("-")
#             end = datetime(int(date[0]), int(date[1]), int(date[2]))
#         resultUsageList = get_usages(sess, start, end)
#         usageList = []
#         for resultUsage in resultUsageList:
#             usageList.append(resultUsage._info)
#         return JsonResponse({ 'usageList' : usageList })
#     else:
#         return render(request, 'admin/index.html', {})