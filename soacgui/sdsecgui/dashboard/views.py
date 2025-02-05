# _*_ coding:utf-8 _*_
import imghdr
import json
import os

import re
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.utils import translation

from django.views.decorators.csrf import csrf_exempt

from sdsec.settings import logger
from sdsecgui.db.db_connector import SOAControlDBConnector
from sdsecgui.tools.openstack_restapi import KeystoneRestAPI
from sdsecgui.tools.ctrlengine import ControlEngine
from sdsecgui.tools.keystone_exception import Unauthorized
from sdsec.settings import BASE_DIR

# try:
#     # 추가한 경로 안의 파일 ctrlengine
#     from ctrlengine import ControllerEngine
# except:
#     from sdsecgui.dashboard.skeletonLib import ControllerEngine
#     logger.critical(u"import error!!! skeletonLib 의 ControllerEngine 부름")
from sdsecgui.db.query import SELECT_DOMAINS_ONE


def main(request):
    domain_name = request.POST.get("domain_name")
    user_name = request.POST.get("user_name")
    password = request.POST.get("pass")
    project_name = request.POST.get("project_name")
    auth_url = request.session.get("auth_url")
    if domain_name and user_name and password and project_name and auth_url:
        return redirect("/dashboard/service/")
    else:
        return redirect("/login")


def common_login(request, auth_url, user_name, password, domain_name, project_name=None):
    available_projects = None
    token = None
    roles = None
    roles_str = None
    project = None
    user = None
    keystone = None
    domain_id = None
    # =================================UnScope Login==================================
    if not project_name:
        result = KeystoneRestAPI.get_token(auth_url, user_name, password, domain_name)
        if result.get("success"):
            # request.session.set_expiry(SESSION_COOKIE_AGE)
            token = result['success'].get('token')
            roles = result["success"].get("roles")
            user = result["success"].get("user")
            if user:
                user_name = user.get("name")
            keystone = KeystoneRestAPI(auth_url, token)
            available_projects = keystone.get_available_project_scopes()
            # =================================Default 프로젝트==================================
            if result["success"].get("project"):
                project = result["success"].get("project")
            # =================================접근 가능 프로젝트==================================
            if not project and available_projects.get("success"):
                if not available_projects["success"].get("projects"):
                    return {"error": {"title": "Forbidden", "message": "모든 프로젝트에 접근 권한이 없습니다."}}
                else:
                    project = available_projects["success"].get("projects")[0]
            if project:
                project_name = project.get("name")

    # =================================Scope Login==================================
    result = KeystoneRestAPI.get_token(auth_url, user_name, password, domain_name, project_name)
    # logger.info("""################## Scope Login ############
    # auth_url: {}
    # user_name: {}
    # password: {}
    # domain_name: {}
    # project_name: {}
    # result: {}""".format(auth_url, user_name, password, domain_name, project_name, result))
    if result.get('success'):
        request.session["domain_admin"] = False
        # request.session.set_expiry(SESSION_COOKIE_AGE)
        token = result['success'].get('token')
        user = result["success"].get("user")
        domain_id = user["domain"].get("id")
        roles = result["success"].get("roles")
        project = result["success"].get("project")
        request.session["project_id"] = project.get("id")
        request.session["project_name"] = project.get("name")
        if not keystone:
            keystone = KeystoneRestAPI(auth_url, token)
        keystone.update_token(token)
        if not available_projects:
            available_projects = keystone.get_available_project_scopes()
        request.session["available_projects"] = [
            {"name": available_project.get("name"), "id": available_project.get("id")}
            for available_project in available_projects["success"].get("projects")
        ]
        if roles:
            roles_str = ','.join(role.get("name") for role in roles)
        elif user.get("name") == 'admin':
            roles_str = user.get("name")

        ctrl_engine = ControlEngine(token=token, project_id=project.get("id"), project_name=project.get("name"), user_id=user.get("id"),
                                    user_name=user_name, roles=roles_str, auth_url=auth_url)
        request.session["ctrl_header"] = ctrl_engine.get_header()
        # ================================================
        request.session["passToken"] = token
        request.session["user_name"] = user_name
        request.session["domain_name"] = domain_name
        request.session["auth_url"] = auth_url
        request.session["domain_id"] = domain_id
        request.session["roles"] = roles_str
        if user:
            request.session["user_id"] = user.get("id")
        else:
            request.session["user_id"] = None
        if not project:
            request.session["project_id"] = None
            request.session["project_name"] = None

    return result

def user_login(request):
    pattern = re.compile("https?://(\d+\.\d+\.\d+\.\d+):?\d+/?v?3?", re.I)
    if request.method == 'POST':
        domain_key = request.POST.get("domain_key")
        if domain_key:
            conn = SOAControlDBConnector.getInstance()
            domain = conn.select_one(SELECT_DOMAINS_ONE, (domain_key))
            auth_url = domain.get("auth_url")
            domain_name = domain.get("domain_name")

        else:
            domain_name = request.POST.get("domain_name")
            auth_url = request.POST.get("auth_url")
        user_name = request.POST.get("user_name")
        password = request.POST.get("pass")
        project_name = request.POST.get("project_name")
        matcher = pattern.match(auth_url)
        if matcher:
            ip = matcher.group(1)
            request.session["ip"] = ip

        result = common_login(request, auth_url, user_name, password, domain_name, project_name)
        ip = request.session.get("ip")

        if request.is_ajax():
            # 팝업에서 로그인
            logger.info("ajaxLoginPOST")
            if result.get('success'):
                description = request.POST.get("description")
                if description:
                    request.session["description"] = description
                response = JsonResponse({'success': "login"})
                logger.info("ajaxLoginPOST_end")
                return response

            else:
                logger.info("ajaxLoginPOST_error_end")
                return JsonResponse(result)

        else:
            # 페이지에서 로그인
            logger.info("userLoginPOST")
            next_url = request.GET.get("next")
            if result.get('success'):
                if not next_url:
                    next_url = '/dashboard/service'
                response = redirect(next_url)
                request.session["referrer"] = None
                response.delete_cookie('domain_name')
                response.delete_cookie('project_name')
                response.delete_cookie('user_name')
                response.delete_cookie('pass')
                response.delete_cookie('save')
                logger.info("userLoginPOST_end")
                return response
            if result.get('error'):
                logger.info("userLoginPOST_error_end: {}".format(result))
                description = request.session.get("description")
                return render(request, 'login.html', {'error': result["error"], "ip": ip, "auth_url": auth_url, "domain_name": domain_name, "description": description})
        return JsonResponse({"error": {"message": "원인불명", "title": "로그인실패"}})
    else:
        domain_key = request.GET.get("domain_key")
        project_name = request.GET.get("project_name")
        if not domain_key:
            return redirect("/dashboard/domains")
        conn = SOAControlDBConnector.getInstance()
        domain = conn.select_one(SELECT_DOMAINS_ONE, (domain_key))
        description = domain.get("description")
        auth_url = domain.get("auth_url")
        domain_name = domain.get("domain_name")
        db_ip = domain.get("db_ip")
        db_user = domain.get("db_user")
        db_pass = domain.get("db_password")
        db_port = domain.get("db_port")
        request.session["domain_db_ip"] = db_ip
        request.session["domain_db_user"] = db_user
        request.session["domain_db_pass"] = db_pass
        request.session["domain_db_port"] = db_port
        request.session["domain_db_nm"] = "soacgui"
        request.session["description"] = description
        request.session["auth_url"] = auth_url
        request.session["domain_name"] = domain_name
        matcher = pattern.match(auth_url)
        if matcher:
            ip = matcher.group(1)
            request.session["ip"] = ip

        data = {
            "ip": ip,
            "auth_url": auth_url,
            "domain_name": domain_name,
            "description": description
        }

        if project_name:
            data["project_name"] = project_name

        return render(request, 'login.html', data)


def get_available_domain_scopes(request):
    if request.is_ajax() and request.method == 'POST':
        token = request.session.get('passToken')
        domain_name = request.session.get("domain_name")
        domain_id = request.session.get("domain_id")
        auth_url = request.session.get("auth_url")
        try:
            keystone = KeystoneRestAPI(auth_url, token)
            result = keystone.get_available_domain_scopes()
        except Unauthorized as e:
            request.session["error"] = {"title": e.message, "message": e.details}
            return JsonResponse({"error": {"title": e.message, "message": e.details, "code": 401}})
        if result.get("success"):
            if len(result["success"].get("domains")) == 0:
                domain = {"name": domain_name, "click": True}
                if domain_id:
                    domain["id"] = domain_id
                result.get("success").get("domains").append(domain)
            else:
                domains = result.get("success").get("domains")
                for domain in domains:
                    if domain.get("name") == domain_name:
                        domain["click"] = True

        return JsonResponse(result)


def get_available_project_scopes(request):
    if request.is_ajax() and request.method == 'POST':
        token = request.session.get('passToken')
        domain_name = request.session.get("domain_name")
        project_name = request.session.get("project_name")
        auth_url = request.session.get("auth_url")

        try:
            keystone = KeystoneRestAPI(auth_url, token)
        except Unauthorized as e:
            return JsonResponse({"error": {"title": e.message, "message": e.details, "code": 401}})

        # conn = SOAControlDBConnector.getInstance()
        # try:
        #     select_domains = conn.select(SELECT_DOMAINS)  # TODO: 도메인 리스트는 가져왔는데 권한에따라 도메인 리스트가 달라져야할지?
        # except Exception as e:
        #     result = {"error": {"message": str(e), "title": "에러"}}
        #     return JsonResponse(result)

        result = keystone.get_available_project_scopes()
        if result.get("success"):
            projects = result.get("success").get("projects")
            for project in projects:
                if project.get("name") == project_name:
                    project["click"] = True

        return JsonResponse(result)


def revoke_token(request):
    token = request.session.get('passToken')
    auth_url = request.session.get('auth_url')
    keystone = KeystoneRestAPI(auth_url, token)
    response = keystone.revoke_token()
    return JsonResponse(response)


def test(request):
    token = request.session.get('passToken')
    auth_url = request.session.get('auth_url')
    # return render(request, 'test.html', {})
    url = auth_url + "/auth/tokens"
    body = None
    from sdsecgui.tools.custom_httpclient import CustomHTTPClient
    response = CustomHTTPClient.delete_with_token(token, url, subject=token)
    # keystone = KeystoneRestAPI()
    # service_type = ""
    # auth_type = "public"
    # try:
    #     aodhRestAPI = AodhRestAPI(auth_url, token)
    # except Exception as e:
    #     return JsonResponse(e)
    # aodhRestAPI.get_alarm_list()
    return JsonResponse(response)


def switch_project_with_token(request):
    token = request.session.get("passToken")
    if request.method == 'POST':
        data = json.loads(request.POST.get("data"))
        project_name = data.get("project_name")
        domain_name = request.session.get("domain_name")
        auth_url = request.session.get("auth_url")
        try:
            keystone = KeystoneRestAPI(auth_url, token)
        except Unauthorized as e:
            request.session["error"] = {"title": e.message, "message": e.details}
            return JsonResponse({"error": {"title": e.message, "message": e.details, "code": 401}})
        # result = keystone.get_token_with_scoped_by_token(project_id=project_id)
        result = keystone.get_token_with_scoped_by_token(domain_name=domain_name, project_name=project_name)
        if result.get("success"):
            # request.session.set_expiry(SESSION_COOKIE_AGE)
            token = result['success']['token']
            request.session["passToken"] = token
            request.session["project_name"] = project_name

            roles = result["success"].get("roles")
            if roles:
                roles_str = ','.join(role.get("name") for role in roles)
            else:
                roles_str = ""

            user = result["success"].get("user")
            project = result["success"].get("project")
            request.session["user_id"] = user.get("id")
            request.session["user_name"] = user.get("name")
            request.session["project_id"] = project.get("id")

            request.session["roles"] = roles_str
            ctrl_engine = ControlEngine(token=token, project_id=project.get("id"), project_name=project_name,
                                        user_id=user.get("id"), user_name=user.get("name"), roles=roles_str, auth_url=auth_url)
            request.session["ctrl_header"] = ctrl_engine.get_header()

        return JsonResponse(result)


def upload_file(request):
    if request.method == 'POST':
        MEDIA_FILE_ROOT = BASE_DIR + "/static/media"
        MEDIA_URL_ROOT = "/files/download"
        result = {"success":{}, "error":{}}

        security_icon = request.FILES.get("security_icon")
        if security_icon:
            security_file_path = "%s/%s" % (MEDIA_FILE_ROOT, security_icon)
            security_file_url = "%s/%s" % (MEDIA_URL_ROOT, security_icon)
            if not os.path.exists(security_file_path):
                with open(security_file_path, 'wb') as f:
                    f.write(security_icon.read())
            else:
                result["error"]["security_icon_path"] = "이미 존재하는 파일입니다."
            result["success"]["security_icon_path"] = security_file_url

        manufacturer_icon = request.FILES.get("manufacturer_icon")
        if manufacturer_icon:
            manufacturer_file_path = "%s/%s" % (MEDIA_FILE_ROOT, manufacturer_icon)
            manufacturer_file_url = "%s/%s" % (MEDIA_URL_ROOT, manufacturer_icon)
            if not os.path.exists(manufacturer_file_path):
                with open(manufacturer_file_path, 'wb') as f:
                    f.write(manufacturer_icon.read())
            else:
                result["error"]["manufacturer_file_path"] = "이미 존재하는 파일입니다."
            result["success"]["manufacturer_file_path"] = manufacturer_file_url

        capability_xml = request.FILES.get("capability_xml")
        if capability_xml:
            capability_xml_path = "%s/%s" % (MEDIA_FILE_ROOT, capability_xml)
            capability_xml_url = "%s/%s" % (MEDIA_URL_ROOT, capability_xml)
            if not os.path.exists(capability_xml_path):
                with open(capability_xml_path, 'wb') as f:
                    f.write(capability_xml.read())
            else:
                result["error"]["capability_xml_path"] = "이미 존재하는 파일입니다."
            result["success"]["capability_xml_path"] = capability_xml_url
        return JsonResponse(result)


def show_image_file(request, file_name):
    MEDIA_FILE_ROOT = BASE_DIR + "/static/media"
    file_path = "%s/%s" % (MEDIA_FILE_ROOT, file_name)
    mime_type = imghdr.what(file_path)
    if ".ico" in file_name:
        mime_type = "x-icon"
    with open(file_path, 'rb') as f:
        image_data = f.read()
        return HttpResponse(image_data, content_type="image/" + mime_type)


@csrf_exempt
def check_status(request, r_type, r_id):
    token = request.session.get('passToken')
    auth_url = request.session.get("auth_url")
    logger.info("request.accept: {}\nr_type: {}, r_id: {}".format(request.META.get("HTTP_ACCEPT"), r_type, r_id))
    result = {}

    # if r_type == "server":
    #     nova = NovaRestAPI(auth_url, token)
    #     result = nova.get_server(r_id, fields={"fields": ["status", "power_state"]})
    # else:
    #     neutron = NeutronRestAPI(auth_url, token)
    #     if r_type == "router":
    #         result = neutron.getRouter(r_id, fields={"fields": "status"})
    #     elif r_type == "network":
    #         result = neutron.get_network(r_id, fields={"fields": "status"})
    #     elif r_type == "port":
    #         result = neutron.getPort(r_id, fields={"fields": "status"})
    #
    # if result.get("success"):
    #     result["success"] = result["success"].get(r_type)

    result["success"] = {"status": "active"}

    if r_type == "server":
        result["success"]["power_state"] = "shutoff"
    logger.info("response: {}".format(result))
    return JsonResponse(result)


def set_language(request, language_code):
    if language_code in ['en', 'ko']:
        if translation.LANGUAGE_SESSION_KEY in request.session:
            del request.session[translation.LANGUAGE_SESSION_KEY]
        translation.activate(language_code)
        request.session[translation.LANGUAGE_SESSION_KEY] = language_code
        # TODO: 각 views.py에 있는 함수들 마다 넣어줘야할지 모르겟다
        #       ==> translation.activate(request.session[translation.LANGUAGE_SESSION_KEY])
        #   template에 추가해야하나? ==> {% load i18n %}
        #   template에서 번역 사용하려면 {{ _("Hello World") }} 여러줄은 {% blocktrans %}{% endblocktrans %}
        #   settings.py
        #       1. middleware에 추가 ==> 'django.middleware.locale.LocaleMiddleware'
        #       2. 언어파일 저장 경로 정의 ==> LOCALE_PATHS = (os.path.join(BASE_DIR, 'locale'),)
        #       3. 접속자 기본언어 정의 ==> LANGUAGE_CODE = 'en-us'
        #   언어파일 생성 ==> python manage.py makemessages -l ko
        #   언어 파일 컴파일 ==> python manage.py compilemessages
        #   https://iam.namjun.kim/django/2019/01/29/django-for-international-service/
        #   http://blog.naver.com/PostView.nhn?blogId=93immm&logNo=221301243518&categoryNo=300&parentCategoryNo=0&viewDate=&currentPage=1&postListTopCurrentPage=1&from=postView&userTopListOpen=true&userTopListCount=10&userTopListManageOpen=false&userTopListCurrentPage=1
        return JsonResponse({"success": {"message": "set language success", "title": "Translate", "code": 200}})
    else:
        return JsonResponse({"success": {"message": "set language success", "title": "Translate", "code": 404}}, status=404)
