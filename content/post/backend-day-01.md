+++
title = "Day 01 — What a Backend Actually Does"
description = "My Day 1 backend engineering notes: what a backend is, how a request reaches it, why frontend and backend execution differ, and where DNS, ports, Nginx, databases, and CORS fit in the picture."
date = 2026-10-17T04:45:00+05:00
weight = 2
showAuthor = false
showTableOfContents = true
showWordCount = false
categories = ["Learning"]
series = ["Backend Engineering Journey"]
tags = ["Backend Engineering", "HTTP", "DNS", "Nginx", "Servers"]
featureimage = "/img/writing/backend-day-01.svg"
featureimagealt = "Backend Engineering Journey Day 01 cover showing a request moving from a browser through DNS, firewall, Nginx, and a backend application"
articletype = "Learning · Day 01"
+++

Today was **Day 1 of my Backend Engineering Journey**.

I started with the foundation: **what a backend actually is, how a request reaches it, and why we need server-side code in the first place**.

These are not meant to be polished tutorial notes. They are written so I can come back later and quickly revise what I understood that day, while also keeping a public record of how my backend knowledge is growing over time.

## 60-second revision

If I come back to this page later, these are the points I should remember first:

- A **backend is a server-side application that listens for requests from clients**.
- It can receive data, process it, fetch or store data, and return a response.
- A request does not directly jump from the browser into my backend function.
- A simplified request path can look like this:

```text
Browser
  ↓
DNS
  ↓
Server IP
  ↓
Firewall / Security Group
  ↓
Nginx
  ↓
Backend Application
```

- **Frontend code runs on the user's device.**
- **Backend code runs on the server.**
- The backend gives an application a central place to manage **data and state**.
- Browsers are intentionally restricted for security.
- Databases should normally be accessed through the backend rather than directly by every client.
- Nginx can sit in front of the backend as a **reverse proxy**.

If I remember these points, I remember the main lesson from Day 1.

## 1. What is a backend?

Before today, my simple mental model was mostly:

```text
API + Database
```

That is not completely wrong, but it is incomplete.

A better mental model for me now is:

> A backend is an application running on a server that waits for requests, performs some work, and returns a response.

That work can include:

- receiving data
- validating data
- processing data
- fetching data
- storing data
- communicating with another service
- returning files
- returning JSON
- performing some action

A lot of backend engineering eventually comes back to **data** — receiving it, processing it, storing it, and sending it where it needs to go.

## 2. How does a request reach the backend?

This was the part I found most useful today.

It is easy to write something like:

```js
app.get("/users", ...)
```

and think:

> Someone requests `/users`, then this code runs.

But several things can happen before that request reaches the application.

The simplified flow I learned is:

```text
User
 ↓
Browser
 ↓
DNS
 ↓
Public Server IP
 ↓
Firewall
 ↓
Nginx
 ↓
Backend Application
```

I do not need to master every layer yet. The goal for Day 1 was simply to understand where each one fits.

## 3. DNS

Humans prefer names such as:

```text
example.com
```

Computers communicate using IP addresses.

DNS helps connect those two ideas by helping the browser find where a domain should go.

A simplified view is:

```text
example.com
      ↓
server IP
```

Two DNS record types came up today:

### A Record

An **A Record** points a domain or subdomain toward an IP address.

```text
api.example.com
       ↓
52.x.x.x
```

### CNAME

A **CNAME** points one domain name toward another domain name.

I am not trying to learn DNS deeply yet.

For revision, the important idea is:

> **DNS helps the browser find the server.**

## 4. The server

The video used an **AWS EC2 instance** as an example.

Conceptually, I can think of EC2 as a computer running somewhere else. My backend application can run on that machine just like a program can run on my own laptop.

For example:

```text
AWS EC2 Server

Node.js application
running on:
localhost:3001
```

But users should not need to know that an application is running on something like `localhost:3001` inside the server.

That is where a reverse proxy such as Nginx can help.

## 5. Firewall and ports

A server should not automatically accept every type of incoming connection.

Traffic can be controlled through firewall or security rules.

Some ports introduced in the video were:

| Port | Common use |
|---|---|
| `80` | HTTP |
| `443` | HTTPS |
| `22` | SSH |

So even when an application is running correctly, incoming traffic still has to be allowed to reach the server.

My current mental model is:

```text
Request arrives
      ↓
Is this traffic allowed?
      ↓
YES → continue
NO  → block
```

## 6. Nginx and reverse proxy

Another new concept for me today was a **reverse proxy**.

The video used Nginx.

The basic idea I currently understand is:

```text
Internet
   ↓
Nginx
   ↓
Backend
```

Instead of exposing the backend application directly, Nginx can receive incoming traffic and forward it to the correct application running inside the server.

Example:

```text
api.example.com
      ↓
    Nginx
      ↓
localhost:3001
      ↓
Node.js Backend
```

For now, this is enough for me to remember:

> **Reverse proxy = receives requests on behalf of another server or application and forwards them to the correct destination.**

I have not configured Nginx myself yet, so I do not consider this topic learned deeply.

## 7. Frontend vs backend execution

This distinction became much clearer today.

### Frontend

The server can send things such as:

```text
HTML
CSS
JavaScript
Images
Fonts
```

to the browser.

The browser then executes the frontend JavaScript on the **user's device**.

```text
Server
   ↓
JavaScript
   ↓
Browser
   ↓
Executed on user's machine
```

### Backend

Backend code stays on the server.

```text
Browser
   ↓
Request
   ↓
Server
   ↓
Backend code executes
   ↓
Response
   ↓
Browser
```

The simplest way for me to remember the difference is:

> **Frontend code goes to the user. Backend requests go to the server.**

## 8. Why do we need a backend?

The social-media Like example made this easier to understand.

Suppose I like someone's post.

A simplified flow could be:

```text
I press Like
      ↓
Request goes to backend
      ↓
Backend knows who I am
      ↓
Find the post
      ↓
Store the Like
      ↓
Find the post owner
      ↓
Trigger notification
```

There are multiple users involved, shared data involved, and application state involved.

My browser cannot be the central source of truth for the whole application.

The backend provides that central system.

## 9. Why not do everything in the frontend?

Several reasons connected together here.

### Security

Browser JavaScript runs inside a restricted environment.

A random website should not automatically be able to access:

```text
My files
My operating system
Other applications
Sensitive machine data
```

That restriction is part of the browser's security model.

### Databases

Having every browser directly connect to the database would be a bad design.

A much better shape is:

```text
Users
  ↓
Backend
  ↓
Database
```

The backend controls database access instead of exposing the database directly to clients.

### Computing power

Users can access an application from very different devices.

One person may have a powerful desktop while another may have an older phone.

A backend gives us controlled server-side computing resources rather than assuming every client can handle the same workload.

## 10. Database connection pooling

I also came across the basic idea of a **connection pool**.

Creating a completely new database connection for every request would be inefficient.

Instead, a backend can keep a group of reusable connections available.

```text
Backend
   ↓
Connection Pool

[Connection]
[Connection]
[Connection]
[Connection]
```

Requests can use available connections instead of constantly creating new ones from scratch.

I only understand the idea right now. I have not implemented this yet.

## 11. CORS — only the idea for now

I also came across **CORS** today.

I am deliberately not trying to go deep into it yet.

My current understanding is:

> Browsers have security rules around requests between different origins, and CORS is related to how servers tell browsers which cross-origin requests are allowed.

That is enough for Day 1. I will revisit CORS when I actually start building and connecting APIs.

## My mental model after Day 1

Before today, I mostly pictured this:

```text
Frontend
   ↓
API
   ↓
Database
```

Now I see a bigger picture:

```text
USER
 ↓
BROWSER
 ↓
DNS
 ↓
INTERNET
 ↓
SERVER
 ↓
FIREWALL
 ↓
NGINX
 ↓
BACKEND APPLICATION
 ↓
DATABASE / OTHER SERVICES
 ↓
RESPONSE
 ↓
USER
```

That is the mental model I want to remember from this first day.

## New terms from Day 1

| Term | What I currently understand |
|---|---|
| **Backend** | Server-side application handling requests and data |
| **Client** | Something requesting a service, such as a browser |
| **Server** | Computer or application providing a service |
| **DNS** | Helps a domain resolve to the location of a server |
| **A Record** | Domain → IP address |
| **CNAME** | Domain → another domain |
| **Port** | Network endpoint used by a service |
| **Firewall** | Controls what incoming or outgoing traffic is allowed |
| **EC2** | AWS virtual server |
| **Nginx** | Web server commonly used as a reverse proxy |
| **Reverse Proxy** | Receives requests and forwards them to another server/app |
| **localhost** | The current machine itself |
| **CORS** | Browser/server mechanism related to cross-origin requests |
| **Connection Pool** | Reusable set of database connections |

I do not consider all of these concepts **learned deeply** yet.

They are the terms I encountered today and can now place approximately in the overall backend request flow.

## What can I explain after Day 1?

This is the part I want to keep in every entry because it gives me a more honest measure of progress than simply writing "I watched a video."

- [x] What a backend is at a basic level
- [x] Why applications need a backend
- [x] Difference between frontend and backend execution
- [x] Basic path of a request from browser to backend
- [x] Basic role of DNS
- [x] Basic role of ports and firewalls
- [x] What a reverse proxy does
- [x] Why browsers should not directly manage databases
- [x] Basic idea behind connection pooling
- [ ] Configure Nginx myself
- [ ] Deploy a backend to EC2 myself
- [ ] Explain CORS deeply
- [ ] Implement a database connection pool myself

The unchecked items matter too. They show the difference between **something I have been introduced to** and **something I can actually implement**.

## Revision questions for future me

When I revisit Day 1, I should be able to answer these without reading the notes first.

### 1. What is a backend?

A server-side application that receives requests, performs work, handles data, and returns responses.

### 2. Where does frontend JavaScript execute?

In the user's browser or device.

### 3. Where does backend code execute?

On the server.

### 4. What does DNS basically do?

It helps map a domain name to where the server can be reached.

### 5. What is a reverse proxy?

A server that receives requests and forwards them to another application or server.

### 6. Why should users not connect directly to the database?

Because the backend should control access, security, application logic, scalability, and connection management.

### 7. What is connection pooling?

Keeping reusable database connections instead of creating a completely new connection for every request.

### 8. What was today's request flow?

```text
Browser → DNS → Server → Firewall → Nginx → Backend
```

If I can answer these quickly, the main ideas from Day 1 are still clear in my mind.

## Day 1 takeaway

The biggest thing I learned today was not a Node.js function or a framework.

It was understanding **where the backend actually exists in the complete flow of an application**.

Now when I eventually write something like:

```js
app.get("/users", ...)
```

I want to remember that the request may already have travelled through several layers before it reaches that line of code.

## Journey status

**Day:** 01  
**Stage:** Foundations  
**Type of learning:** Conceptual foundation  
**Practical implementation today:** None yet  
**Next:** Continue strengthening the fundamentals before moving deeper into implementation.

## Source for today's study

I studied these ideas from this video:

[**What is a Backend, how do they work and why do we need them?**](https://youtu.be/6Ss4dJD9Kzg)

These notes reflect what I understood from today's study session and what I want to be able to revise later. I will revisit the deeper topics — Nginx configuration, CORS, deployment, and connection pooling — when I actually implement them.
