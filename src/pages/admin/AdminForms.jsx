// frontend/src/pages/admin/AdminForms.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, faPlus, faSpinner, faHeading, faParagraph, 
    faImage, faFileAlt, faWallet, faKeyboard, faFileLines,
    faTrash, faRetweet, faCheckCircle, faVideo
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services';

// Helper to generate unique IDs
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ========== Article Preview Component ==========
export const ArticlePreview = ({ article }) => {
    if (!article || !article.title) {
        return (
            <div className="border-4 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-500 h-full flex flex-col items-center justify-center min-h-[200px]">
                <p className="font-medium">Article preview</p>
                <p className="text-sm">Start typing in the form to see live updates.</p>
            </div>
        );
    }
    return (
        <div className="prose lg:prose-lg max-w-none p-4 sm:p-6 bg-white">
            <h1>{article.title}</h1>
            {article.featuredImage && <img src={article.featuredImage} alt={article.title} className="w-full rounded-lg mb-8 object-cover max-h-64" />}
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {article.content}
            </ReactMarkdown>
        </div>
    );
};

// ========== Add/Edit Article Form Component ==========
export const AddArticleForm = ({ articleToEdit, onArticleAdded, onArticleUpdated, onCancelEdit, onFormChange }) => {
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);
  
    const resetForm = useCallback(() => {
        setTitle(''); setExcerpt(''); setContent(''); setFeaturedImage(''); setTags('');
    }, []);

    useEffect(() => {
        if (onFormChange) {
            onFormChange({ title, excerpt, content, featuredImage, tags: tags.split(',').map(t => t.trim()) });
        }
    }, [title, excerpt, content, featuredImage, tags, onFormChange]);
    
    useEffect(() => { 
        if (articleToEdit) { 
            setTitle(articleToEdit.title); 
            setExcerpt(articleToEdit.excerpt);
            setContent(articleToEdit.content);
            setFeaturedImage(articleToEdit.featuredImage);
            setTags((articleToEdit.tags || []).join(', '));
        } else { 
            resetForm(); 
        } 
    }, [articleToEdit, resetForm]);

    const handleSubmit = async (e) => {
      e.preventDefault(); setLoading(true);
      const articleData = { title, excerpt, content, featuredImage, tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag) };
      try {
        if (articleToEdit) { 
            const { data } = await api.put(`/api/admin/articles/${articleToEdit._id}`, articleData); 
            toast.success('Article updated!'); 
            onArticleUpdated(data); 
        } else { 
            const { data } = await api.post('/api/articles', articleData); 
            toast.success('Article added!'); 
            onArticleAdded(data); 
            resetForm(); 
        }
      } catch (error) { /* Handled by interceptor */ } 
      finally { setLoading(false); }
    };

    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border text-left">
        <h3 className="text-lg font-semibold mb-4">{articleToEdit ? 'Edit Article' : 'Add a New Article'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input type="text" placeholder="Article Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow"/>
            <input type="text" placeholder="Featured Image URL" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow"/>
          </div>
          <textarea placeholder="Excerpt (Short summary)" value={excerpt} onChange={e => setExcerpt(e.target.value)} required className="w-full p-2.5 border rounded-lg h-24 focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow"/>
          <textarea placeholder="Full Content (Markdown supported)" value={content} onChange={e => setContent(e.target.value)} required className="w-full p-2.5 border rounded-lg h-48 focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow font-mono text-sm"/>
          <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow"/>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-google-blue text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-colors shadow-sm">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={articleToEdit ? faEdit : faPlus} />}
                {loading ? 'Saving...' : (articleToEdit ? 'Update Article' : 'Add Article')}
            </button>
            {articleToEdit && (
              <button type="button" onClick={onCancelEdit} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
            )}
          </div>
        </form>
      </div>
    );
};

// ========== Add/Edit Service Form Component ==========
export const AddServiceForm = ({ serviceToEdit, onServiceAdded, onServiceUpdated, onCancelEdit, onFormChange }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [contentUrls, setContentUrls] = useState([{ name: '', url: '' }]);
    const [serviceType, setServiceType] = useState('standard');
    
    // Lists with internal IDs
    const [pageContent, setPageContent] = useState([]);
    const [srsForm, setSrsForm] = useState([{ uuid: generateId(), blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]);
    
    // SWAP STATE
    const [swapSourceIndex, setSwapSourceIndex] = useState(null);
    const [swapListType, setSwapListType] = useState(null); // 'page' or 'srs'

    const [loading, setLoading] = useState(false);
  
    const resetForm = useCallback(() => { 
        setTitle(''); setDescription(''); setPrice(''); setAdvanceAmount(''); 
        setImageUrl(''); setContentUrls([{ name: '', url: '' }]); 
        setPageContent([]); setServiceType('standard'); 
        setSrsForm([{ uuid: generateId(), blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]); 
        setSwapSourceIndex(null); setSwapListType(null);
    }, []);
    
    useEffect(() => { 
        if (onFormChange) { 
            const autoCategory = serviceType === 'standard' ? 'Standard' : 'Advanced';
            const serviceData = { 
                title, description, price: Number(price) || 0, advanceAmount: Number(advanceAmount) || 0, 
                category: autoCategory, imageUrl, contentUrls, pageContent, serviceType, srsForm, 
                currentPrice: Number(price) || 0, offer: serviceToEdit?.offer 
            };
            onFormChange(serviceData); 
        } 
    }, [title, description, price, advanceAmount, imageUrl, contentUrls, pageContent, serviceType, srsForm, onFormChange, serviceToEdit]);

    useEffect(() => { 
        if (serviceToEdit) { 
            setTitle(serviceToEdit.title); 
            setDescription(serviceToEdit.description); 
            setPrice(serviceToEdit.price ? serviceToEdit.price.toString() : ''); 
            setAdvanceAmount(serviceToEdit.advanceAmount ? serviceToEdit.advanceAmount.toString() : '');
            setImageUrl(serviceToEdit.imageUrl); 
            setContentUrls(serviceToEdit.contentUrls && serviceToEdit.contentUrls.length > 0 ? serviceToEdit.contentUrls : [{ name: '', url: '' }]); 
            
            setPageContent((serviceToEdit.pageContent || []).map(item => ({...item, uuid: item.uuid || generateId()}))); 
            
            setServiceType(serviceToEdit.serviceType || 'standard');
            
            if (serviceToEdit.srsForm && serviceToEdit.srsForm.length > 0) {
                const mappedForm = serviceToEdit.srsForm.map(item => ({
                    ...item,
                    blockType: item.blockType || 'input',
                    uuid: item.uuid || generateId()
                }));
                setSrsForm(mappedForm);
            } else {
                setSrsForm([{ uuid: generateId(), blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]);
            }
        } else { 
            resetForm(); 
        } 
    }, [serviceToEdit, resetForm]);

    // --- Page Content Helpers ---
    const handlePaidContentChange = (index, event) => { const values = [...contentUrls]; values[index][event.target.name] = event.target.value; setContentUrls(values); };
    const addPaidContentField = () => { setContentUrls([...contentUrls, { name: '', url: '' }]); };
    const removePaidContentField = index => { setContentUrls(prevUrls => prevUrls.filter((_, i) => i !== index)); };
    
    const addPageContentBlock = (type) => { 
        const newBlock = { type, uuid: generateId() }; 
        if (type === 'heading' || type === 'subheading' || type === 'paragraph') newBlock.value = ''; 
        if (type === 'image') { newBlock.url = ''; newBlock.alt = ''; } 
        if (type === 'file') { newBlock.url = ''; newBlock.value = ''; newBlock.iconUrl = ''; } 
        if (type === 'video') { newBlock.url = ''; } // New Video Block
        setPageContent([...pageContent, newBlock]); 
    };

    const handlePageContentChange = (uuid, field, value) => { 
        setPageContent(prev => prev.map(item => item.uuid === uuid ? { ...item, [field]: value } : item));
    };

    const removePageContentBlock = (index) => { 
        setPageContent(prev => prev.filter((_, i) => i !== index)); 
        if (swapListType === 'page' && swapSourceIndex === index) {
            setSwapSourceIndex(null);
            setSwapListType(null);
        }
    };

    // --- Advanced Requirement Helpers ---
    const addSrsBlock = (type) => {
        let newBlock = { blockType: type, uuid: generateId() };
        if (type === 'input') {
            newBlock.label = ''; newBlock.inputType = 'text'; newBlock.required = false;
        } else if (type === 'heading' || type === 'subheading' || type === 'paragraph') {
            newBlock.content = '';
        } else if (type === 'image') {
            newBlock.url = ''; newBlock.alt = '';
        } else if (type === 'file') {
            newBlock.url = ''; newBlock.content = ''; newBlock.iconUrl = '';
        } else if (type === 'video') {
            newBlock.url = ''; // New Video Block
        }
        setSrsForm([...srsForm, newBlock]);
    };

    const handleSrsFormChange = (uuid, field, value) => {
        setSrsForm(prev => prev.map(item => item.uuid === uuid ? { ...item, [field]: value } : item));
    };

    const removeSrsBlock = (index) => {
        setSrsForm(prev => prev.filter((_, i) => i !== index));
        if (swapListType === 'srs' && swapSourceIndex === index) {
            setSwapSourceIndex(null);
            setSwapListType(null);
        }
    };

    // --- SWAP LOGIC (No Toasts) ---
    const handleSwapClick = (index, type) => {
        if (swapSourceIndex === null) {
            setSwapSourceIndex(index);
            setSwapListType(type);
        } 
        else if (swapSourceIndex === index && swapListType === type) {
            setSwapSourceIndex(null);
            setSwapListType(null);
        } 
        else if (swapListType === type) {
            const list = type === 'page' ? [...pageContent] : [...srsForm];
            const temp = list[swapSourceIndex];
            list[swapSourceIndex] = list[index];
            list[index] = temp;

            if (type === 'page') setPageContent(list);
            else setSrsForm(list);

            setSwapSourceIndex(null);
            setSwapListType(null);
        } 
        else {
            setSwapSourceIndex(index);
            setSwapListType(type);
        }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      const autoCategory = serviceType === 'standard' ? 'Standard' : 'Advanced';
      
      const cleanPageContent = pageContent.map(({ uuid, ...rest }) => rest);
      const cleanSrsForm = srsForm.map(({ uuid, ...rest }) => rest);

      const serviceData = { 
          title, description, price: Number(price), advanceAmount: Number(advanceAmount), 
          category: autoCategory, imageUrl, pageContent: cleanPageContent, contentUrls, serviceType, 
          srsForm: serviceType === 'custom' ? cleanSrsForm : [] 
      };
      try {
        if (serviceToEdit) { const { data } = await api.put(`/api/services/${serviceToEdit._id}`, serviceData); toast.success('Service updated!'); onServiceUpdated(data); } 
        else { const { data } = await api.post('/api/services', serviceData); toast.success('Service added!'); onServiceAdded(data); resetForm(); }
      } catch (error) { toast.error(error.response?.data?.message || 'Operation failed.') } 
      finally { setLoading(false); }
    };

    // Reusable Item Wrapper
    const SortableItem = ({ index, type, children, onRemove, isSelected }) => {
        return (
            <div className={`
                flex items-start bg-white border rounded-lg shadow-sm mb-3 overflow-hidden transition-all
                ${isSelected ? 'ring-2 ring-google-blue border-google-blue bg-blue-50/30' : 'border-gray-200'}
            `}>
                <button 
                    type="button"
                    onClick={() => handleSwapClick(index, type)}
                    className={`
                        w-12 shrink-0 self-stretch flex items-center justify-center border-r
                        hover:bg-gray-100 transition-colors cursor-pointer
                        ${isSelected ? 'bg-blue-100 text-google-blue' : 'bg-gray-50 text-gray-400'}
                    `}
                    title="Click to select/swap"
                >
                    <FontAwesomeIcon icon={isSelected ? faCheckCircle : faRetweet} />
                </button>
                <div className="p-3 flex-grow relative">
                     <button type="button" onClick={onRemove} className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors z-10">
                        <FontAwesomeIcon icon={faTrash} />
                     </button>
                    {children}
                </div>
            </div>
        );
    };

    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border text-left h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{serviceToEdit ? 'Edit Service' : 'Add a New Service'}</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-4 space-y-4">
            
            {/* --- General Info --- */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Card Information</h4>
                <div className="space-y-3">
                    <input type="text" placeholder="Title (for card)" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none"/>
                    <textarea placeholder="Short Description (for card)" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none" rows="2"/>
                    <input type="text" placeholder="Image URL (for card)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none"/>
                </div>
            </div>

            {/* --- Pricing --- */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">Service Type & Pricing</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-google-blue">
                        <option value="standard">Standard (Readymade Notes)</option>
                        <option value="custom">Advanced (Project Request)</option>
                    </select>
                    <input type="number" placeholder={serviceType === 'standard' ? 'Price (0 for Free)' : 'Total Project Price (Optional)'} value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none"/>
                </div>
            </div>

            {serviceType === 'standard' ? (
              <>
                {/* --- Page Content Builder (Standard) --- */}
                <div>
                    <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2 flex justify-between items-center">
                        Page Content Builder
                        <span className="text-[10px] font-normal text-google-blue bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                            <FontAwesomeIcon icon={faRetweet} className="mr-1"/> Click left icon to Swap
                        </span>
                    </h4>
                    
                    <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 min-h-[100px]">
                        {pageContent.map((block, index) => (
                            <SortableItem 
                                key={block.uuid} 
                                index={index}
                                type="page"
                                isSelected={swapListType === 'page' && swapSourceIndex === index}
                                onRemove={() => removePageContentBlock(index)}
                            >
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{block.type}</label>
                                
                                {(block.type === 'heading' || block.type === 'subheading') && (
                                    <input type="text" value={block.value} onChange={e => handlePageContentChange(block.uuid, 'value', e.target.value)} className="w-full p-2 border rounded text-sm" placeholder="Heading Text" />
                                )}
                                
                                {block.type === 'paragraph' && (
                                    <>
                                        <textarea value={block.value} onChange={e => handlePageContentChange(block.uuid, 'value', e.target.value)} className="w-full p-2 border rounded h-20 text-sm" placeholder="Paragraph Content" />
                                        <p className="text-[10px] text-gray-400 mt-1">Markdown supported (**bold**, *italic*)</p>
                                    </>
                                )}
                                
                                {block.type === 'image' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input type="url" placeholder="Image URL" value={block.url} onChange={e => handlePageContentChange(block.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                        <input type="text" placeholder="Alt Text" value={block.alt} onChange={e => handlePageContentChange(block.uuid, 'alt', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                    </div>
                                )}
                                
                                {block.type === 'file' && (
                                    <div className="space-y-2">
                                        <input type="text" placeholder="Display Name (e.g. 'Download PDF')" value={block.value} onChange={e => handlePageContentChange(block.uuid, 'value', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                        <input type="url" placeholder="File URL" value={block.url} onChange={e => handlePageContentChange(block.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                        <input type="url" placeholder="Icon URL (Optional)" value={block.iconUrl} onChange={e => handlePageContentChange(block.uuid, 'iconUrl', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                    </div>
                                )}

                                {block.type === 'video' && (
                                    <div className="space-y-2">
                                        <input type="url" placeholder="Video URL (YouTube/Vimeo)" value={block.url} onChange={e => handlePageContentChange(block.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                        <p className="text-[10px] text-gray-400">Supports YouTube/Vimeo links.</p>
                                    </div>
                                )}
                                
                                {block.type === 'purchaseButton' && (
                                    <div className="bg-yellow-50 text-yellow-800 text-sm p-2 rounded text-center border border-yellow-200 font-medium">
                                        Purchase Button (₹{price || '...'})
                                    </div>
                                )}
                            </SortableItem>
                        ))}

                        {/* Add Buttons Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            <button type="button" onClick={() => addPageContentBlock('heading')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faHeading}/> Heading</button>
                            <button type="button" onClick={() => addPageContentBlock('subheading')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faHeading} className="text-[10px]"/> Sub</button>
                            <button type="button" onClick={() => addPageContentBlock('paragraph')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faParagraph}/> Text</button>
                            <button type="button" onClick={() => addPageContentBlock('image')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faImage}/> Image</button>
                            <button type="button" onClick={() => addPageContentBlock('file')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faFileAlt}/> File</button>
                            <button type="button" onClick={() => addPageContentBlock('video')} className="text-xs bg-white border border-gray-300 px-2 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 font-medium transition-colors"><FontAwesomeIcon icon={faVideo}/> Video</button>
                            <button type="button" onClick={() => addPageContentBlock('purchaseButton')} className="text-xs bg-yellow-50 border border-yellow-300 text-yellow-700 px-2 py-2 rounded hover:bg-yellow-100 flex items-center justify-center gap-1 font-medium transition-colors col-span-2"><FontAwesomeIcon icon={faWallet}/> Buy Button</button>
                        </div>
                    </div>
                </div>

                {/* --- Downloads --- */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">Paid/Free Downloads</h4>
                    <div className="space-y-2">
                        {contentUrls.map((field, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-center gap-2">
                                <input type="text" name="name" placeholder="File Name" value={field.name} onChange={e => handlePaidContentChange(index, e)} className="w-full sm:w-1/3 p-2 border rounded-lg text-sm"/>
                                <div className="flex w-full sm:w-2/3 gap-2">
                                    <input type="url" name="url" placeholder="URL" value={field.url} onChange={e => handlePaidContentChange(index, e)} className="w-full p-2 border rounded-lg text-sm"/>
                                    {contentUrls.length > 1 && <button type="button" onClick={() => removePaidContentField(index)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><FontAwesomeIcon icon={faTrash} /></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addPaidContentField} className="text-sm font-semibold text-google-blue hover:text-blue-700 mt-2 inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faPlus} className="text-xs" /> Add Another File
                    </button>
                </div>
              </>
            ) : (
               <>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Advance Amount</label>
                      <input type="number" placeholder="Enter Amount (Optional)" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue"/>
                  </div>

                  <div>
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2 flex justify-between items-center">
                          Project Page Builder
                          <span className="text-[10px] font-normal text-google-blue bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                            <FontAwesomeIcon icon={faRetweet} className="mr-1"/> Click left icon to Swap
                          </span>
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">Build your requirement form. Mix input fields for user data with informational content.</p>
                      
                      <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 min-h-[100px]">
                          {srsForm.map((field, index) => (
                              <SortableItem 
                                key={field.uuid} 
                                index={index} 
                                type="srs"
                                isSelected={swapListType === 'srs' && swapSourceIndex === index}
                                onRemove={() => removeSrsBlock(index)}
                              >
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${field.blockType === 'input' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                          {field.blockType}
                                      </span>
                                  </div>

                                  {/* INPUT BLOCK */}
                                  {field.blockType === 'input' && (
                                      <div className="space-y-2">
                                          <input type="text" placeholder="Field Label (e.g. 'Project Title')" value={field.label} onChange={e => handleSrsFormChange(field.uuid, 'label', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                          <div className="flex flex-col sm:flex-row gap-2">
                                              <select value={field.inputType} onChange={e => handleSrsFormChange(field.uuid, 'inputType', e.target.value)} className="w-full sm:w-1/2 p-2 border rounded bg-white text-sm">
                                                  <option value="text">Single Line Text</option>
                                                  <option value="textarea">Multi-line Text</option>
                                                  <option value="file">User File Upload (Link)</option>
                                              </select>
                                              <label className="flex items-center gap-2 text-xs cursor-pointer border p-2 rounded w-full sm:w-1/2 bg-gray-50 hover:bg-gray-100">
                                                  <input type="checkbox" checked={field.required} onChange={e => handleSrsFormChange(field.uuid, 'required', e.target.checked)} className="rounded text-google-blue focus:ring-google-blue" /> 
                                                  Required Field
                                              </label>
                                          </div>
                                      </div>
                                  )}

                                  {/* CONTENT BLOCKS */}
                                  {(field.blockType === 'heading' || field.blockType === 'subheading') && (
                                      <input type="text" placeholder="Heading Text" value={field.content} onChange={e => handleSrsFormChange(field.uuid, 'content', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                  )}

                                  {field.blockType === 'paragraph' && (
                                      <textarea placeholder="Instructional Text (Markdown supported)" value={field.content} onChange={e => handleSrsFormChange(field.uuid, 'content', e.target.value)} className="w-full p-2 border rounded h-20 text-sm" />
                                  )}

                                  {field.blockType === 'image' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <input type="url" placeholder="Image URL" value={field.url} onChange={e => handleSrsFormChange(field.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                          <input type="text" placeholder="Alt Text" value={field.alt} onChange={e => handleSrsFormChange(field.uuid, 'alt', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                      </div>
                                  )}

                                  {field.blockType === 'file' && (
                                      <div className="space-y-2">
                                          <input type="text" placeholder="Display Text (e.g. 'Download Template')" value={field.content} onChange={e => handleSrsFormChange(field.uuid, 'content', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              <input type="url" placeholder="File URL (Download Link)" value={field.url} onChange={e => handleSrsFormChange(field.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                              <input type="url" placeholder="Icon URL (Optional)" value={field.iconUrl} onChange={e => handleSrsFormChange(field.uuid, 'iconUrl', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                          </div>
                                      </div>
                                  )}

                                  {field.blockType === 'video' && (
                                      <div className="space-y-2">
                                          <input type="url" placeholder="Video URL (YouTube/Vimeo)" value={field.url} onChange={e => handleSrsFormChange(field.uuid, 'url', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                      </div>
                                  )}
                              </SortableItem>
                          ))}

                          <div className="flex flex-wrap gap-2 mt-3">
                              <button type="button" onClick={() => addSrsBlock('input')} className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-100 border border-blue-200 font-semibold transition-colors"><FontAwesomeIcon icon={faKeyboard}/> Input</button>
                              <div className="w-px bg-gray-300 mx-1 hidden sm:block"></div>
                              <button type="button" onClick={() => addSrsBlock('heading')} className="text-xs bg-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 border border-gray-300 transition-colors"><FontAwesomeIcon icon={faHeading}/> H</button>
                              <button type="button" onClick={() => addSrsBlock('paragraph')} className="text-xs bg-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 border border-gray-300 transition-colors"><FontAwesomeIcon icon={faParagraph}/> P</button>
                              <button type="button" onClick={() => addSrsBlock('image')} className="text-xs bg-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 border border-gray-300 transition-colors"><FontAwesomeIcon icon={faImage}/> Img</button>
                              <button type="button" onClick={() => addSrsBlock('file')} className="text-xs bg-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 border border-gray-300 transition-colors"><FontAwesomeIcon icon={faFileLines}/> File</button>
                              <button type="button" onClick={() => addSrsBlock('video')} className="text-xs bg-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-50 border border-gray-300 transition-colors"><FontAwesomeIcon icon={faVideo}/> Vid</button>
                          </div>
                      </div>
                  </div>
               </>
            )}

          </div>

          {/* --- Action Buttons --- */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 bg-white mt-auto">
             <button type="submit" disabled={loading} className="flex-1 py-3 bg-google-blue text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={serviceToEdit ? faEdit : faPlus} />}
                {loading ? 'Saving...' : (serviceToEdit ? 'Update Service' : 'Create Service')}
             </button>
             {serviceToEdit && (
                <button type="button" onClick={onCancelEdit} className="flex-1 sm:flex-none sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                    Cancel
                </button>
             )}
          </div>
        </form>
      </div>
    );
};

// ========== Add/Edit FAQ Form Component ==========
export const AddFaqForm = ({ faqToEdit, onFaqAdded, onFaqUpdated, onCancelEdit }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);

    const resetForm = useCallback(() => {
        setQuestion('');
        setAnswer('');
        setOrder(0);
        setIsActive(true);
    }, []);

    useEffect(() => {
        if (faqToEdit) {
            setQuestion(faqToEdit.question);
            setAnswer(faqToEdit.answer);
            setOrder(faqToEdit.order || 0);
            setIsActive(faqToEdit.isActive);
        } else {
            resetForm();
        }
    }, [faqToEdit, resetForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const faqData = { question, answer, order: Number(order), isActive };
        try {
            if (faqToEdit) {
                const { data } = await api.put(`/api/admin/faqs/${faqToEdit._id}`, faqData);
                toast.success('FAQ updated!');
                onFaqUpdated(data);
            } else {
                const { data } = await api.post('/api/admin/faqs', faqData);
                toast.success('FAQ added!');
                onFaqAdded(data);
                resetForm();
            }
        } catch (error) {
            // Handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border text-left">
            <h3 className="text-lg font-semibold mb-4">{faqToEdit ? 'Edit FAQ' : 'Add a New FAQ'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow" />
                <textarea placeholder="Answer (HTML allowed)" value={answer} onChange={e => setAnswer(e.target.value)} required className="w-full p-2.5 border rounded-lg h-24 focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow" />
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" placeholder="0" value={order} onChange={e => setOrder(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none" />
                    </div>
                    <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg bg-gray-50 w-full sm:w-auto hover:bg-gray-100">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-google-blue focus:ring-google-blue rounded" />
                            <span className="text-gray-700 font-medium select-none">Active</span>
                        </label>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                    <button type="submit" disabled={loading} className="w-full py-2.5 bg-google-blue text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-colors shadow-sm">
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faqToEdit ? faEdit : faPlus} />}
                        {loading ? 'Saving...' : (faqToEdit ? 'Update FAQ' : 'Add FAQ')}
                    </button>
                    {faqToEdit && (
                        <button type="button" onClick={onCancelEdit} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    )}
                </div>
            </form>
        </div>
    );
};