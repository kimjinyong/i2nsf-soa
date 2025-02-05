# _*_ coding:utf-8 _*_
import json

import logging
from django.http import JsonResponse
from django.shortcuts import render, redirect

from sdsecgui.tools.openstack_restapi import KeystoneRestAPI, NovaRestAPI, CinderRestAPI, NeutronRestAPI
from sdsecgui.db.db_connector import SOAControlDBConnector
from sdsecgui.db.query import *
from sdsecgui.db.soa_db_connector import SOAManagerDBConnector
from sdsecgui.db.soa_query import *

logger = logging.getLogger("myapp.myLogger")


def get_project_list(request):
    if request.is_ajax() and request.method == 'POST':
        pass
    else:
        project_name = request.session.get("project_name")
        auth_url = request.session.get("auth_url")
        token = request.session.get('passToken')
        domain_id = request.session.get('domain_id')
        if not token:
            return redirect("/dashboard/domains/?next=/dashboard/identity")
        keystone = KeystoneRestAPI(auth_url, token)
        data = None
        if domain_id:
            data = {"domain_id": domain_id}
        result = keystone.get_project_list(data)
        if result.get("success"):
            projects = result.get("success").get("projects")
            for project in projects:
                if project.get("name") == project_name:
                    project["click"] = True

            return render(request, 'identity/projects/index.html', {"projects": projects})
        else:
            return render(request, 'identity/projects/index.html', {"error": result.get("error")})


def get_project_by_id(request, project_id):
    if request.is_ajax() and request.method == 'POST':
        pass
    else:
        token = request.session.get('passToken')
        if not token:
            return redirect("/dashboard/domains/?next=/dashboard/identity/projects/" + project_id + "/detail")
        auth_url = request.session.get("auth_url")
        keystone = KeystoneRestAPI(auth_url, token)
        result = keystone.get_project(project_id)
        if result.get("success"):
            project = result.get("success")
            return render(request, 'identity/projects/info.html', project)
        else:
            return render(request, 'identity/projects/info.html', {"error": result.get("error")})


def create_project(request):
    if request.is_ajax() and request.method == 'POST':
        token = request.session.get('passToken')
        auth_url = request.session.get('auth_url')
        project = json.loads(request.POST.get("project"))

        data = {"project": {
            "description": project.get("description"),
            "domain_id": project.get("domain_id"),
            "name": project.get("name"),
            "enabled": project.get("enabled"),
            "is_domain": False,
        }}
        keystone = KeystoneRestAPI(auth_url, token)
        result = keystone.create_project(data)
        if result.get("success"):
            project_id = result["success"]["project"].get("id")
            assign = json.loads(request.POST.get("assignList"))
            assign_users = assign.get("users")
            for assign_user in assign_users:
                user_id = assign_user.get("user_id")
                role_id_list = assign_user.get("role_id_list")
                for role_id in role_id_list:
                    assign_result = keystone.assign_role_to_user_on_projects(project_id, user_id, role_id)
                    if assign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(assign_result["error"])
            assign_groups = assign.get("groups")
            for assign_group in assign_groups:
                group_id = assign_group.get("group_id")
                role_id_list = assign_group.get("role_id_list")
                for role_id in role_id_list:
                    assign_result = keystone.assign_role_to_group_on_projects(project_id, group_id, role_id)
                    if assign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(assign_result["error"])

        return JsonResponse(result)


def update_project(request, project_id):
    if request.is_ajax() and request.method == 'POST':
        token = request.session.get('passToken')
        auth_url = request.session.get('auth_url')
        project = json.loads(request.POST.get("project"))
        quota = json.loads(request.POST.get("quotas"))
        data = {"project": {
            "description": project.get("description"),
            "domain_id": project.get("domain_id"),
            "name": project.get("name"),
            "enabled": project.get("enabled"),
            "is_domain": False,
        }}
        keystone = KeystoneRestAPI(auth_url, token)
        result = keystone.update_project(project_id, data)
        err_msg_list = []

        if result.get("success"):
            assign_list = json.loads(request.POST.get("assignList"))
            unassign_list = json.loads(request.POST.get("unassignList"))
            # 사용자 역할 할당
            for assign in assign_list.get("users"):
                user_id = assign.get("user_id")
                role_id_list = assign.get("role_id_list")
                for role_id in role_id_list:
                    assign_result = keystone.assign_role_to_user_on_projects(project_id, user_id, role_id)
                    if assign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(assign_result["error"])
            # 사용자 역할 제거
            for unassign in unassign_list.get("users"):
                user_id = unassign.get("user_id")
                role_id_list = unassign.get("role_id_list")
                for role_id in role_id_list:
                    unassign_result = keystone.unassign_role_to_user_on_projects(project_id, user_id, role_id)
                    if unassign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(unassign_result["error"])
            # 그룹 역할 할당
            for assign in assign_list.get("groups"):
                group_id = assign.get("group_id")
                role_id_list = assign.get("role_id_list")
                for role_id in role_id_list:
                    assign_result = keystone.assign_role_to_group_on_projects(project_id, group_id, role_id)
                    if assign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(assign_result["error"])
            # 그룹 역할 제거
            for unassign in unassign_list.get("groups"):
                group_id = unassign.get("group_id")
                role_id_list = unassign.get("role_id_list")
                for role_id in role_id_list:
                    unassign_result = keystone.unassign_role_to_group_on_projects(project_id, group_id, role_id)
                    if unassign_result.get("error"):
                        if not result.get("error"):
                            result["error"] = []
                        result["error"].append(unassign_result["error"])
            if quota["nova"].get("quota_set"):
                nova = NovaRestAPI(auth_url, token)
                result = nova.update_quotas(project_id, quota["nova"])
                if result.get("error"):
                    err_msg_list.append(result["error"])
            if quota["neutron"].get("quota"):
                neutron = NeutronRestAPI(auth_url, token)
                result = neutron.update_quotas(project_id, quota["neutron"])
                if result.get("error"):
                    err_msg_list.append(result["error"])
            if quota["cinder"].get("quota_set"):
                cinder = CinderRestAPI(auth_url, token)
                result = cinder.update_quotas(project_id, quota["cinder"])
                if result.get("error"):
                    err_msg_list.append(result["error"])

        return JsonResponse(result)


def delete_project(request, project_id):
    if request.is_ajax() and request.method == 'POST':
        token = request.session.get('passToken')
        auth_url = request.session.get('auth_url')
        keystone = KeystoneRestAPI(auth_url, token)
        result = keystone.delete_project(project_id)
        try:
            soac_conn = SOAControlDBConnector.getInstance()
            params = (request.session.get("domain_name"), project_id)
            project = soac_conn.select_one(SELECT_SOAC_PROJECT_LIST + "AND PROJECT_ID = %s", )
            if project:
                soam_conn = SOAManagerDBConnector.getInstance()
                soam_conn.update(DELETE_SOAM_PROJECT, params)
        except Exception as e:
            pass
        return JsonResponse(result)


def project_modal(request):
    token = request.session.get('passToken')
    auth_url = request.session.get("auth_url")
    modal_title = request.GET.get("modal_title")
    project_id = request.GET.get("project_id")
    domain_id = request.session.get("domain_id")
    domain_name = request.session.get("domain_name")
    data = {
        "modal_title": modal_title,
        "input_domain_id": domain_id,
        "input_domain_name": domain_name,
        "project_id": project_id
    }

    keystone = KeystoneRestAPI(auth_url, token)

    u_result = keystone.get_user_list({"domain_id": domain_id})
    if u_result.get("success"):
        data["users"] = u_result["success"].get("users")

    g_result = keystone.get_group_list()
    if g_result.get("success"):
        data["groups"] = g_result["success"].get("groups")

    r_result = keystone.get_role_list()
    if r_result.get("success"):
        data["roles"] = r_result["success"].get("roles")

    if project_id:
        p_result = keystone.get_project(project_id)
        if p_result.get("success"):
            project = p_result["success"].get("project")
            data["project_name"] = project.get("name")
            data["description"] = project.get("description")
            data["enabled"] = project.get("enabled")
        ra_result = keystone.get_role_assignments({"scope.project.id": project_id})
        if ra_result.get("success"):
            role_assignments = ra_result["success"].get("role_assignments")
            response_role_assignments = {"users": [], "groups": []}
            for role_assignment in role_assignments:  # role_assignment_role 루프
                role_assignment_user = role_assignment.get("user")
                if role_assignment_user:
                    select_user = filter(lambda user: user.get("id") == role_assignment_user.get("id"), data["users"])
                    if select_user:
                        role_assignment_user["name"] = select_user[0].get("name")
                        data["users"][data["users"].index(select_user[0])]["assigned"] = True

                role_assignment_group = role_assignment.get("group")
                if role_assignment_group:
                    select_group = filter(lambda group: group.get("id") == role_assignment_group.get("id"), data["groups"])
                    if select_group:
                        role_assignment_group["name"] = select_group[0].get("name")
                        data["groups"][data["groups"].index(select_group[0])]["assigned"] = True

                role_assignment_role = role_assignment.get("role")
                if role_assignment_role:
                    select_role = filter(lambda role: role.get("id") == role_assignment_role.get("id"), data["roles"])
                    if select_role:
                        role_assignment_role["name"] = select_role[0].get("name")

                if role_assignment_role:
                    if role_assignment_user:
                        select_user = [
                            user
                            for user in response_role_assignments["users"]
                            if user.get("id") == role_assignment_user.get("id")
                        ]  # 이미 있는지 확인
                        if len(select_user) == 0:  # 없으면 만들기
                            response_role_assignments["users"].append({
                                "name": role_assignment_user.get("name"),
                                "id": role_assignment_user.get("id"),
                                "roles": [role_assignment_role],
                                "roles_display": role_assignment_role.get("name")
                            })
                        elif len(select_user) == 1:  # 있으면 role 추가
                            select_user[0]["roles"].append(role_assignment_role)
                            select_user[0]["roles_display"] += ", " + role_assignment_role.get("name")

                    if role_assignment_group:
                        select_group = [
                            group
                            for group in response_role_assignments["groups"]
                            if group.get("id") == role_assignment_group.get("id")
                        ]  # 이미 있는지 확인
                        if len(select_group) == 0:  # 없으면 만들기
                            response_role_assignments["groups"].append({
                                "name": role_assignment_group.get("name"),
                                "id": role_assignment_group.get("id"),
                                "roles": [role_assignment_role],
                                "roles_display": role_assignment_role.get("name")
                            })
                        elif len(select_group) == 1:  # 있으면 role 추가
                            select_group[0]["roles"].append(role_assignment_role)
                            select_group[0]["roles_display"] += ", " + role_assignment_role.get("name")

            data["role_assignments"] = response_role_assignments
            data["role_assignments_json"] = json.dumps(response_role_assignments)

        nova = NovaRestAPI(auth_url, token)
        cinder = CinderRestAPI(auth_url, token)
        neutron = NeutronRestAPI(auth_url, token)
        result_nova_quota_set = nova.get_quotas(project_id)
        result_neutron_quotas = neutron.get_quotas(project_id)
        result_cinder_quotas = cinder.get_cinder_quotas(project_id)
        # result_cinder_limits = cinder.get_limits(project_id)
        if result_nova_quota_set.get("success"):
            nova_quota_set = result_nova_quota_set["success"].get("quota_set")
            data["nova_quota_set"] = nova_quota_set
        if result_neutron_quotas.get("success"):
            neutron_quotas = result_neutron_quotas["success"].get("quota")
            data["neutron_quotas"] = neutron_quotas
        # if result_cinder_limits.get("success"):
        #     cinder_limits = result_cinder_limits["success"]["limits"].get("absolute")
        #     data["cinder_limits"] = cinder_limits
        if result_cinder_quotas.get("success"):
            cinder_quotas = result_cinder_quotas["success"].get("quota_set")
            data["cinder_quotas"] = cinder_quotas

    return render(request, 'identity/projects/modal.html', data)


