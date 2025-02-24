import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Helmet } from 'react-helmet-async'; // ✅ Import Helmet for SEO

interface BlogPost {
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPost() {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          setError(error.message);
          return;
        }

        setPost(data);
      } catch (err) {
        setError('Failed to fetch post');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout>
      {/* ✅ Add SEO Metadata */}
      {post && (
        <Helmet>
          <title>{post.title} | BillSplit Me</title>
          <meta name="description" content={post.content.substring(0, 150)} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.content.substring(0, 150)} />
          <meta property="og:image" content={post.image_url || 'https://billsplit.me/default-image.jpg'} />
          <meta property="og:url" content={`https://billsplit.me/blog/${slug}`} />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link 
          to="/blog" 
          className="btn btn-secondary inline-flex items-center mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            Error: {error}
          </div>
        ) : post ? (
          <article>
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full md:h-80 h-auto object-cover rounded-2xl mb-8"
                loading="lazy" // Lazy load images
              />
            )}
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <time className="text-gray-600 mb-8 block">
              {new Date(post.created_at).toLocaleDateString()}
            </time>
            {/* ✅ Use ReactMarkdown to render Markdown properly */}
            <div className="prose prose-lg max-w-none leading-relaxed">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* ✅ Add "Try BillSplit Me Now" Banner */}
        <div className="mt-12 bg-primary/10 py-8 px-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Split Bills Easily?</h2>
          <p className="text-gray-700 mb-6">
            Try BillSplit Me now and make splitting bills with friends a breeze!
          </p>
          <Link 
            to="/" 
            className="btn btn-primary text-lg py-3 px-6 inline-flex items-center gap-2"
          >
            Try BillSplit Me Now
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </Layout>
  );
}