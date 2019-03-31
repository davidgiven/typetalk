TypeTalk
========

What?
-----

This is a proof-of-concept of a SmallTalk like live coding system running in the
browser, based on TypeScript. There's no server side component at all (other
than delivering static files). It'll let you update your code in a built-in
editor and it'll hot-patch the running system so that your code starts
working immediately, _even_ if there are objects existing which currently
running it.

Watch me talk about it!

<iframe width="560" height="315" src="https://www.youtube.com/embed/JDunc6Cr7YQ" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

[Or use the version hosted on cowlark.com if you want to try it for
real!](http://cowlark.com/typetalk/live.html)


Why?
----

It's an attempt to replicate the classic SmallTalk/Lisp paradigm which don't
distinguish between users and programmers: you can, if you wish, take the lid
off the application suite you're currently using and tinker with it, without
recompilation, restarts, or even having to save your work.

Currently it's a pile of fairly nasty hacks flying in loose formation, but it
does actually _work_. Mostly.


How?
----

It uses the TypeScript LanguageServices API to do code transformation and
compilation into Javascript. Your TypeScript is rewritten to match TypeTalk's
kinda weird object model, loaded, and methods are hot-patched into the
objects already existing on the system.

There are limitations: TypeTalk 'files' may each contain a single class or
interface, nothing else. So, type definitions, enums etc don't work. You
can't have static initialisers. You _can_ inherit from normal Javascript
objects, but it's dodgy as hell.

There's no documentation other than this page.

To use, simply serve this directory in a web server and load the `index.html`
page. No build stage is needed. The big files are deployed via CDN.

Please note that I developed it on Chrome, and it currently doesn't work on
Firefox; I don't know why. Something to do with scoping and `with{}`, I
think. TypeTalk's code generation appears to cause Firefox's debugger to go
nuts which makes it very hard to debug.


Who?
----

Everything here _except_ the contents of `lib` was written by me, David
Given. Feel free to send me an email at
[dg@cowlark.com](mailto:dg@cowlark.com). You may also [like to visit my
website](http://cowlark.com); there may or may not be something interesting
there.

All of my stuff is © 2019 David Given and is open source software
distributable under the terms of the [Apache
License](https://github.com/davidgiven/typetalk/blob/master/LICENSE).

The contents of `lib` contain TypeScript typings files, which are a mixture
of Apache license or MIT depending whether they came from Microsoft or
DefinitelyTyped. See the file headers for more information. Some of them have
had tiny tweaks to remove namespace exports (as TypeTalk doesn't use
modules).

The backdrop is by [jojo-ojoj from
DeviantArt](https://www.deviantart.com/jojo-ojoj/art/Old-paper-seamless-textures-507236128).
