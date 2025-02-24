import React from 'react';
import Layout from '../components/Layout';
import { getAllBlogPosts } from '../services/blogService';
import type { BlogPost } from '../types/blog';
import { Link } from 'react-router-dom';

interface BlogPageProps {
  posts: BlogPost[];
}

export default function BlogPage({ posts }: BlogPageProps) {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Blog</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="card overflow-hidden">
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600 text-sm mb-4">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
                {post.excerpt && (
                  <p className="text-gray-700 mb-4">{post.excerpt}</p>
                )}
                <Link 
                  to={`/blog/${post.slug}`}
                  className="btn btn-primary inline-block"
                >
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const posts = await getAllBlogPosts();
    return {
      props: { posts },
      revalidate: 60 // Revalidate every minute
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      props: { posts: [] },
      revalidate: 60
    };
  }
}