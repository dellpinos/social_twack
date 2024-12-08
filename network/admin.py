from django.contrib import admin
from .models import User, Post, Comment, Like, CommentLike, Follower
# Register your models here.

admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(CommentLike)
admin.site.register(Follower)


