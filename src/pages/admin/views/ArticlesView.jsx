import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSpinner, faEye } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services';
import { AdminContentSkeleton } from '../AdminComponents';
import { AddArticleForm, ArticlePreview } from '../AdminForms';

export const ArticlesView = ({ getRenderData, actionLoading, setActionLoading }) => {
    const queryClient = useQueryClient();
    const { data: articles = [], isLoading } = useQuery({
        queryKey: ['articles'],
        queryFn: async () => (await api.get('/api/articles')).data,
    });

    const [editingArticle, setEditingArticle] = useState(null);
    const [previewArticle, setPreviewArticle] = useState(null);

    const handleEditArticleClick = (article) => { setEditingArticle(article); setPreviewArticle(article); };
    const handleCancelEditArticle = () => { setEditingArticle(null); setPreviewArticle(null); };
    
    const handleArticleUpdated = (updated) => { 
        queryClient.setQueryData(['articles'], old => old.map(a => a._id === updated._id ? updated : a));
        handleCancelEditArticle(); 
    };
    const handleArticleAdded = (added) => { 
        queryClient.setQueryData(['articles'], old => [added, ...old]);
        setPreviewArticle(null); 
    };

    const handleDeleteArticle = async (id) => { 
        if(window.confirm('DELETE this article?')) { 
            setActionLoading({ type: 'delete-article', id }); 
            try { 
                await api.delete(`/api/admin/articles/${id}`); 
                toast.success('Article deleted!'); 
                queryClient.setQueryData(['articles'], old => old.filter(a => a._id !== id));
                if (editingArticle?._id === id) handleCancelEditArticle(); 
            } catch (e) { /* Handled by interceptor */ } 
            finally { setActionLoading({ type: null, id: null }); } 
        } 
    };

    if (isLoading) return <AdminContentSkeleton />;

    const displayedArticles = getRenderData(articles);

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
                <AddArticleForm
                    key={editingArticle ? editingArticle._id : 'new-article'}
                    articleToEdit={editingArticle}
                    onArticleAdded={handleArticleAdded}
                    onArticleUpdated={handleArticleUpdated}
                    onCancelEdit={handleCancelEditArticle}
                    onFormChange={setPreviewArticle}
                />
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Existing Articles</h2>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {displayedArticles.map(article => (
                            <div key={article._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <strong className="block">{article.title}</strong>
                                    <span className="text-sm text-gray-500">Published: {new Date(article.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleEditArticleClick(article)} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                    <button onClick={() => handleDeleteArticle(article._id)} disabled={actionLoading.id === article._id} className="w-20 flex items-center justify-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded disabled:bg-red-300 hover:bg-red-600">
                                        {actionLoading.type === 'delete-article' && actionLoading.id === article._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-700"><FontAwesomeIcon icon={faEye} />Live Preview</div>
                <div className="border-4 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 p-2 flex items-center gap-2"><span className="h-3 w-3 bg-red-500 rounded-full"></span><span className="h-3 w-3 bg-yellow-500 rounded-full"></span><span className="h-3 w-3 bg-green-500 rounded-full"></span></div>
                    <div className="max-h-[75vh] overflow-y-auto bg-white p-6">
                        <ArticlePreview article={previewArticle || editingArticle} />
                    </div>
                </div>
            </div>
        </div>
    );
};