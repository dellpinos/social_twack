document.addEventListener('DOMContentLoaded', () => {
    
    // Images
    const imgIconEmpty = '/static/network/img/heart-empty.svg';
    const imgIconFull = '/static/network/img/heart-full.svg';
    const imgIconEdit = '/static/network/img/edit.svg';
    const imgIconComment = '/static/network/img/comment-white.svg';

    // Submit Post
    if(document.querySelector('#post-submit')) {

        const submitPost = document.querySelector('#post-submit');

        submitPost.addEventListener('click', async (e) => {
            e.preventDefault();

            // Post Text
            const txt = document.querySelector('#post-text');

            // Validation
            if(txt.value.length > 5 && txt.value.length < 550) {

                const data = {
                    postContent: txt.value
                }

                const urlNewPost = "/api/new_post";
                const response = await sendText(urlNewPost, data);

                if( response.status) {

                    // Render on posts
                    const postList = document.querySelector('#posts-list');
                    const newPost = formatPost(response.post);

                    // Delete error message
                    const formContainer = document.querySelector('.form__container');
                    const errorMsg = formContainer.querySelector('P');
                    if(errorMsg) if ( errorMsg.dataset.errorMsg ) errorMsg.remove();

                    postList.insertBefore(newPost, postList.firstChild);
                    txt.value = '';

                    if( document.querySelector('#posts-empty-msg')) document.querySelector('#posts-empty-msg').remove(); 
                }

            } else {
                const form = document.querySelector('FORM');
                const errorMsg = document.createElement('P');
                errorMsg.classList.add('c-red');
                errorMsg.textContent = "The message must be greater than 5 and less than 550 characters";
                errorMsg.dataset.errorMsg = true;

                form.insertBefore(errorMsg, form.children[1]);
            }
        });
    }

    if(document.querySelector('#btn-follow-change')) {

        // Follow code
        const btnFollow = document.querySelector('#btn-follow-change');
        const followers = document.querySelector('#followers');

        btnFollow.addEventListener('click', async () => {

            const url = "/api/change_follow";

            const data = {
                userToFollowingId: btnFollow.value
            }
            const result = await handleChanges(data, url);

            if( result.status ) {
                if( btnFollow.dataset.followed === "1" ) {
                    
                    btnFollow.textContent = "Follow";
                    btnFollow.dataset.followed = "0";
                    followers.textContent = parseInt(followers.textContent) - 1;

                } else {
                    
                    btnFollow.textContent = "Unfollow"
                    btnFollow.dataset.followed = "1";
                    followers.textContent = parseInt(followers.textContent) + 1;
                }
            }
        });
    }

    if(document.querySelector('.post__btn-like')) {

        // Likes code
        const btnsLike = document.querySelectorAll('.post__btn-like');
        const likeCounters = Array.from(document.querySelectorAll('.post__like-counter'));

        btnsLike.forEach(btnLike => {

            btnLike.addEventListener('click', async () => {

                const likeCounter = likeCounters.find( counter => counter.dataset.id === btnLike.value);
                const likesImg = btnLike.querySelector('IMG');

                changeLike(btnLike, likeCounter, likesImg);
            });
        });
    }

    if(document.querySelector('.post__btn-edit')) {

        // Edit code
        const btnsEdit = document.querySelectorAll('.post__btn-edit');

        btnsEdit.forEach( btn => {

            const postId = btn.dataset.id;
            const postCard = document.querySelector(`#post-container-${postId}`);
            const postContent = document.querySelector(`#post-content-${postId}`);
            const postDate = document.querySelector(`#post-date-${postId}`);
            
            btn.addEventListener('click', () => {

                editPost(btn, postContent, postDate, postCard, postId);
            });
        })
    }

    if (document.querySelector('.post__btn-comments')) {

        // Comments code
        const btnComments = document.querySelectorAll('.post__btn-comments');
        const containersComments = Array.from(document.querySelectorAll('.comments__container'));
        const listsComments = Array.from(document.querySelectorAll('.comments__list'));
        const commentsCounters = Array.from(document.querySelectorAll('.post__comment-counter'));

        btnComments.forEach( btn => {

            let flagCommentForm = true;

            btn.addEventListener('click', async () => {

                const container = containersComments.find( container => container.dataset.id === btn.value);
                const commentsCounter = commentsCounters.find( counter => counter.dataset.id === btn.value);
                container.classList.toggle('comments__container--hidden');

                if(flagCommentForm) {
    
                    const response  = await requestComments(btn.value);
                    const list = listsComments.find( list => list.dataset.id === btn.value);
                    const newCommentResult = newComment(list, btn, container, flagCommentForm, commentsCounter);

                    if (response.status) {
                        if (response.comments.length >= 1) {

                            response.comments.forEach( comment => {
                                const element = formatComment(comment.content, comment.user, comment.created_at, comment.id, comment.likes_count, comment.already_liked);
                                list.appendChild(element);
                            });
                        } else {

                            const msg = document.createElement('P');
                            msg.textContent = "There are no comments yet.";
                            msg.classList.add('comments__msg-empty');
                            msg.dataset.msg = true;

                            list.appendChild(msg);
                        }

                    } else {
                        throw new Error("Oops! Something went wrong");
                    }
                    flagCommentForm = false;
                }
            });
        });
    }

    async function postNewComment(e, input, list, postId){
        e.preventDefault();
        
        // Validation
        if(input.value.length > 5 && input.value.length < 550) {
            
            const data = {
                commentContent: input.value,
                postId
            }

            const urlNewPost = "/api/new_comment"
            const response = await sendText(urlNewPost, data);

            if( response.status) {
                const element = formatComment(response.comment.content, response.comment.user, response.comment.created_at, response.comment.id, response.comment.likes_count, response.comment.already_liked);

                list.appendChild(element);
                input.value = '';
            }
        } else {
            throw new Error("The message must be greater than 5 and less than 550 characters.");
        }
    }

    // Format Post
    function formatPost({user, content, created_at, id}) {

        // > Usename
        const userlink = document.createElement('A');
        userlink.textContent = user;
        userlink.href = `/wall/${user}`;
        userlink.classList.add('post__card-username-link');

        const postDate = document.createElement('P');
        postDate.textContent = '- ' + created_at;
        
        const cardUsername = document.createElement('DIV');
        cardUsername.classList.add('post__card-username');

        cardUsername.appendChild(userlink);
        cardUsername.appendChild(postDate);
        // > End Usename

        // Post Content
        const postContent = document.createElement('P');
        postContent.textContent = content;
        postContent.classList.add('post__content');

        // > Btns Container
        const btnsContainer = document.createElement('DIV');
        btnsContainer.classList.add('post__btns-container');

        // > Btn Like
        const btnLike = document.createElement('BUTTON');
        btnLike.classList.add('post__btn-like');
        btnLike.value = id;
        btnLike.dataset.liked = 0;

        const likesCounter = document.createElement('P');
        likesCounter.classList.add('post__like-counter');
        likesCounter.dataset.id = id;
        likesCounter.textContent = 0;

        const likesImg = document.createElement('IMG');
        likesImg.src = imgIconEmpty;
        likesImg.classList.add('post__icons');
        likesImg.width = "100px";
        likesImg.alt = "Like button";

        btnLike.appendChild(likesCounter);
        btnLike.appendChild(likesImg);
        // > End Btn Like

        // > Btn Edit
        const btnEdit = document.createElement('BUTTON');
        btnEdit.classList.add('post__btn-edit');
        btnEdit.dataset.id = id;

        const editImg = document.createElement('IMG');
        editImg.src = imgIconEdit;
        editImg.classList.add('post__icons');
        editImg.width = "100px";
        editImg.alt = "Edit button";

        btnEdit.appendChild(editImg);
        // > End Btn Edit

        // > Btn Comments
        const btnComments = document.createElement('BUTTON');
        btnComments.classList.add('post__btn-comments');
        btnComments.value = id;

        const commentsCounter = document.createElement('P');
        commentsCounter.classList.add('post__like-counter');
        commentsCounter.dataset.id = id;
        commentsCounter.textContent = 0;

        const commentImg = document.createElement('IMG');
        commentImg.src = imgIconComment;
        commentImg.classList.add('post__icons');
        commentImg.width = "100px";
        commentImg.alt = "Comment button";

        btnComments.appendChild(commentsCounter);
        btnComments.appendChild(commentImg);
        // > End Btn Comments

        btnsContainer.appendChild(btnLike);
        btnsContainer.appendChild(btnEdit);
        btnsContainer.appendChild(btnComments);
        // > End Btns Container

        // > Comments Container
        const commentsContainer = document.createElement('DIV');
        commentsContainer.classList.add('comments__container', 'comments__container--hidden');
        commentsContainer.dataset.id = id;

        const commentsList = document.createElement('UL');
        commentsList.classList.add('comments__list');
        commentsList.dataset.id = id;

        const msg = document.createElement('P');
        msg.textContent = "There are no comments yet.";
        msg.classList.add('comments__msg-empty');
        msg.dataset.msg = true;

        commentsList.appendChild(msg);

        commentsContainer.appendChild(commentsList);
        // > End Comments Container

        // > Post Card
        const newPost = document.createElement('LI');
        newPost.classList.add('post__card');

        newPost.appendChild(cardUsername);
        newPost.appendChild(postContent);
        newPost.appendChild(btnsContainer);
        newPost.appendChild(commentsContainer);
        // > End Post Card

        let flagCommentForm = true;
        
        btnComments.addEventListener('click', () => {
            
            if(flagCommentForm) {
                newComment(commentsList, btnComments, commentsContainer, flagCommentForm, commentsCounter);
                flagCommentForm = false;
                commentsContainer.classList.remove('comments__container--hidden');
            }
        });

        btnEdit.addEventListener('click', () => {
            editPost(btnEdit, postContent, postDate, newPost, id);
        })
        
        btnLike.addEventListener('click', async () => {
            changeLike(btnLike, likesCounter, likesImg);
        });

        return newPost;
    }

    async function changeLikeComment(btnLike, likesCounter, likesImg) {

        const url = "/api/change_comment_like";

        const data = {
            commentToLikeId: btnLike.value
        }
        const result = await handleChanges(data, url);

        if( result.status ) {

            if( btnLike.dataset.liked === "1" ) {
                
                likesImg.src = imgIconEmpty;
                btnLike.dataset.liked = "0";
                likesCounter.textContent = parseInt(likesCounter.textContent) - 1;
                
            } else {
                
                likesImg.src = imgIconFull;
                btnLike.dataset.liked = "1";
                likesCounter.textContent = parseInt(likesCounter.textContent) + 1;
            }
        }
    }

    async function changeLike(btnLike, likeCounter, likesImg){

        const url = "/api/change_like";
        
        const data = {
            postToLikeId: btnLike.value
        }
        const result = await handleChanges(data, url);

        if( result.status ) {

            if( btnLike.dataset.liked === "1" ) {
                
                likesImg.src = imgIconEmpty;
                btnLike.dataset.liked = "0";
                likeCounter.textContent = parseInt(likeCounter.textContent) - 1;

            } else {
                
                likesImg.src = imgIconFull;
                btnLike.dataset.liked = "1";
                likeCounter.textContent = parseInt(likeCounter.textContent) + 1;
            }
        }
    }

    function editPost(btn, postContent, postDate, postCard, postId) {

        // Hide elements
        btn.style.display = "none";
        postContent.style.display = "none";
        postDate.style.display = "none";

        const oldContent = postContent.textContent;
        const oldDate = postDate.textContent;

        const textEditorContainer = document.createElement('FORM');
        textEditorContainer.classList.add('edit__container');

        const btnsContainer = document.createElement('DIV');
        btnsContainer.classList.add('edit__btns-container');
        
        const textEditor = document.createElement('TEXTAREA');
        textEditor.classList.add('edit__input-txt');
        textEditor.value = postContent.textContent;

        const btnSave = document.createElement('BUTTON');
        btnSave.classList.add('edit__btn-save', 'btn');
        btnSave.textContent = "Save";
        
        const btnCancel = document.createElement('BUTTON');
        btnCancel.classList.add('edit__btn-cancel', 'btn');
        btnCancel.textContent = "Cancel";

        btnsContainer.appendChild(btnSave);
        btnsContainer.appendChild(btnCancel);

        textEditorContainer.appendChild(textEditor);
        textEditorContainer.appendChild(btnsContainer);

        postCard.insertBefore(textEditorContainer, postCard.children[1]);

        btnCancel.addEventListener('click', () => {

            postContent.textContent = oldContent;
            postDate.textContent = oldDate;

            // Show elements
            btn.style.display = "block";
            postContent.style.display = "block";
            postDate.style.display = "block";

            while( btnsContainer.firstChild) {
                btnsContainer.firstChild.remove();
            }
            btnsContainer.remove();

            while( textEditorContainer.firstChild) {
                textEditorContainer.firstChild.remove();
            }
            textEditorContainer.remove();
        });
        
        btnSave.addEventListener('click', async (e) => {
            e.preventDefault();

            // Validation
            if(textEditor.value.length > 5 && textEditor.value.length < 550) {
                
                const data = {
                    postContent: textEditor.value,
                    postId
                }
                
                const urlNewPost = "/api/update_post";
                const response = await sendText(urlNewPost, data);

                if( response.status) {

                    // Delete error message
                    const errorMsg = textEditorContainer.querySelector('P');
                    if( errorMsg) if( errorMsg.dataset.errorMsg ) errorMsg.remove();

                    postContent.textContent = textEditor.value;
                    postDate.textContent = " - " + response.post.updated_at + " (edited)";

                    // Show elements
                    btn.style.display = "block";
                    postContent.style.display = "block";
                    postDate.style.display = "block";

                    // Delete elements
                    while( btnsContainer.firstChild) {
                        btnsContainer.firstChild.remove();
                    }
                    btnsContainer.remove();
                    while( textEditorContainer.firstChild) {
                        textEditorContainer.firstChild.remove();
                    }
                    textEditorContainer.remove();

                } else {
                    throw new Error('Oops! Something went wrong.')
                }
            } else {
                const errorMsg = document.createElement('P');
                errorMsg.classList.add('c-red');
                errorMsg.textContent = "The message must be greater than 5 and less than 550 characters";
                errorMsg.dataset.errorMsg = true;

                textEditorContainer.insertBefore(errorMsg, textEditorContainer.children[1]);
            }
        });
    }

    function newComment(list, btn, container, flagCommentForm, commentsCounter) {

        let form;
        if(flagCommentForm) {
            form = commentForm();
            container.appendChild(form);
            flagCommentForm = false;
        } else {
            form = document.querySelector('#post-comment-form');
        }

        const inputSubmit = form.querySelector('INPUT');
        const inputText = form.querySelector('TEXTAREA');
            
        // Post comment
        const newCommentResult = inputSubmit.addEventListener('click', e => {

            e.preventDefault();
            if(inputText.value.length > 5 && inputText.value.length < 550) {

                // Delete default message
                const msg = form.querySelector('P');
                if (msg) if(msg.dataset.errorMsg ) msg.remove();

                postNewComment(e, inputText, list, btn.value);
                commentsCounter.textContent = parseInt(commentsCounter.textContent) + 1;
            } else {

                const errorMsg = document.createElement('P');
                errorMsg.classList.add('c-red');
                errorMsg.textContent = "The message must be greater than 5 and less than 550 characters";
                errorMsg.dataset.errorMsg = true;

                form.insertBefore(errorMsg, form.children[1]);
            }
        });
        
        return newCommentResult;
    }

    function commentForm() {
        // Form to post comment
        const form = document.createElement('FORM');
        form.id = 'post-comment-form';
        form.classList.add('comments_form')

        const inputText = document.createElement('TEXTAREA');
        inputText.classList.add("comments__input");
        inputText.maxlength = 550;
        inputText.placeholder = "What do you think?";

        const inputSubmitContainer = document.createElement('DIV');
        inputSubmitContainer.classList.add('comments__submit-container');

        const inputSubmit = document.createElement('INPUT');
        inputSubmit.type = "submit";
        inputSubmit.classList.add("comments__submit", "btn");
        inputSubmit.value = "Submit";
    
        inputSubmitContainer.appendChild(inputSubmit);
        form.appendChild(inputText);
        form.appendChild(inputSubmitContainer);

        return form;
    }

    // Format Comment
    function formatComment(content, user, created_at, commentId, likesCount, alreadyLiked) {

        // > Usename
        const userlink = document.createElement('A');
        userlink.textContent = user;
        userlink.href = `/wall/${user}`;

        userlink.classList.add('comment__card-username-link');
        const postDate = document.createElement('P');
        postDate.textContent = "- " + created_at;
        
        const cardUsername = document.createElement('DIV');
        cardUsername.classList.add('comment__card-username');

        cardUsername.appendChild(userlink);
        cardUsername.appendChild(postDate);
        // > End Usename

        // Comment Content
        const commentContent = document.createElement('P');
        commentContent.textContent = content;
        commentContent.classList.add('comment__content');

        // > Btns Container
        const btnsContainer = document.createElement('DIV');
        btnsContainer.classList.add('comment__btns-container');
        
        // > Btn Like
        const btnLike = document.createElement('BUTTON');
        btnLike.classList.add('comment__btn-like');
        btnLike.value = commentId;
        btnLike.dataset.liked = alreadyLiked ? "1" : "0";

        const likesCounter = document.createElement('P');
        likesCounter.classList.add('comment__like-counter');
        likesCounter.dataset.id = commentId;
        likesCounter.textContent = likesCount;

        const likesImg = document.createElement('IMG');
        likesImg.src = alreadyLiked ? imgIconFull : imgIconEmpty;
        likesImg.classList.add('comment__icons');
        likesImg.width = 100;
        likesImg.alt = "Like button";

        btnLike.appendChild(likesCounter);
        btnLike.appendChild(likesImg);
        // > End Btn Like

        btnsContainer.appendChild(btnLike);
        
        const element = document.createElement('LI');
        element.classList.add('comment__card');

        element.appendChild(cardUsername);
        element.appendChild(commentContent);
        element.appendChild(btnsContainer);

        btnLike.addEventListener('click', async () => {
            changeLikeComment(btnLike, likesCounter, likesImg);
        });

        return element;
    }

    // Request Comments
    async function requestComments(post_id) {
        try {

            url = `/api/show_comments/${post_id}`;
            const response = await fetch(url);
            const result = await response.json();

            return result;

        } catch (error) {
            throw new Error(error)
        }
    }

    // Change Follow or Like
    async function handleChanges(data, url){
        try {

            const opts = {
                method: "POST",
                body: JSON.stringify(data)
            }
            const response = await fetch(url, opts);
            const result = await response.json()

            return result;
        } catch (error) {
            throw new Error(error)
        }
    }

    // Send Text
    async function sendText(url, data) {
        try {
            
            const opts = {
                method: "POST",
                body: JSON.stringify(data)
            }
            const response = await fetch(url, opts);
            const result = await response.json();

            return result;

        } catch (error) {
            throw new Error(error);
        }
    }

})