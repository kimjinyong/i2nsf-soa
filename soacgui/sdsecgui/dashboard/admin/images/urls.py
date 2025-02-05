# _*_ coding:utf-8 _*_
from django.conf.urls import url

from sdsecgui.dashboard.admin.images import views

app_name = "image"
urlpatterns = [
    # 이미지 주소
    url(r'^$', views.get_image_list, name='list_image'),
    url(r'^create$', views.create_image, name='create_image'),
    url(r'^(?P<image_id>[\w\-]+)/detail$', views.get_image_by_id, name='detail_image'),
    url(r'^(?P<image_id>[\w\-]+)/delete$', views.delete_image, name='delete_image'),
    url(r'^(?P<image_id>[\w\-]+)/modal$', views.image_modal, name='image_modal'),
    url(r'^modal$', views.image_modal, name='image_modal'),
]