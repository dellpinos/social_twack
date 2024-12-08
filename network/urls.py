
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("wall/<str:username>", views.profile, name="profile"),
    path("following", views.following, name="following"),

    # API Routes
    path("api/new_post", views.new_post, name="new_post"),
    path("api/update_post", views.update_post, name="update_post"),
    path("api/change_follow", views.change_follow, name="change_follow"),
    path("api/change_like", views.change_like, name="change_like"),
    path("api/new_comment", views.new_comment, name="new_comment"),
    path("api/show_comments/<str:id>", views.show_comments, name="show_comments"),
    path("api/change_comment_like", views.change_comment_like, name="change_comment_like"),
]
