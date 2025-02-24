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
      {/* ✅ Ensure Full-Width Wrapper */}
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8 gradient-text">Blog</h1>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="card overflow-hidden flex flex-col">
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  {post.excerpt && (
                    <p className="text-gray-700 mb-4 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="mt-auto">
                    <Link 
                      to={`/blog/${post.slug}`}
                      className="btn btn-primary inline-block"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
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