from django.contrib.auth.models import AbstractUser
from django.db import models

# Helpers
from .utils import custom_timesince

class User(AbstractUser):
    def __str__(self):
        return f"Username: {self.username}, Email: {self.email}"

class Follower(models.Model):
    user_follower = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "followers")
    user_following = models.ForeignKey(User, on_delete = models.CASCADE,related_name = "following")
    created_at = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user_follower": self.user_follower.username,
            "user_following": self.user_following.username,
            "created_at": custom_timesince(self.created_at)
        }
    
    def __str__(self):
        return f"The user {self.user_follower} follows the user {self.user_following}"

class Post(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "posts")
    content = models.CharField(max_length = 550)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "email": self.user.email,
            "content": self.content,
            # "created_at": custom_timesince(self.created_at),
            # "updated_at": custom_timesince(self.updated_at),
            "created_at": self.created_at.strftime("%b. %d, %Y, %I:%M %p"),
            "updated_at": self.updated_at.strftime("%b. %d, %Y, %I:%M %p"),
            "likes_count": self.likes.count()
        }

    def __str__(self):
        return f'Post: {self.id} The user {self.user} posts: "{self.content}" at: {self.created_at}'

class Like(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "likes")
    post = models.ForeignKey(Post, on_delete = models.CASCADE, related_name = "likes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"The user {self.user} likes the post: {self.post}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "comments")
    post = models.ForeignKey(Post, on_delete = models.CASCADE, related_name = "comments")
    content = models.CharField(max_length = 550)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def serialize(self, already_liked = False):
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "post": self.post.id,
            "created_at": custom_timesince(self.created_at),
            "updated_at": custom_timesince(self.updated_at),
            "likes_count": self.likes.count(),
            "already_liked": already_liked
        }
    
    def __str__(self):
        return f'The user {self.user} says: "{self.content}" on the post: {self.post}'

class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "comment_likes")
    comment = models.ForeignKey(Comment, on_delete = models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"The user {self.user} likes the comment {self.comment}"