// frontend/src/pages/blogpages.jsx

import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SEO, Spinner, ArticleCard, ArticleCardSkeleton } from '../components';
import api from '../services';
import { NotFoundPage } from './errorpages';
import ReactMarkdown from 'react-markdown'; 
import rehypeRaw from 'rehype-raw'; 
import { LazyImage } from '../components/LazyImage';

// ========== ARTICLES PAGE (BLOG LISTING) ==========
export const ArticlesPage = () => {
    const { pathname } = useLocation();

    // Use React Query for caching and automatic state handling
    const { data: articles = [], isLoading, isError } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => {
            const { data } = await api.get('/api/articles');
            return data;
        },
        staleTime: 1000 * 60 * 10, // Cache blogs for 10 mins
    });

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': articles.map((article, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': `https://suryawave.me/blog/${article.slug}`,
            'name': article.title
        }))
    };

    return (
        <>
            <SEO 
                title="Blog" 
                description="Explore articles, tutorials, and insights on GATE preparation, final year projects, and technology from Surya Wave." 
                keywords="blog, articles, tutorials, GATE DA, tech projects"
                path={pathname}
            >
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </SEO>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-center mb-8">Our Blog</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
                    ) : isError ? (
                        <div className="col-span-full text-center text-red-500">Failed to load articles.</div>
                    ) : articles.length > 0 ? (
                        articles.map((article, index) => (
                            <motion.div
                                key={article._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.4 }}
                            >
                                <ArticleCard article={article} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600">
                            <p>No articles have been published yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ========== ARTICLE DETAIL PAGE ==========
export const ArticleDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Fetch Article with React Query
    const { data: article, isLoading, isError } = useQuery({
        queryKey: ['article', slug],
        queryFn: async () => {
            const { data } = await api.get(`/api/articles/${slug}`);
            return data;
        },
        retry: 1
    });

    if (isLoading) return <Spinner />;
    if (isError || !article) {
        // Optionally redirect in effect or just render Not Found
        return <NotFoundPage />;
    }

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `https://suryawave.me/blog/${article.slug}`,
        },
        'headline': article.title,
        'image': article.featuredImage,
        'datePublished': article.createdAt,
        'dateModified': article.updatedAt,
        'author': {
          '@type': 'Person',
          'name': article.author?.name || 'Surya Nallamothu',
        },
        'publisher': {
          '@id': 'https://suryawave.me/#organization',
        },
        'description': article.excerpt,
    };

    return (
        <>
            <SEO 
                title={article.title} 
                description={article.excerpt}
                keywords={article.tags?.join(', ') || ''}
                path={pathname}
                image={article.featuredImage}
            >
                <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
            </SEO>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-4xl"
            >
                <article className="bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
                    <div className="prose lg:prose-xl max-w-none">
                        <h1>{article.title}</h1>
                        <div className="text-sm text-gray-500 mb-6 not-prose">
                            <span>Published on {new Date(article.createdAt).toLocaleDateString()}</span>
                            {article.author && <span> by {article.author.name}</span>}
                        </div>
                        <LazyImage src={article.featuredImage} alt={article.title} className="w-full rounded-lg mb-8 h-auto" />
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                            {article.content}
                        </ReactMarkdown>
                    </div>
                </article>
            </motion.div>
        </>
    );
};