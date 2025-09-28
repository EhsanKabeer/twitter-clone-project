// script.js
//
// Client logic for the microblogging platform.  Handles form
// submission, renders posts, tracks likes and connects to the SSE
// endpoint for real‑time updates.  Designed to work without external
// libraries.

(() => {
  const postList = document.getElementById('post-list');
  const postForm = document.getElementById('post-form');
  const authorInput = document.getElementById('author');
  const contentInput = document.getElementById('content');

  /**
   * Keep a map of post IDs to their corresponding DOM elements for
   * efficient updates.
   * @type {Map<number, HTMLElement>}
   */
  const postElements = new Map();

  /**
   * Create and insert a post DOM element based on the supplied data.
   *
   * @param {{id:number, author:string, content:string, timestamp:number, likes:number}} post
   */
  function renderPost(post) {
    let li = postElements.get(post.id);
    if (!li) {
      li = document.createElement('li');
      li.className = 'post';
      li.dataset.id = post.id;
      postElements.set(post.id, li);
      postList.insertBefore(li, postList.firstChild);
    }
    li.innerHTML = '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const date = new Date(post.timestamp);
    meta.textContent = `${post.author} • ${date.toLocaleString()}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.textContent = post.content;
    const actions = document.createElement('div');
    actions.className = 'actions';
    const likeBtn = document.createElement('button');
    likeBtn.textContent = 'Like';
    likeBtn.addEventListener('click', () => likePost(post.id));
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = `${post.likes} ${post.likes === 1 ? 'Like' : 'Likes'}`;
    actions.appendChild(likeBtn);
    actions.appendChild(likeCount);
    li.appendChild(meta);
    li.appendChild(contentDiv);
    li.appendChild(actions);
  }

  /**
   * Update the like count for a specific post.
   *
   * @param {number} id
   * @param {number} likes
   */
  function updateLikeCount(id, likes) {
    const li = postElements.get(id);
    if (!li) return;
    const span = li.querySelector('.like-count');
    if (span) {
      span.textContent = `${likes} ${likes === 1 ? 'Like' : 'Likes'}`;
    }
  }

  /**
   * Send a like for the specified post ID.
   *
   * @param {number} id
   */
  async function likePost(id) {
    try {
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to like post', err);
    }
  }

  /**
   * Handle form submission to create a new post.
   *
   * @param {Event} e
   */
  async function handlePostSubmit(e) {
    e.preventDefault();
    const author = authorInput.value.trim();
    const content = contentInput.value.trim();
    if (!author || !content) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Post failed', data.error);
      }
      contentInput.value = '';
    } catch (err) {
      console.error('Error posting', err);
    }
  }

  /**
   * Initialize SSE connection for receiving live updates.
   */
  function initEventSource() {
    const source = new EventSource('/events');
    source.addEventListener('init', (event) => {
      try {
        const initialPosts = JSON.parse(event.data);
        initialPosts.forEach(post => renderPost(post));
      } catch (err) {
        console.error('Failed to parse init data', err);
      }
    });
    source.addEventListener('post', (event) => {
      try {
        const post = JSON.parse(event.data);
        renderPost(post);
      } catch (err) {
        console.error('Failed to parse post data', err);
      }
    });
    source.addEventListener('like', (event) => {
      try {
        const { id, likes } = JSON.parse(event.data);
        updateLikeCount(id, likes);
      } catch (err) {
        console.error('Failed to parse like data', err);
      }
    });
    source.onerror = (err) => {
      console.error('SSE error', err);
    };
  }

  // Initialize the app
  function init() {
    postForm.addEventListener('submit', handlePostSubmit);
    initEventSource();
  }

  window.addEventListener('DOMContentLoaded', init);
})();