﻿# _*_ coding:utf-8 _*_
from django.conf.urls import url, include

from sdsecgui.dashboard.telemeter import views
from sdsecgui.dashboard.service import views as service_views
from sdsecgui.dashboard.telemeter.alarms import urls as alarms_urls

urlpatterns = [
    url(r'^$', service_views.list_service, name='index'),
    url(r'^(?P<service_id>[\w\-]+)/detail$', views.detailService, name='info'),
    url(r'^instance_info$', views.get_instance_by_id, name='instance_info'),
    url(r'^statistics/(?P<meter_name>[\w\_\.]+)$', views.getStatistics, name='statistics'),
    url(r'^statisticsList$', views.getStatisticsList, name='statisticsList'),
    url(r'^statisticsList/(?P<meter_group_name>[\w\_\.]+)$', views.get_statistics_meter_list, name='statisticsMeterList'),
    url(r'^network_list/(?P<resource_id>[\w\-]+)$', views.getNetworkList, name='networkList'),
    # url(r'^metering/(?P<vm_id>[\w\-]+)$', views.getMetersList, name='metersList'),
    # url(r'^new_samples/(?P<vm_id>[\w\-]+)$', views.getNewSamplesExample, name='newSamplesExample'),
    # url(r'^create_alarm$', views.create_alarm, name='create_alarm'),
    url(r'^detail_pop', views.detail_pop, name='detail_pop'),
    url(r'^alarms/', include(alarms_urls, namespace='alarms')),
]