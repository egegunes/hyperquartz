---
note-type: blog
title: integrating standard.site with my hugo blog
date: 2026-06-07
tags:
---
If you are part of indieweb, you probably noticed people talking about [standard.site](https://standard.site/). It's a recent addition to [AT Protocol](https://atproto.com/) to publish long form content. You might think of it as [POSSE](https://indieweb.org/POSSE) on steroids.

I spent hours today figuring out how to integrate my blog with standard.site. It was not as hard as I thought thanks to [David Bushell](https://dbushell.com/2026/06/05/are-you-standard-site/) and [Mat Marquis](https://wil.to/posts/standard-site/).

he first thing you need to do is sign in and create a `site.standard.publication` record on [Atmosphere Explorer](https://pdsls.dev/):

```
{
  "url": "https://hypersubject.net",
  "name": "ege's weblog",
  "$type": "site.standard.publication",
  "description": "We must reclaim the cyberspace.",
  "preferences": {
    "showInDiscover": true
  }
}
```

Protip: Leave Collection and Record key empty when creating the record to use default values. Record keys are subject to [strict validation rules](https://atproto.com/specs/tid).

Then you need to create `.well-known/site.standard.publication` at the root of your site.

```
$ cat static/.well-known/site.standard.publication at://did:plc:32534e3a5wza2m3omyuflhm3/site.standard.publication/3mnmnwcnftk2i
```

`did:plc:32534e3a5wza2m3omyuflhm3` is my account, `3mnmnwcnftk2i` is the record key of the publication.

I also put the following into `<head>`:

```
<link 
	rel="site.standard.publication"
href="at://did:plc:32534e3a5wza2m3omyuflhm3/site.standard.publication/3mnmnwcnftk2i" />
```

This is all I needed to do to register my blog on AT Proto. The rest is creating `site.standard.document` for each blog post like this one:

```
{
  "path": "/entries/2026/01/we-must-reclaim-the-cyberspace",
  "site": "at://did:plc:32534e3a5wza2m3omyuflhm3/site.standard.publication/3mnmnwcnftk2i",
  "$type": "site.standard.document",
  "title": "we must reclaim the cyberspace",
  "publishedAt": "2026-01-01T09:33:17.000Z",
  "textContent": "The internet I grew up in no longer exists.\n\nThe internet, with its hyper-fast communication flows, was meant to enable the\nnew golden age for humanity. We were promised to have a global village where\ntribes transcend the limitations of geography. We could find our people\nwherever they were. Our ideas, our niche interests were supposed to connect us\nwith others in the vast network of nodes. If, only if, we can discover them.\n\nInstead, what we got is the commodification of communication. The connection\nthat was promised to us has been reformatted in terms of the market: \"How can a\npractice, experience, or feeling be monetized?\" Yes, discoverability is solved\nthanks to search engines and social media platforms. But now we connect, not to\neach other, but to the algorithm. We no longer contribute ideas to each other,\nbut to the circulation of the \"content\".\n\nWe must reclaim the cyberspace.",
  "canonicalUrl": "https://hypersubject.net/entries/2026/01/we-must-reclaim-the-cyberspace"
}
```

I didn't want to create records manually, so I started looking for solutions. To my surprise, I couldn't find an SDK for AT Proto in go. But there's [goat](https://github.com/bluesky-social/goat) (go at [protocol]). Unfortunately it didn't allow me to create `site.standard.document` records:

```
$ goat record create doc.json 
error: API request failed (HTTP 400): InvalidRequest: Unknown lexicon type: site.standard.document
```

Protip: Even though I couldn't use `goat` to create records, it can delete them. Since I figured out the integration through trial and error, it came in handy:

```
$ goat record ls did:plc:32534e3a5wza2m3omyuflhm3 \
	| grep document \
	| awk '{print $2}' \
	| xargs -I{} goat record delete -c site.standard.document -r {}
```

Then I found [Sequoia](https://sequoia.pub/). It's a "simple CLI for creating standard.site documents from your existing static blog." It's not that flexible (yet) but very simple to use.

```
$ sequoia auth # authenticate with an app password
$ sequoia init # configure publisher
$ sequoia publish # create site.standard.document records
$ sequoia inject # inject <link> elements to each blog post for validation
```

It's also able to post on Bluesky when you publish a new blog post. Very handy.

Finally, I confirmed that everything works with [Standard.site Validator](https://site-validator.fly.dev/).

I'm not sure if standard.site will turn out to be something important but today it feels like a good step forward for the indieweb. And since it's not intrusive and easy to integrate, I encourage you to publish your content on AT Protocol.