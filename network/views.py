from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
import json
import re

# Helpers

# I've commented out this code because the specification says 'date and time.' 
# This code allowed a date in the 'human-readable difference' format.
from .utils import is_edited, custom_timesince

# Models
from .models import User, Post, Follower, Like, Comment, CommentLike



def index(request):

    posts = Post.objects.order_by('-created_at')

    for post in posts:

        post.likes_count = post.likes.count()
        post.comments_count = post.comments.count()

        # Format Dates
        post.created_at_formatted = custom_timesince(post.created_at)
        post.updated_at_formatted = custom_timesince(post.updated_at)
        post.is_edited = is_edited(post.created_at, post.updated_at)
        
        # Auth
        if request.user.is_authenticated:
            # Already Liked
            post.already_liked = Like.objects.filter(user=request.user, post=post).first()

    # Paginator
    p = Paginator(posts, 10)

    if request.GET.get('page'):
        # Get the page number from the request
        page_number = request.GET.get('page')
    else:
        page_number = 1

    page = p.page(page_number)


    return render(request, "network/index.html", {
        "page": page
    })


def profile(request, username):

    user = User.objects.get(username=username)
    posts = Post.objects.filter(user=user.id).order_by('-created_at')
    already_followed = None

    for post in posts:
        post.likes_count = post.likes.count()
        post.comments_count = post.comments.count()

        # Format Dates
        post.created_at_formatted = custom_timesince(post.created_at)
        post.updated_at_formatted = custom_timesince(post.updated_at)
        post.is_edited = is_edited(post.created_at, post.updated_at)
        
        # Auth
        if request.user.is_authenticated:
            # Already Liked
            post.already_liked = Like.objects.filter(user=request.user, post=post).first()

    # Auth
    if request.user.is_authenticated:
        # Already Followed
        already_followed = Follower.objects.filter(user_follower=request.user, user_following=user).first()

    # Calculates followers and following
    count_following = Follower.objects.filter(user_follower=user).count()
    count_followers = Follower.objects.filter(user_following=user).count()

    # Paginator
    p = Paginator(posts, 10)

    if request.GET.get('page'):
        # Get the page number from the request
        page_number = request.GET.get('page')
    else:
        page_number = 1

    page = p.page(page_number)

    return render(request, "network/profile.html", {
        "page": page,
        "user_profile": user,
        "already_followed": already_followed,
        "count_followers": count_followers,
        "count_following": count_following
    })


def following(request):

    # Auth
    if request.user.is_authenticated:

        # Gets all following users
        following = Follower.objects.filter(user_follower=request.user)
        posts = []

        # Gets posts
        for follow in following:
            follow_posts = Post.objects.filter(user=follow.user_following)

            for post in follow_posts:
                posts.append(post)

        # Sorts posts by "created_at"
        posts = sorted(posts, key=lambda post: post.created_at, reverse=True)

        for post in posts:
            post.likes_count = post.likes.count()
            post.comments_count = post.comments.count()
            
            # Format Dates
            post.created_at_formatted = custom_timesince(post.created_at)
            post.updated_at_formatted = custom_timesince(post.updated_at)
            post.is_edited = is_edited(post.created_at, post.updated_at)
            
            # Already Liked
            post.already_liked = Like.objects.filter(user=request.user, post=post).first()

        # Paginator
        p = Paginator(posts, 10)

        if request.GET.get('page'):
            # Get the page number from the request
            page_number = request.GET.get('page')
        else:
            page_number = 1

        page = p.page(page_number)
        return render(request, "network/following.html", {
            "page": page
        })
    else:
        messages.error(request, 'Something went wrong')
        return redirect("login")



# API

@csrf_exempt
@login_required
def change_follow(request):
    
    if request.method == 'POST':

        data = json.loads(request.body)

        if data.get('userToFollowingId'):
            user_to_following_id = data.get('userToFollowingId')

            user_to_following = User.objects.get(pk=user_to_following_id)

            # Already Followed
            already_followed = Follower.objects.filter(user_follower=request.user, user_following=user_to_following).first()

            if already_followed:
                already_followed.delete()

                return JsonResponse({
                    "status": True
                }, status=200)
            else:
                follow = Follower(
                    user_follower = request.user,
                    user_following = user_to_following
                )
                follow.save()
                return JsonResponse({
                    "status": True
                }, status=200)

        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)

@csrf_exempt
@login_required
def change_like(request):

    if request.method == 'POST':

        data = json.loads(request.body)
        
        if data.get('postToLikeId'):

            post_to_like_id = data.get('postToLikeId')
            post_to_like = Post.objects.get(pk=post_to_like_id)
            post_already_liked = Like.objects.filter(user=request.user, post=post_to_like).first()

            if post_already_liked:
                post_already_liked.delete()

                return JsonResponse({
                    "status": True
                }, status=200)
            else:
                like = Like(
                    user = request.user,
                    post = post_to_like
                )
                like.save()

                return JsonResponse({
                    "status": True
                }, status=200)
        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)



@csrf_exempt
@login_required
def new_post(request):

    if request.method == "POST":

        # Post Validation
        data = json.loads(request.body)

        if data.get('postContent'):
            content = data.get('postContent')

            if( len(content) > 5 & len(content) < 550):

                # Save Post
                post = Post(
                    content = content,
                    user = request.user
                )
                post.save()

                return JsonResponse({
                    "status": True,
                    "post": post.serialize()
                }, status=200)
            
            else:
                return JsonResponse({"error": "Bad Request"}, status=400)
        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)
        

@csrf_exempt
@login_required
def update_post(request):

    if request.method == "POST":

        # Post Validation
        data = json.loads(request.body)

        if data.get('postContent') and data.get('postId'):
            content = data.get('postContent')
            id = data.get('postId')

            if len(content) > 5 & len(content) < 550:

                post = Post.objects.get(pk=id)

                if post.user == request.user:
                    # Save Post
                    post.content = content
                    post.save()

                    return JsonResponse({
                        "status": True,
                        "post": post.serialize()
                    }, status=200)
                else:
                    return JsonResponse({"error": "Forbidden"}, status=403)
            else:
                return JsonResponse({"error": "Bad Request"}, status=400)
        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)


@csrf_exempt
@login_required
def show_comments(request, id):

    if not id:
        return JsonResponse({"error": "Bad Request"}, status=400)
    # Validacion

    comments_json = []

    comments_db = Comment.objects.filter(post=id).order_by('created_at')

    for com in comments_db:
        
        # Auth
        if request.user.is_authenticated:
            # Already Liked
            already_liked = CommentLike.objects.filter(user=request.user, comment=com).exists()

        com.likes_count = com.likes.count()
        comments_json.append(com.serialize(already_liked))


    return JsonResponse({
        "status": True,
        "comments": comments_json
    }, status=200)



@csrf_exempt
@login_required
def new_comment(request):

    if request.method == "POST":

        # Comment Validation
        data = json.loads(request.body)

        if data.get('commentContent') and data.get('postId'):

            content = data.get('commentContent')
            post = Post.objects.get(pk=data.get('postId'))

            if( len(content) > 5 & len(content) < 550):

                # Save Comment
                comment = Comment(
                    content = content,
                    user = request.user,
                    post = post
                )
                comment.save()

                return JsonResponse({
                    "status": True,
                    "comment": comment.serialize()
                }, status=200)
            
            else:
                return JsonResponse({"error": "Bad Request"}, status=400)
        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)


@csrf_exempt
@login_required
def change_comment_like(request):

    if request.method == 'POST':

        data = json.loads(request.body)
        
        if data.get('commentToLikeId'):

            comment_to_like_id = data.get('commentToLikeId')
            comment_to_like = Comment.objects.get(pk=comment_to_like_id)
            comment_already_liked = CommentLike.objects.filter(user=request.user, comment=comment_to_like).first()

            if comment_already_liked:
                comment_already_liked.delete()

                return JsonResponse({
                    "status": True
                }, status=200)
            else:
                comment_like = CommentLike(
                    user = request.user,
                    comment = comment_to_like
                )
                comment_like.save()

                return JsonResponse({
                    "status": True
                }, status=200)
        else:
            return JsonResponse({"error": "Bad Request"}, status=400)
    else:
        return JsonResponse({"error": "Bad Request"}, status=400)
    








# Auth

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"].lower()
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        
        username = request.POST["username"].lower()
        # Verify that it is a valid username
        if not re.match("^[a-z0-9]*$", username):
            return render(request, "network/register.html", {
                "message": "Username must contain only letters and numbers."
            })
        
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
