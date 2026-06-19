import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Comedian {
  _id: string;
  username: string;
  email: string;
  comedianProfile: {
    photoId?: string;
    speciality: string;
    tagline?: string;
    instagramUrl?: string;
    displayOrder: number;
    isFeatured: boolean;
    status: string;
  };
}

interface GalleryItem {
  _id: string;
  type: string;
  title: string;
  imageId: string;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: string;
}

interface NextShowItem {
  _id: string;
  type: string;
  title: string;
  imageId?: string;
  metadata: {
    date: string;
    month: string;
    day: string;
    location: string;
    time: string;
    ticketPrice: string;
    bookMyShowUrl: string;
    whatsappUrl: string;
  };
  isVisible: boolean;
}

export default function HomepageCMS() {
  const [cmsTab, setCmsTab] = useState<'performers' | 'gallery' | 'next_show'>('performers');
  const [performers, setPerformers] = useState<Comedian[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [nextShow, setNextShow] = useState<NextShowItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showPerformerModal, setShowPerformerModal] = useState(false);
  const [selectedPerformer, setSelectedPerformer] = useState<Comedian | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);

  // Form states
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cmsTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (cmsTab === 'performers') {
        const res = await fetch('/api/admin/comedians');
        const data = await res.json();
        if (data.comedians) setPerformers(data.comedians.filter((c: any) => c.comedianProfile.status === 'approved'));
      } else if (cmsTab === 'gallery') {
        const res = await fetch('/api/admin/cms/content?type=gallery');
        const data = await res.json();
        if (data.content) setGallery(data.content);
      } else if (cmsTab === 'next_show') {
        const res = await fetch('/api/admin/cms/content?type=next_show');
        const data = await res.json();
        if (data.content && data.content.length > 0) {
          setNextShow(data.content[0]);
        } else {
          setNextShow(null);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  };

  const revalidateHomepage = async () => {
    try {
      await fetch('/api/admin/cms/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/' })
      });
      toast.success('Homepage revalidated');
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/cms/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
  };

  const handleSavePerformer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPerformer) return;
    
    setUploadingImage(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('image') as File;
      
      let photoId = selectedPerformer.comedianProfile.photoId;
      if (file && file.size > 0) {
        const uploadRes = await handleImageUpload(file);
        photoId = uploadRes.imageId;
      }

      const res = await fetch(`/api/admin/comedians/${selectedPerformer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          speciality: form.get('speciality'),
          tagline: form.get('tagline'),
          instagramUrl: form.get('instagramUrl'),
          displayOrder: Number(form.get('displayOrder')),
          isFeatured: form.get('isFeatured') === 'true',
          photoId
        })
      });

      if (!res.ok) throw new Error('Failed to update performer');
      
      toast.success('Performer updated successfully');
      setShowPerformerModal(false);
      fetchData();
      revalidateHomepage();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadingImage(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('image') as File;
      
      let imageId = selectedGallery?.imageId;
      if (file && file.size > 0) {
        const uploadRes = await handleImageUpload(file);
        imageId = uploadRes.imageId;
      }

      if (!imageId) throw new Error('Image is required');

      const payload = {
        type: 'gallery',
        title: form.get('title'),
        displayOrder: Number(form.get('displayOrder')),
        isVisible: form.get('isVisible') === 'true',
        imageId
      };

      const url = selectedGallery 
        ? `/api/admin/cms/content/${selectedGallery._id}` 
        : `/api/admin/cms/content`;
      
      const method = selectedGallery ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save gallery item');
      
      toast.success('Gallery item saved');
      setShowGalleryModal(false);
      fetchData();
      revalidateHomepage();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveNextShow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadingImage(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('image') as File;
      
      let imageId = nextShow?.imageId;
      if (file && file.size > 0) {
        const uploadRes = await handleImageUpload(file);
        imageId = uploadRes.imageId;
      }

      const payload = {
        type: 'next_show',
        title: form.get('title'),
        imageId,
        isVisible: form.get('isVisible') === 'true',
        metadata: {
          date: form.get('date'),
          month: form.get('month'),
          day: form.get('day'),
          location: form.get('location'),
          time: form.get('time'),
          ticketPrice: form.get('ticketPrice'),
          bookMyShowUrl: form.get('bookMyShowUrl'),
          whatsappUrl: form.get('whatsappUrl'),
        }
      };

      // Since there's only one "Next Show", we either create or update the existing one
      const url = nextShow 
        ? `/api/admin/cms/content/${nextShow._id}` 
        : `/api/admin/cms/content`;
      const method = nextShow ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save next show');
      
      toast.success('Next show updated');
      fetchData();
      revalidateHomepage();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryAction = async (id: string, action: 'delete' | 'restore') => {
    try {
      const res = await fetch(`/api/admin/cms/content/${id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'restore' ? JSON.stringify({ restore: true }) : undefined
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
      revalidateHomepage();
    } catch (err) {
      toast.error('Error updating gallery item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex gap-4 border-b border-outline-variant pb-2 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setCmsTab('performers')}
          className={`px-4 py-2 whitespace-nowrap font-label-caps tracking-widest text-sm transition-all ${cmsTab === 'performers' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Who Performs Here
        </button>
        <button 
          onClick={() => setCmsTab('gallery')}
          className={`px-4 py-2 whitespace-nowrap font-label-caps tracking-widest text-sm transition-all ${cmsTab === 'gallery' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Real Show Moments
        </button>
        <button 
          onClick={() => setCmsTab('next_show')}
          className={`px-4 py-2 whitespace-nowrap font-label-caps tracking-widest text-sm transition-all ${cmsTab === 'next_show' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Next Show Details
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><LoadingSpinner /></div>
      ) : (
        <>
          {/* PERFORMERS TAB */}
          {cmsTab === 'performers' && (
            <div className="bg-surface-container-low brutal-border overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-variant/20 border-b border-outline-variant">
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant">Performer</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant">Order & Status</th>
                    <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {performers.map(p => (
                    <tr key={p._id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-variant rounded flex-shrink-0 overflow-hidden">
                          {p.comedianProfile.photoId ? (
                            <img src={`/api/images/${p.comedianProfile.photoId}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-on-surface-variant">person</span>
                          )}
                        </div>
                        <div>
                          <p className="font-headline-md">{p.username}</p>
                          <p className="text-xs text-on-surface-variant">{p.comedianProfile.speciality}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">Order: {p.comedianProfile.displayOrder || 0}</p>
                        {p.comedianProfile.isFeatured ? (
                          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Featured</span>
                        ) : (
                          <span className="text-xs text-on-surface-variant bg-surface-variant px-2 py-1 rounded">Hidden</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setSelectedPerformer(p); setShowPerformerModal(true); }}
                          className="text-sm text-primary hover:underline"
                        >
                          Edit Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {performers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-on-surface-variant">No approved performers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* GALLERY TAB */}
          {cmsTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={() => { setSelectedGallery(null); setShowGalleryModal(true); }}
                  className="bg-primary text-on-primary px-4 py-2 font-headline-md rounded hover:brightness-110"
                >
                  + Add Image
                </button>
              </div>
              <div className="bg-surface-container-low brutal-border overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-variant/20 border-b border-outline-variant">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Image</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Status & Order</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {gallery.map(g => (
                      <tr key={g._id} className={`hover:bg-white/[0.02] ${g.isDeleted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 flex items-center gap-4">
                          <img src={`/api/images/${g.imageId}`} className="w-20 h-20 object-cover rounded bg-surface-variant" />
                          <p className="font-headline-md">{g.title || 'Untitled'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm">Order: {g.displayOrder}</p>
                          <div className="flex gap-2 mt-1">
                            {g.isVisible ? (
                              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Visible</span>
                            ) : (
                              <span className="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">Hidden</span>
                            )}
                            {g.isDeleted && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Archived</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => { setSelectedGallery(g); setShowGalleryModal(true); }}
                            className="text-sm text-primary hover:underline"
                          >
                            Edit
                          </button>
                          {g.isDeleted ? (
                            <button onClick={() => handleGalleryAction(g._id, 'restore')} className="text-sm text-green-400 hover:underline">Restore</button>
                          ) : (
                            <button onClick={() => handleGalleryAction(g._id, 'delete')} className="text-sm text-red-400 hover:underline">Archive</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {gallery.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-on-surface-variant">No gallery images found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEXT SHOW TAB */}
          {cmsTab === 'next_show' && (
            <div className="bg-surface-container-low brutal-border p-6 rounded-lg max-w-4xl">
              <h2 className="text-xl font-headline-md mb-6">Manage Next Show</h2>
              <form onSubmit={handleSaveNextShow} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Event Title</label>
                      <input name="title" defaultValue={nextShow?.title} placeholder="e.g. The Humours Hub: Open Mic Night #14" required className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Ticket Price</label>
                      <input name="ticketPrice" defaultValue={nextShow?.metadata?.ticketPrice} placeholder="e.g. ₹149" required className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Location</label>
                      <textarea name="location" defaultValue={nextShow?.metadata?.location} placeholder="e.g. The Studio, SG Highway\nAhmedabad" required rows={2} className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Time Details</label>
                      <textarea name="time" defaultValue={nextShow?.metadata?.time} placeholder="e.g. 8:00 PM to 10:30 PM\nGates open at 7:45 PM" required rows={2} className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                  </div>

                  {/* Date & Links */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Date</label>
                        <input name="date" defaultValue={nextShow?.metadata?.date} placeholder="e.g. 24" required className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Month</label>
                        <input name="month" defaultValue={nextShow?.metadata?.month} placeholder="e.g. Nov" required className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Day</label>
                        <input name="day" defaultValue={nextShow?.metadata?.day} placeholder="e.g. Sunday" required className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">BookMyShow URL</label>
                      <input name="bookMyShowUrl" defaultValue={nextShow?.metadata?.bookMyShowUrl} placeholder="https://in.bookmyshow.com/..." className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">WhatsApp URL</label>
                      <input name="whatsappUrl" defaultValue={nextShow?.metadata?.whatsappUrl} placeholder="https://wa.me/message/..." className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Visibility</label>
                      <select name="isVisible" defaultValue={nextShow?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-outline-variant p-3 rounded text-white">
                        <option value="true">Visible</option>
                        <option value="false">Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant">
                  <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Background Image (JPG/PNG)</label>
                  {nextShow?.imageId && (
                    <div className="mb-2">
                      <img src={`/api/images/${nextShow.imageId}`} alt="Current BG" className="h-32 rounded object-cover border border-outline-variant" />
                    </div>
                  )}
                  <input name="image" type="file" accept="image/jpeg, image/png, image/jpg" required={!nextShow?.imageId} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white text-sm" />
                  <p className="text-xs text-on-surface-variant mt-1">Images are auto-converted to WebP. Keep it wide/landscape.</p>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={uploadingImage} className="px-8 py-3 bg-primary text-on-primary font-headline-md rounded hover:brightness-110 disabled:opacity-50">
                    {uploadingImage ? 'Saving...' : 'Save Next Show'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Performer Modal */}
      {showPerformerModal && selectedPerformer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface-container-high brutal-border rounded-lg p-6 w-full max-w-xl my-8">
            <h2 className="text-xl font-headline-md mb-6">Edit Performer: {selectedPerformer.username}</h2>
            <form onSubmit={handleSavePerformer} className="space-y-4">
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Display Name</label>
                <input name="name" defaultValue={selectedPerformer.username} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
              </div>
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Speciality</label>
                <input name="speciality" defaultValue={selectedPerformer.comedianProfile.speciality} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
              </div>
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Tagline</label>
                <input name="tagline" defaultValue={selectedPerformer.comedianProfile.tagline} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
              </div>
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Instagram URL</label>
                <input name="instagramUrl" defaultValue={selectedPerformer.comedianProfile.instagramUrl} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Display Order</label>
                  <input name="displayOrder" type="number" defaultValue={selectedPerformer.comedianProfile.displayOrder || 0} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Visibility</label>
                  <select name="isFeatured" defaultValue={selectedPerformer.comedianProfile.isFeatured ? 'true' : 'false'} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white">
                    <option value="true">Visible (Featured)</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Upload New Photo (JPG/PNG)</label>
                <input name="image" type="file" accept="image/jpeg, image/png, image/jpg" className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white text-sm" />
                <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep existing photo. Images are auto-converted to WebP.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPerformerModal(false)} className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded">Cancel</button>
                <button type="submit" disabled={uploadingImage} className="px-4 py-2 bg-primary text-on-primary font-headline-md rounded hover:brightness-110 disabled:opacity-50">
                  {uploadingImage ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-surface-container-high brutal-border rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-headline-md mb-6">{selectedGallery ? 'Edit Gallery Image' : 'Add Gallery Image'}</h2>
            <form onSubmit={handleSaveGallery} className="space-y-4">
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Title / Caption</label>
                <input name="title" defaultValue={selectedGallery?.title} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Display Order</label>
                  <input name="displayOrder" type="number" defaultValue={selectedGallery?.displayOrder || 0} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Visibility</label>
                  <select name="isVisible" defaultValue={selectedGallery?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white">
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Upload Image (JPG/PNG)</label>
                <input name="image" type="file" accept="image/jpeg, image/png, image/jpg" required={!selectedGallery} className="w-full bg-[#080808] border border-outline-variant p-2 rounded text-white text-sm" />
                <p className="text-xs text-on-surface-variant mt-1">Images are auto-converted to WebP (Max 10MB).</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowGalleryModal(false)} className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded">Cancel</button>
                <button type="submit" disabled={uploadingImage} className="px-4 py-2 bg-primary text-on-primary font-headline-md rounded hover:brightness-110 disabled:opacity-50">
                  {uploadingImage ? 'Saving...' : 'Save Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
