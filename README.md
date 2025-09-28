# Microblogging Platform (Twitter Clone)

This project is a minimal microblogging platform inspired by Twitter.
Users can post short messages, like existing posts and receive
real‑time updates via Server‑Sent Events (SSE).  The application is
built entirely with Node.js core modules and vanilla JavaScript to
highlight core web development concepts without the overhead of
frameworks.

## Features

The microblogging server implements a number of features to provide
a robust user experience:

- **Posting** — create short posts via a form.  Inputs are
  validated to ensure the author name is non‑empty (≤ 50 characters)
  and the post content is non‑empty and does not exceed 280
  characters.  Invalid submissions produce descriptive errors.
- **Timeline** — view posts in reverse chronological order.  New
  posts appear automatically via SSE without needing to refresh.
- **Likes** — increment the like count of any post.  Like counts
  update in real time across all clients; attempts to like
  non‑existent posts are rejected with an error.
- **Real‑time updates** — uses SSE to push events for new posts and
  likes to connected clients.  The server sends periodic keep‑alive
  comments to maintain long‑lived connections and cleans up
  disconnected clients.
- **In‑memory storage** — retains only the most recent 100 posts
  in memory; older posts are discarded to bound memory usage.

To ensure robustness, a Python stress‑test script (`stress_test.py`) is
included.  It sends concurrent valid and invalid requests (posts
with missing or overly long fields, likes for unknown post IDs or
invalid identifiers) and prints the server’s responses.  Running
this script while the server is active helps verify that the
application handles edge cases gracefully and remains stable under
load.

## Technology Stack

| Layer       | Technology                                  |
| ----------- | ------------------------------------------- |
| Back end    | Node.js (`http`, `fs`, `url` modules)         |
| Front end   | Vanilla JavaScript, HTML and CSS             |
| Real‑time   | Server‑Sent Events (EventSource API)         |

## Running the Application

1. **Navigate to the project directory**

   ```bash
   cd twitter-clone-app
   ```

2. **Start the server**

   ```bash
   node server.js
   ```

   The server listens on port 5000 by default.  You can change the
   port by setting the `PORT` environment variable.

3. **Open the UI**

   Visit `http://localhost:5000` in multiple tabs or windows.  Enter
   your name and a message in the compose form to post.  Posts and
   likes update live across all clients.

## Extending the Project

1. **Database integration** — persist posts and likes using a database
   such as MongoDB or PostgreSQL.
2. **Authentication** — restrict posting and liking to authenticated
   users using sessions or JSON Web Tokens.
3. **Pagination** — implement infinite scroll or pagination for
   loading older posts beyond the in‑memory limit.
4. **Image uploads** — allow users to attach images or GIFs to
   posts using multipart uploads.

## License

The code in this repository is licensed under the MIT license.  Feel
free to adapt and expand it for your own learning or portfolio.