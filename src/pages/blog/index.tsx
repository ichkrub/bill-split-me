import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  image_url?: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPosts() {
      try {
        console.log('Fetching posts...');
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*');

        if (error) {
          console.error('Supabase error:', error);
          setError(error.message);
          return;
        }

        console.log('Fetched posts:', data);
        setPosts(data || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-3xl"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map(post => (
              <article key={post.id} className="card">
                {post.image_url && (
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-3xl"
                    loading="lazy" // Lazy load images
                  />
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <time className="text-sm text-gray-500 mb-3 block">
                    {new Date(post.created_at).toLocaleDateString()}
                  </time>
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  )}
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="btn btn-primary inline-flex items-center"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}