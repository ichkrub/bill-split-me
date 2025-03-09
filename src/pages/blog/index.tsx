import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { Helmet } from 'react-helmet-async';

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
          .select('*')
          .order('created_at', { ascending: false });

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
      {/* ✅ SEO Metadata for Blog Page */}
      <Helmet>
        <title>Blog | BillSplit Me</title>
        <meta name="description" content="Read the latest tips and guides on bill splitting, shared expenses, and financial planning with BillSplit Me." />
        <meta property="og:title" content="BillSplit Me Blog" />
        <meta property="og:description" content="Learn how to fairly split bills, rent, and travel expenses with ease." />
        <meta property="og:url" content="https://billsplit.me/blog" />
      </Helmet>

      {/* ✅ Ensure Full-Width Wrapper */}
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">Blog</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">
              Error: {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <article key={post.id} className="card flex flex-col h-full">
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-3xl"
                      loading="lazy"
                    />
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                    <time className="text-sm text-gray-500 mb-3 block">
                      {new Date(post.created_at).toLocaleDateString()}
                    </time>
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="mt-auto">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="btn btn-primary inline-flex items-center"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          
           {/* ✅ More Articles Section */}
           <div className="mt-12 border-t border-gray-200 pt-12 text-center">
            <h2 className="text-2xl font-bold mb-6">More Articles</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <div className="card border border-gray-200 p-6 rounded-lg w-full sm:w-1/3">
                    <p className="text-gray-500">More blog posts coming soon...</p>
                </div>
                <div className="card border border-gray-200 p-6 rounded-lg w-full sm:w-1/3">
                    <p className="text-gray-500">Stay tuned for updates!</p>
                </div>
            </div>
            </div>

          {/* ✅ Improved Newsletter Signup */}
          <div className="mt-16 bg-primary/10 py-12 px-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">📩 Stay Updated!</h2>
            <p className="text-gray-700 mb-6">
              Get the latest tips on bill splitting and group expenses. No spam, only valuable insights!
            </p>
            <form className="flex flex-col sm:flex-row justify-center items-center max-w-lg mx-auto gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full sm:flex-1 p-3 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:ring focus:ring-primary"
              />
              <button 
                type="submit" 
                className="btn btn-primary px-6 py-3 w-full sm:w-auto rounded-lg sm:rounded-r-lg sm:rounded-l-none"
              >
                Subscribe
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              By subscribing, you agree to receive our newsletter. You can unsubscribe at any time.
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
}