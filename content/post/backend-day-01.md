+++
title = "Day 01 — What a Backend Actually Does"
description = "A short Day 1 revision note on what a backend is, how a request reaches it, and where DNS, firewalls, Nginx, databases, and CORS fit in the picture."
date = 2026-10-17T04:45:00+05:00
weight = 2
showAuthor = false
showTableOfContents = false
showWordCount = false
categories = ["Learning"]
series = ["Backend Engineering Journey"]
tags = ["Backend Engineering", "HTTP", "DNS", "Nginx", "Servers"]
featureimage = "/img/writing/backend-day-01.svg"
featureimagealt = "Backend Engineering Journey Day 01 cover showing a request moving from a browser through DNS, firewall, Nginx, and a backend application"
articletype = "Learning · Day 01"
+++

Today was **Day 1 of my Backend Engineering Journey**. I started with the basic question: **what is a backend, and what actually happens before a request reaches it?**

## What I learned

A backend is a **server-side application** that listens for requests, processes data, talks to databases or other services, and returns a response.

The most useful mental model from today was:

```text
Browser → DNS → Server IP → Firewall → Nginx → Backend App → Database / Services → Response
```

A few parts of that flow became much clearer:

- **DNS** helps the browser find the server behind a domain.
- A server can allow or block traffic through **ports and firewall rules**. Common examples are `80` for HTTP, `443` for HTTPS, and `22` for SSH.
- **Nginx** can act as a reverse proxy, receiving internet traffic and forwarding it to an app running on a local port such as `localhost:3001`.
- **Frontend code** runs in the user's browser, while **backend code** runs on the server.
- The backend gives an application a central place to manage shared **data and state**.
- Databases are normally accessed through the backend instead of directly by every user's browser.
- I was also introduced to **connection pooling** and **CORS**, but I have not learned either deeply yet.

## My takeaway

Before today, I mostly thought of backend as **API + database**. Now I understand that several layers may exist before a request even reaches something like:

```js
app.get("/users", ...)
```

For revision, I should be able to explain **what a backend is, the basic request path, and the difference between frontend and backend execution**.

**Key terms:** DNS · A Record · CNAME · Ports · Firewall · EC2 · Nginx · Reverse Proxy · CORS · Connection Pool

**Next:** continue backend fundamentals and move gradually toward actual implementation.

**Source:** [What is a Backend, how do they work and why do we need them?](https://youtu.be/6Ss4dJD9Kzg)
