import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import React from "react";
import remarkGfm from "remark-gfm";

const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id = props.children?.toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return <h2 {...props} id={id} />;
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const id = props.children?.toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return <h3 {...props} id={id} />;
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-x-4 text-xs text-zinc-500 mb-8">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>•</span>
          <span>{post.author}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-8">
          {post.title}
        </h1>
        <div className="prose prose-zinc max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
          <MDXRemote
            source={post.content}
            components={components}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>
      </div>
    </article>
  );
}
