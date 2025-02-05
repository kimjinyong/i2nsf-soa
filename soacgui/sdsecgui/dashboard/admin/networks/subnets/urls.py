# _*_ coding:utf-8 _*_
from django.conf.urls import url

from sdsecgui.dashboard.admin.networks.subnets import views

urlpatterns = [
    url(r'^$', views.get_subnet_list, name='subnetList'),
    url(r'^(?P<subnet_id>[\w\-]+)/(?P<action>delete|update|detail)$', views.action_subnet, name='subnet'),
    url(r'^create$', views.create_subnet, name='create_subnet'),
    url(r'^modal$', views.subnet_modal, name='subnet_modal'),
    url(r'^(?P<subnet_id>[\w\-]+)/modal$', views.subnet_modal, name='subnet_modal'),
]