// frontend/src/pages/admin/AdminForms.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, faPlus, faSpinner, faHeading, faParagraph, 
    faImage, faFileAlt, faWallet, faKeyboard, faFileLines 
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services';

// ========== Article Preview Component ==========
export const ArticlePreview = ({ article }) => {
    if (!article || !article.title) {
        return (
            <div className="border-4 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-500 h-full flex flex-col items-center justify-center">
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
      <div className="bg-white p-6 rounded-lg shadow-md border text-left">
        <h3 className="text-lg font-semibold mb-4">{articleToEdit ? 'Edit Article' : 'Add a New Article'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Article Title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none"/>
          <input type="text" placeholder="Featured Image URL" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none"/>
          <textarea placeholder="Excerpt (Short summary)" value={excerpt} onChange={e => setExcerpt(e.target.value)} required className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-google-blue focus:outline-none"/>
          <textarea placeholder="Full Content (Markdown supported)" value={content} onChange={e => setContent(e.target.value)} required className="w-full p-2 border rounded h-48 focus:ring-2 focus:ring-google-blue focus:outline-none"/>
          <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none"/>
          
          <div className="flex items-center gap-2 pt-4">
            <button type="submit" disabled={loading} className="w-full py-2 bg-google-blue text-white rounded font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-colors">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={articleToEdit ? faEdit : faPlus} />}
                {loading ? 'Saving...' : (articleToEdit ? 'Update Article' : 'Add Article')}
            </button>
            {articleToEdit && (
              <button type="button" onClick={onCancelEdit} className="w-full py-2 bg-gray-200 rounded font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
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
    const [pageContent, setPageContent] = useState([]);
    const [serviceType, setServiceType] = useState('standard');
    
    // ✅ NEW SRS FORM STRUCTURE (Mix of Inputs and Content)
    const [srsForm, setSrsForm] = useState([{ blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]);
    const [loading, setLoading] = useState(false);
  
    const resetForm = useCallback(() => { 
        setTitle(''); setDescription(''); setPrice(''); setAdvanceAmount(''); 
        setImageUrl(''); setContentUrls([{ name: '', url: '' }]); 
        setPageContent([]); setServiceType('standard'); 
        setSrsForm([{ blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]); 
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
            setPageContent(serviceToEdit.pageContent || []); 
            setServiceType(serviceToEdit.serviceType || 'standard');
            // Support legacy (old schema) and new schema
            if (serviceToEdit.srsForm && serviceToEdit.srsForm.length > 0) {
                const mappedForm = serviceToEdit.srsForm.map(item => ({
                    ...item,
                    blockType: item.blockType || 'input'
                }));
                setSrsForm(mappedForm);
            } else {
                setSrsForm([{ blockType: 'input', label: 'Describe your requirements', inputType: 'textarea', required: true }]);
            }
        } else { 
            resetForm(); 
        } 
    }, [serviceToEdit, resetForm]);

    // --- Page Content Builder (Standard Service) ---
    const handlePaidContentChange = (index, event) => { const values = [...contentUrls]; values[index][event.target.name] = event.target.value; setContentUrls(values); };
    const addPaidContentField = () => { setContentUrls([...contentUrls, { name: '', url: '' }]); };
    const removePaidContentField = index => { setContentUrls(prevUrls => prevUrls.filter((_, i) => i !== index)); };
    
    const addPageContentBlock = (type) => { const newBlock = { type }; if (type === 'heading' || type === 'subheading' || type === 'paragraph') newBlock.value = ''; if (type === 'image') { newBlock.url = ''; newBlock.alt = ''; } if (type === 'file') { newBlock.url = ''; newBlock.value = ''; newBlock.iconUrl = ''; } setPageContent([...pageContent, newBlock]); };
    const handlePageContentChange = (index, field, value) => { const newPageContent = [...pageContent]; newPageContent[index][field] = value; setPageContent(newPageContent); };
    const removePageContentBlock = (index) => { setPageContent(pageContent.filter((_, i) => i !== index)); };

    // --- Advanced Requirement Builder (Hybrid) ---
    const addSrsBlock = (type) => {
        let newBlock = { blockType: type };
        if (type === 'input') {
            newBlock.label = ''; newBlock.inputType = 'text'; newBlock.required = false;
        } else if (type === 'heading' || type === 'subheading' || type === 'paragraph') {
            newBlock.content = '';
        } else if (type === 'image') {
            newBlock.url = ''; newBlock.alt = '';
        } else if (type === 'file') {
            newBlock.url = ''; newBlock.content = ''; newBlock.iconUrl = '';
        }
        setSrsForm([...srsForm, newBlock]);
    };

    const handleSrsFormChange = (index, field, value) => {
        const newSrsForm = [...srsForm];
        newSrsForm[index][field] = value;
        setSrsForm(newSrsForm);
    };

    const removeSrsBlock = (index) => {
        setSrsForm(srsForm.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      const autoCategory = serviceType === 'standard' ? 'Standard' : 'Advanced';
      
      const serviceData = { 
          title, description, price: Number(price), advanceAmount: Number(advanceAmount), 
          category: autoCategory, imageUrl, pageContent, contentUrls, serviceType, 
          srsForm: serviceType === 'custom' ? srsForm : [] 
      };
      try {
        if (serviceToEdit) { const { data } = await api.put(`/api/services/${serviceToEdit._id}`, serviceData); toast.success('Service updated!'); onServiceUpdated(data); } 
        else { const { data } = await api.post('/api/services', serviceData); toast.success('Service added!'); onServiceAdded(data); resetForm(); }
      } catch (error) { toast.error(error.response?.data?.message || 'Operation failed.') } 
      finally { setLoading(false); }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border text-left h-full">
        <h3 className="text-lg font-semibold mb-4">{serviceToEdit ? 'Edit Service' : 'Add a New Service'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <h4 className="font-medium border-b pb-2">Card Information</h4>
          <input type="text" placeholder="Title (for card)" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border rounded"/>
          <textarea placeholder="Short Description (for card)" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2 border rounded"/>
          <input type="text" placeholder="Image URL (for card)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required className="w-full p-2 border rounded"/>
          
          <h4 className="font-medium border-b pb-2 pt-4">Service Type & Pricing</h4>
          <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full p-2 border rounded bg-white">
            <option value="standard">Standard (Readymade Notes/Files)</option>
            <option value="custom">Advanced (Project/Service Request)</option>
          </select>

          <input type="number" placeholder={serviceType === 'standard' ? 'Price (Enter 0 for Free)' : 'Total Project Price (Optional)'} value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded"/>

          {serviceType === 'standard' ? (
            <>
              <h4 className="font-medium border-b pb-2 pt-4">Service Page Content Builder</h4>
              <div className="space-y-3 border p-3 rounded-md min-h-[100px] bg-gray-50 max-h-64 overflow-y-auto custom-scrollbar">
                  {pageContent.map((block, index) => (
                    <div key={index} className="p-3 border bg-white rounded relative shadow-sm">
                        <button type="button" onClick={() => removePageContentBlock(index)} className="absolute top-1 right-2 text-red-500 font-bold hover:text-red-700">&times;</button>
                        <label className="block text-sm font-semibold capitalize mb-1 text-gray-600">{block.type}</label>
                        { (block.type === 'heading' || block.type === 'subheading') && <input type="text" value={block.value} onChange={e => handlePageContentChange(index, 'value', e.target.value)} className="w-full p-2 border rounded" placeholder="Heading Text" /> }
                        { block.type === 'paragraph' && <div><textarea value={block.value} onChange={e => handlePageContentChange(index, 'value', e.target.value)} className="w-full p-2 border rounded h-24" placeholder="Paragraph Content" /><p className="text-xs text-gray-500 mt-1">Use **text** for bold and *text* for italics.</p></div> }
                        { block.type === 'image' && <div className='space-y-2'><input type="url" placeholder="Image URL" value={block.url} onChange={e => handlePageContentChange(index, 'url', e.target.value)} className="w-full p-2 border rounded" /><input type="text" placeholder="Alt Text" value={block.alt} onChange={e => handlePageContentChange(index, 'alt', e.target.value)} className="w-full p-2 border rounded" /></div> }
                        { block.type === 'file' && <div className='space-y-2'><input type="url" placeholder="File URL" value={block.url} onChange={e => handlePageContentChange(index, 'url', e.target.value)} className="w-full p-2 border rounded" /><input type="text" placeholder="Display Name" value={block.value} onChange={e => handlePageContentChange(index, 'value', e.target.value)} className="w-full p-2 border rounded" /><input type="url" placeholder="Icon Image URL (Optional)" value={block.iconUrl} onChange={e => handlePageContentChange(index, 'iconUrl', e.target.value)} className="w-full p-2 border rounded" /></div> }
                        { block.type === 'purchaseButton' && <p className="text-sm text-gray-500 p-2 bg-yellow-100 rounded text-center">Purchase button for ₹{price || '...'} will be placed here.</p> }
                    </div>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addPageContentBlock('heading')} className="text-xs bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300"><FontAwesomeIcon icon={faHeading}/> Heading</button>
                <button type="button" onClick={() => addPageContentBlock('subheading')} className="text-xs bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300"><FontAwesomeIcon icon={faHeading} className="text-xs"/> Subheading</button>
                <button type="button" onClick={() => addPageContentBlock('paragraph')} className="text-xs bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300"><FontAwesomeIcon icon={faParagraph}/> Paragraph</button>
                <button type="button" onClick={() => addPageContentBlock('image')} className="text-xs bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300"><FontAwesomeIcon icon={faImage}/> Image</button>
                <button type="button" onClick={() => addPageContentBlock('file')} className="text-xs bg-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-300"><FontAwesomeIcon icon={faFileAlt}/> File Link</button>
                <button type="button" onClick={() => addPageContentBlock('purchaseButton')} className="text-xs bg-yellow-200 px-3 py-1.5 rounded font-medium flex items-center gap-1 hover:bg-yellow-300"><FontAwesomeIcon icon={faWallet}/> Purchase</button>
              </div>
              <h4 className="font-medium border-b pb-2 pt-4">Paid/Free Content (Downloads)</h4>
              <div>{contentUrls.map((field, index) => (<div key={index} className="flex items-center space-x-2 mb-2"><input type="text" name="name" placeholder="File Name" value={field.name} onChange={e => handlePaidContentChange(index, e)} className="w-1/3 p-2 border rounded"/><input type="url" name="url" placeholder="URL" value={field.url} onChange={e => handlePaidContentChange(index, e)} className="w-2/3 p-2 border rounded"/>{contentUrls.length > 1 && <button type="button" onClick={() => removePaidContentField(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">-</button>}</div>))}<button type="button" onClick={addPaidContentField} className="text-sm text-google-blue hover:underline">+ Add More</button></div>
            </>
          ) : (
             <>
                <input type="number" placeholder="Advance Amount (Optional)" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="w-full p-2 border rounded"/>
                <h4 className="font-medium border-b pb-2 pt-4">Advanced Project Page Builder</h4>
                <p className="text-xs text-gray-500 mb-2">Build your requirement form. You can mix Input Fields for the user with Informational Content (Text, Images, Files).</p>
                
                <div className="space-y-3 border p-3 rounded-md min-h-[100px] bg-gray-50 max-h-64 overflow-y-auto custom-scrollbar">
                    {srsForm.map((field, index) => (
                        <div key={index} className="p-3 border bg-white rounded shadow-sm relative">
                            <button type="button" onClick={() => removeSrsBlock(index)} className="absolute top-1 right-2 text-red-500 font-bold hover:text-red-700">&times;</button>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${field.blockType === 'input' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                                    {field.blockType}
                                </span>
                            </div>

                            {/* INPUT BLOCK CONFIG */}
                            {field.blockType === 'input' && (
                                <div className="space-y-2">
                                    <input type="text" placeholder="Field Label (e.g. 'Project Title')" value={field.label} onChange={e => handleSrsFormChange(index, 'label', e.target.value)} className="w-full p-2 border rounded" />
                                    <div className="flex gap-2">
                                        <select value={field.inputType} onChange={e => handleSrsFormChange(index, 'inputType', e.target.value)} className="w-1/2 p-2 border rounded bg-white">
                                            <option value="text">Single Line Text</option>
                                            <option value="textarea">Multi-line Text</option>
                                            <option value="file">File Link Input (User Upload)</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer border p-2 rounded w-1/2 bg-gray-50">
                                            <input type="checkbox" checked={field.required} onChange={e => handleSrsFormChange(index, 'required', e.target.checked)} /> 
                                            Required Field
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* CONTENT BLOCK CONFIG */}
                            {(field.blockType === 'heading' || field.blockType === 'subheading') && (
                                <input type="text" placeholder="Heading Text" value={field.content} onChange={e => handleSrsFormChange(index, 'content', e.target.value)} className="w-full p-2 border rounded" />
                            )}

                            {field.blockType === 'paragraph' && (
                                <div>
                                    <textarea placeholder="Instructional Text (Markdown supported)" value={field.content} onChange={e => handleSrsFormChange(index, 'content', e.target.value)} className="w-full p-2 border rounded h-20" />
                                </div>
                            )}

                            {field.blockType === 'image' && (
                                <div className="space-y-2">
                                    <input type="url" placeholder="Image URL" value={field.url} onChange={e => handleSrsFormChange(index, 'url', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="text" placeholder="Alt Text" value={field.alt} onChange={e => handleSrsFormChange(index, 'alt', e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                            )}

                            {/* ✅ UPDATED: FILE LINK WITH ICON URL */}
                            {field.blockType === 'file' && (
                                <div className="space-y-2">
                                    <input type="text" placeholder="Display Text (e.g. 'Download SRS Template')" value={field.content} onChange={e => handleSrsFormChange(index, 'content', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="url" placeholder="File URL (Download Link)" value={field.url} onChange={e => handleSrsFormChange(index, 'url', e.target.value)} className="w-full p-2 border rounded" />
                                    <input type="url" placeholder="Icon URL (Optional)" value={field.iconUrl} onChange={e => handleSrsFormChange(index, 'iconUrl', e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => addSrsBlock('input')} className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-200 border border-blue-200 font-semibold"><FontAwesomeIcon icon={faKeyboard}/> Add Input Field</button>
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    <button type="button" onClick={() => addSrsBlock('heading')} className="text-xs bg-gray-100 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200 border"><FontAwesomeIcon icon={faHeading}/> Heading</button>
                    <button type="button" onClick={() => addSrsBlock('paragraph')} className="text-xs bg-gray-100 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200 border"><FontAwesomeIcon icon={faParagraph}/> Text</button>
                    <button type="button" onClick={() => addSrsBlock('image')} className="text-xs bg-gray-100 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200 border"><FontAwesomeIcon icon={faImage}/> Image</button>
                    <button type="button" onClick={() => addSrsBlock('file')} className="text-xs bg-gray-100 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-200 border"><FontAwesomeIcon icon={faFileLines}/> File Link</button>
                </div>
             </>
          )}

          <div className="flex items-center gap-2 pt-4"><button type="submit" disabled={loading} className="w-full py-2 bg-google-blue text-white rounded font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-colors">{loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={serviceToEdit ? faEdit : faPlus} />}{loading ? 'Saving...' : (serviceToEdit ? 'Update Service' : 'Add Service')}</button>{serviceToEdit && (<button type="button" onClick={onCancelEdit} className="w-full py-2 bg-gray-200 rounded font-semibold hover:bg-gray-300 transition-colors">Cancel</button>)}</div>
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
        <div className="bg-white p-6 rounded-lg shadow-md border text-left">
            <h3 className="text-lg font-semibold mb-4">{faqToEdit ? 'Edit FAQ' : 'Add a New FAQ'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} required className="w-full p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" />
                <textarea placeholder="Answer (HTML allowed)" value={answer} onChange={e => setAnswer(e.target.value)} required className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-google-blue focus:outline-none" />
                <div className="flex gap-4">
                    <div className="flex-1">
                         <label className="block text-sm font-medium text-gray-700">Order (Lower comes first)</label>
                        <input type="number" placeholder="Sort Order" value={order} onChange={e => setOrder(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-google-blue focus:ring-google-blue" />
                            <span className="text-gray-700">Active</span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                    <button type="submit" disabled={loading} className="w-full py-2 bg-google-blue text-white rounded font-semibold flex items-center justify-center gap-2 disabled:bg-blue-400 hover:bg-blue-700 transition-colors">
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faqToEdit ? faEdit : faPlus} />}
                        {loading ? 'Saving...' : (faqToEdit ? 'Update FAQ' : 'Add FAQ')}
                    </button>
                    {faqToEdit && (
                        <button type="button" onClick={onCancelEdit} className="w-full py-2 bg-gray-200 rounded font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                    )}
                </div>
            </form>
        </div>
    );
};