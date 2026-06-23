import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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

interface CMSItem {
  _id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  category?: string;
  displayOrder?: number;
  isVisible?: boolean;
  isDeleted?: boolean;
  metadata?: any;
  createdAt: string;
}

export default function SiteCMS() {
  const [cmsTab, setCmsTab] = useState<'homepage' | 'gallery' | 'shows' | 'perform' | 'policies' | 'page404' | 'profile'>('homepage');
  
  const [performers, setPerformers] = useState<Comedian[]>([]);
  const [gallery, setGallery] = useState<CMSItem[]>([]);
  
  // Shows data
  const [showsHero, setShowsHero] = useState<CMSItem | null>(null);
  const [nextShow, setNextShow] = useState<CMSItem | null>(null);
  const [pastShows, setPastShows] = useState<CMSItem[]>([]);
  
  // Perform data
  const [performHero, setPerformHero] = useState<CMSItem | null>(null);
  
  // New Pages Data
  const [policies, setPolicies] = useState<CMSItem[]>([]);
  const [page404, setPage404] = useState<CMSItem | null>(null);
  const [profilePage, setProfilePage] = useState<CMSItem | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState<CMSItem | null>(null);
  
  const [showPastShowModal, setShowPastShowModal] = useState(false);
  const [selectedPastShow, setSelectedPastShow] = useState<CMSItem | null>(null);

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CMSItem | null>(null);

  const [savingStatus, setSavingStatus] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (cmsTab === 'homepage') {
        const res = await fetch('/api/admin/comedians');
        const data = await res.json();
        if (data.comedians) setPerformers(data.comedians.filter((c: any) => c.comedianProfile.status === 'approved'));
      } else if (cmsTab === 'gallery') {
        const res = await fetch('/api/admin/cms/content?type=gallery');
        const data = await res.json();
        if (data.content) setGallery(data.content);
      } else if (cmsTab === 'shows') {
        const [heroRes, nextRes, pastRes] = await Promise.all([
          fetch('/api/admin/cms/content?type=shows_hero'),
          fetch('/api/admin/cms/content?type=next_show'),
          fetch('/api/admin/cms/content?type=past_shows')
        ]);
        
        const heroData = await heroRes.json();
        if (heroData.content && heroData.content.length > 0) setShowsHero(heroData.content[0]);
        else setShowsHero(null);
        
        const nextData = await nextRes.json();
        if (nextData.content && nextData.content.length > 0) setNextShow(nextData.content[0]);
        else setNextShow(null);
        
        const pastData = await pastRes.json();
        if (pastData.content) setPastShows(pastData.content);
        
      } else if (cmsTab === 'perform') {
        const res = await fetch('/api/admin/cms/content?type=perform_hero');
        const data = await res.json();
        if (data.content && data.content.length > 0) setPerformHero(data.content[0]);
        else setPerformHero(null);
      } else if (cmsTab === 'policies') {
        const res = await fetch('/api/admin/cms/content?type=policy');
        const data = await res.json();
        if (data.content) setPolicies(data.content);
      } else if (cmsTab === 'page404') {
        const res = await fetch('/api/admin/cms/content?type=404');
        const data = await res.json();
        if (data.content && data.content.length > 0) setPage404(data.content[0]);
        else setPage404(null);
      } else if (cmsTab === 'profile') {
        const res = await fetch('/api/admin/cms/content?type=profile');
        const data = await res.json();
        if (data.content && data.content.length > 0) setProfilePage(data.content[0]);
        else setProfilePage(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  }, [cmsTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revalidatePaths = async (paths: string[]) => {
    try {
      await Promise.all(paths.map(path => 
        fetch('/api/admin/cms/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        })
      ));
      toast.success('Pages revalidated');
    } catch (e) {
      console.error(e);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/cms/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Failed to upload file');
    }
    const data = await res.json();
    return data.url;
  };

  const handleUploadPerformerPhoto = async (performerId: string, file: File) => {
    try {
      setSavingStatus(true);
      const url = await uploadFile(file);
      const photoId = url.split('/').pop();
      
      const res = await fetch(`/api/admin/comedians/${performerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId })
      });
      if (!res.ok) throw new Error('Failed to update photo');
      toast.success('Photo updated successfully');
      fetchData();
      revalidatePaths(['/']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeletePerformer = async (performerId: string) => {
    if (!confirm('Are you sure you want to delete this performer? This action cannot be undone.')) return;
    try {
      setSavingStatus(true);
      const res = await fetch(`/api/admin/comedians/${performerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete performer');
      toast.success('Performer deleted successfully');
      fetchData();
      revalidatePaths(['/']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveGallery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      if (!imageUrl) throw new Error('Image is required');

      const payload = {
        type: 'gallery',
        title: form.get('title'),
        category: form.get('category'),
        displayOrder: Number(form.get('displayOrder')),
        isVisible: form.get('isVisible') === 'true',
        imageUrl
      };

      const url = selectedGallery ? `/api/admin/cms/content/${selectedGallery._id}` : `/api/admin/cms/content`;
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
      revalidatePaths(['/', '/gallery']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveShowsHero = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      if (!imageUrl) throw new Error('Image is required');

      const payload = {
        type: 'shows_hero',
        title: form.get('title'),
        subtitle: form.get('subtitle'),
        imageUrl,
        isVisible: true
      };

      const url = showsHero ? `/api/admin/cms/content/${showsHero._id}` : `/api/admin/cms/content`;
      const method = showsHero ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save shows hero');
      toast.success('Shows Hero updated');
      fetchData();
      revalidatePaths(['/shows']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNextShow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      if (!imageUrl) throw new Error('Image is required');
      
      const payload = {
        type: 'next_show',
        title: form.get('title'),
        imageUrl,
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

      const url = nextShow ? `/api/admin/cms/content/${nextShow._id}` : `/api/admin/cms/content`;
      const method = nextShow ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save next show');
      toast.success('Next show updated');
      fetchData();
      revalidatePaths(['/', '/shows']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSavePastShow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      if (!imageUrl) throw new Error('Image is required');
      
      const payload = {
        type: 'past_shows',
        title: form.get('title'),
        content: form.get('description'),
        imageUrl,
        displayOrder: Number(form.get('displayOrder')),
        isVisible: form.get('isVisible') === 'true',
        metadata: {
          date: form.get('date'),
          venue: form.get('venue'),
          status: form.get('status')
        }
      };

      const url = selectedPastShow ? `/api/admin/cms/content/${selectedPastShow._id}` : `/api/admin/cms/content`;
      const method = selectedPastShow ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save past show');
      
      toast.success('Past show saved');
      setShowPastShowModal(false);
      fetchData();
      revalidatePaths(['/shows']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSavePerformHero = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      if (!imageUrl) throw new Error('Image is required');
      
      const payload = {
        type: 'perform_hero',
        title: form.get('title'),
        subtitle: form.get('subtitle'),
        content: form.get('tagline'), // using content for tagline
        imageUrl,
        isVisible: true
      };

      const url = performHero ? `/api/admin/cms/content/${performHero._id}` : `/api/admin/cms/content`;
      const method = performHero ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save perform hero');
      toast.success('Perform Hero updated');
      fetchData();
      revalidatePaths(['/perform-with-us']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAction = async (id: string, action: 'delete' | 'restore' | 'permanent_delete') => {
    try {
      if (action === 'permanent_delete') {
        if (!window.confirm('Are you sure you want to permanently delete this item? This cannot be undone.')) return;
      }
      const url = action === 'permanent_delete' ? `/api/admin/cms/content/${id}?permanent=true` : `/api/admin/cms/content/${id}`;
      const method = action === 'restore' ? 'PATCH' : 'DELETE';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: action === 'restore' ? JSON.stringify({ restore: true }) : undefined
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData();
      // Wait to revalidate all to be safe
      revalidatePaths(['/', '/gallery', '/shows', '/perform-with-us', '/policies', '/404', '/profile']);
    } catch (err) {
      toast.error('Error updating item');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const payload = {
        type: 'policy',
        title: form.get('title'),
        category: form.get('category'),
        content: form.get('content'),
        displayOrder: Number(form.get('displayOrder')),
        isVisible: form.get('isVisible') === 'true'
      };

      const url = selectedPolicy ? `/api/admin/cms/content/${selectedPolicy._id}` : `/api/admin/cms/content`;
      const method = selectedPolicy ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save policy');
      
      toast.success('Policy saved');
      setShowPolicyModal(false);
      fetchData();
      revalidatePaths(['/policies']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSave404 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      const payload = {
        type: '404',
        title: form.get('title'),
        subtitle: form.get('subtitle'), // for Description
        content: form.get('content'), // for CTA destination
        category: form.get('category'), // for CTA button text
        imageUrl,
        isVisible: true
      };

      const url = page404 ? `/api/admin/cms/content/${page404._id}` : `/api/admin/cms/content`;
      const method = page404 ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save 404 page');
      toast.success('404 Page updated');
      fetchData();
      revalidatePaths(['/404']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      const form = new FormData(e.currentTarget);
      const file = form.get('imageFile') as File;
      let imageUrl = form.get('imageUrl') as string;

      if (file && file.size > 0) {
        imageUrl = await uploadFile(file);
      }
      
      const payload = {
        type: 'profile',
        title: form.get('title'), // Page title
        subtitle: form.get('subtitle'), // Bio/About content
        content: form.get('content'), // Contact information
        category: form.get('category'), // Social Links (JSON stringified maybe)
        imageUrl, // Profile hero image
        isVisible: true
      };

      const url = profilePage ? `/api/admin/cms/content/${profilePage._id}` : `/api/admin/cms/content`;
      const method = profilePage ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save profile page');
      toast.success('Profile Page updated');
      fetchData();
      revalidatePaths(['/profile']);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex gap-6 border-b border-surface-variant overflow-x-auto whitespace-nowrap pb-0">
        <button 
          onClick={() => setCmsTab('homepage')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'homepage' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Homepage Performers
        </button>
        <button 
          onClick={() => setCmsTab('gallery')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'gallery' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Gallery Page
        </button>
        <button 
          onClick={() => setCmsTab('shows')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'shows' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Shows Page
        </button>
        <button 
          onClick={() => setCmsTab('perform')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'perform' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Perform With Us
        </button>
        <button 
          onClick={() => setCmsTab('profile')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Profile Page
        </button>
        <button 
          onClick={() => setCmsTab('policies')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'policies' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          Policies
        </button>
        <button 
          onClick={() => setCmsTab('page404')}
          className={`px-2 py-3 font-label-caps tracking-widest text-sm transition-colors ${cmsTab === 'page404' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
        >
          404 Page
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><LoadingSpinner /></div>
      ) : (
        <>
          {/* HOMEPAGE PERFORMERS TAB */}
          {cmsTab === 'homepage' && (
            <div className="space-y-4">
              <div className="bg-surface-container-low brutalist-card overflow-x-auto p-6">
                 <h2 className="text-xl font-headline-md mb-2">Approved Performers</h2>
                 <p className="text-sm text-on-surface-variant mb-6">These are the comedians that have been approved. To edit their featured status or photo, use the "Comedian Apps" tab instead (this functionality will be unified soon).</p>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-outline-variant">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Performer</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Speciality</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {performers.map(p => (
                      <tr key={p._id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high shrink-0 relative flex justify-center items-center">
                            {p.comedianProfile.photoId ? (
                              <Image 
                                src={`/api/images/${p.comedianProfile.photoId}`} 
                                alt={p.username} 
                                layout="fill" 
                                objectFit="cover" 
                              />
                            ) : (
                              <span className="material-symbols-outlined text-on-surface-variant">person</span>
                            )}
                          </div>
                          <span className="font-headline-md">{p.username}</span>
                        </td>
                        <td className="px-6 py-4">{p.comedianProfile.speciality}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <label className="text-sm text-primary-container hover:underline cursor-pointer">
                            Upload Photo
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadPerformerPhoto(p._id, e.target.files[0]);
                                }
                              }} 
                            />
                          </label>
                          <button onClick={() => handleDeletePerformer(p._id)} className="text-sm text-red-600 hover:underline font-bold">Delete</button>
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
            </div>
          )}

          {/* GALLERY TAB */}
          {cmsTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={() => { setSelectedGallery(null); setShowGalleryModal(true); }}
                  className="bg-primary-container text-[#0A0A0A] px-4 py-2 font-headline-md font-bold rounded hover:opacity-90 transition-opacity"
                >
                  + Add Gallery Image
                </button>
              </div>
              <div className="bg-surface-container-low brutalist-card overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-white/5">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Image</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Category</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Status & Order</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {gallery.map(g => (
                      <tr key={g._id} className={`hover:bg-white/[0.02] ${g.isDeleted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 flex items-center gap-4">
                          <Image width={80} height={80} src={g.imageUrl || '/'} alt={g.title || 'Image'} className="w-20 h-20 object-cover rounded bg-surface-variant" />
                          <p className="font-headline-md font-bold">{g.title || 'Untitled'}</p>
                        </td>
                        <td className="px-6 py-4">{g.category || 'Other'}</td>
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
                          <button onClick={() => { setSelectedGallery(g); setShowGalleryModal(true); }} className="text-sm text-primary-container hover:underline">Edit</button>
                          {g.isDeleted ? (
                            <button onClick={() => handleAction(g._id, 'restore')} className="text-sm text-green-400 hover:underline">Restore</button>
                          ) : (
                            <button onClick={() => handleAction(g._id, 'delete')} className="text-sm text-red-400 hover:underline">Archive</button>
                          )}
                          <button onClick={() => handleAction(g._id, 'permanent_delete')} className="text-sm text-red-600 hover:underline font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {gallery.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-on-surface-variant">No gallery images found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHOWS TAB */}
          {cmsTab === 'shows' && (
            <div className="space-y-10">
              {/* Shows Hero Section */}
              <div className="bg-[#141414] brutalist-card p-6 rounded-lg max-w-4xl">
                 <h2 className="text-xl font-headline-md font-bold mb-6 border-b border-white/5 pb-2">Shows Page Hero</h2>
                 <form onSubmit={handleSaveShowsHero} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Title</label>
                         <input name="title" defaultValue={showsHero?.title} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                       </div>
                       <div>
                         <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Subtitle</label>
                         <input name="subtitle" defaultValue={showsHero?.subtitle} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Background Image</label>
                       <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                       <input type="hidden" name="imageUrl" value={showsHero?.imageUrl || ''} />
                       {showsHero?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
                    </div>
                    <div className="flex justify-end pt-2">
                       <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold rounded hover:opacity-90 disabled:opacity-50">
                         {savingStatus ? 'Saving...' : 'Save Hero Section'}
                       </button>
                    </div>
                 </form>
              </div>

              {/* Next Show Section */}
              <div className="bg-[#141414] brutalist-card p-6 rounded-lg max-w-4xl">
                 <h2 className="text-xl font-headline-md font-bold mb-6 border-b border-white/5 pb-2">Next Show Card</h2>
                 <form onSubmit={handleSaveNextShow} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Event Title</label>
                          <input name="title" defaultValue={nextShow?.title} placeholder="e.g. The Humours Hub: Open Mic Night #14" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Ticket Price</label>
                          <input name="ticketPrice" defaultValue={nextShow?.metadata?.ticketPrice} placeholder="e.g. ₹149" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Location</label>
                          <textarea name="location" defaultValue={nextShow?.metadata?.location} required rows={2} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Time Details</label>
                          <textarea name="time" defaultValue={nextShow?.metadata?.time} required rows={2} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Date</label>
                            <input name="date" defaultValue={nextShow?.metadata?.date} placeholder="e.g. 24" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Month</label>
                            <input name="month" defaultValue={nextShow?.metadata?.month} placeholder="e.g. Nov" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Day</label>
                            <input name="day" defaultValue={nextShow?.metadata?.day} placeholder="e.g. Sunday" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">BookMyShow URL</label>
                          <input name="bookMyShowUrl" defaultValue={nextShow?.metadata?.bookMyShowUrl} placeholder="https://in.bookmyshow.com/..." className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">WhatsApp URL</label>
                          <input name="whatsappUrl" defaultValue={nextShow?.metadata?.whatsappUrl} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Visibility</label>
                          <select name="isVisible" defaultValue={nextShow?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white">
                            <option value="true">Visible</option>
                            <option value="false">Hidden</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Image</label>
                          <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                          <input type="hidden" name="imageUrl" value={nextShow?.imageUrl || ''} />
                          {nextShow?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                      <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold rounded hover:opacity-90 disabled:opacity-50">
                        {savingStatus ? 'Saving...' : 'Save Next Show'}
                      </button>
                    </div>
                 </form>
              </div>

              {/* Past Shows Section */}
              <div className="bg-[#141414] brutalist-card rounded-lg max-w-4xl p-6">
                 <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-2">
                   <h2 className="text-xl font-headline-md font-bold">Past Shows</h2>
                   <button 
                     onClick={() => { setSelectedPastShow(null); setShowPastShowModal(true); }}
                     className="bg-primary-container text-[#0A0A0A] px-4 py-1 text-sm font-bold rounded hover:opacity-90"
                   >
                     + Add Past Show
                   </button>
                 </div>
                 
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#0A0A0A] border-b border-white/5">
                     <tr>
                       <th className="px-4 py-3 text-label-caps text-on-surface-variant">Image & Title</th>
                       <th className="px-4 py-3 text-label-caps text-on-surface-variant">Date/Venue</th>
                       <th className="px-4 py-3 text-label-caps text-on-surface-variant">Order</th>
                       <th className="px-4 py-3 text-label-caps text-on-surface-variant text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {pastShows.map(show => (
                       <tr key={show._id} className={`hover:bg-white/[0.02] ${show.isDeleted ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 flex items-center gap-3">
                            <Image width={64} height={40} src={show.imageUrl || '/'} alt={show.title || 'Image'} className="w-16 h-10 object-cover rounded border border-white/10" />
                            <span className="font-bold">{show.title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>{show.metadata?.date}</div>
                            <div className="text-xs text-on-surface-variant/60">{show.metadata?.venue}</div>
                          </td>
                          <td className="px-4 py-3">{show.displayOrder}</td>
                          <td className="px-4 py-3 text-right space-x-3">
                            <button onClick={() => { setSelectedPastShow(show); setShowPastShowModal(true); }} className="text-primary-container hover:underline">Edit</button>
                            {show.isDeleted ? (
                              <button onClick={() => handleAction(show._id, 'restore')} className="text-green-400 hover:underline">Restore</button>
                            ) : (
                              <button onClick={() => handleAction(show._id, 'delete')} className="text-red-400 hover:underline">Archive</button>
                            )}
                            <button onClick={() => handleAction(show._id, 'permanent_delete')} className="text-red-600 hover:underline font-bold">Delete</button>
                          </td>
                       </tr>
                     ))}
                     {pastShows.length === 0 && (
                       <tr><td colSpan={4} className="text-center py-6 text-on-surface-variant">No past shows added yet.</td></tr>
                     )}
                   </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* PERFORM TAB */}
          {cmsTab === 'perform' && (
            <div className="bg-[#141414] brutalist-card p-6 rounded-lg max-w-4xl">
               <h2 className="text-xl font-headline-md font-bold mb-6 border-b border-white/5 pb-2">Perform With Us Hero</h2>
               <form onSubmit={handleSavePerformHero} className="space-y-4">
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Hero Title</label>
                    <input name="title" defaultValue={performHero?.title} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Subtitle</label>
                    <textarea name="subtitle" defaultValue={performHero?.subtitle} required rows={2} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Tagline</label>
                    <input name="tagline" defaultValue={performHero?.content} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                  </div>
                  <div>
                     <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Hero Image</label>
                     <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                     <input type="hidden" name="imageUrl" value={performHero?.imageUrl || ''} />
                     {performHero?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
                  </div>
                  <div className="flex justify-end pt-4">
                     <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold rounded hover:opacity-90 disabled:opacity-50">
                       {savingStatus ? 'Saving...' : 'Save Perform Hero'}
                     </button>
                  </div>
               </form>
            </div>
          )}

          {/* POLICIES TAB */}
          {cmsTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={() => { setSelectedPolicy(null); setShowPolicyModal(true); }}
                  className="bg-primary-container text-[#0A0A0A] px-4 py-2 font-headline-md font-bold rounded hover:opacity-90 transition-opacity"
                >
                  + Add Policy
                </button>
              </div>
              <div className="bg-surface-container-low brutalist-card overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A0A0A] border-b border-white/5">
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Policy Title</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Category</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant">Status & Order</th>
                      <th className="px-6 py-4 text-label-caps text-on-surface-variant text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {policies.map(p => (
                      <tr key={p._id} className={`hover:bg-white/[0.02] ${p.isDeleted ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 font-headline-md font-bold">{p.title || 'Untitled Policy'}</td>
                        <td className="px-6 py-4">{p.category || 'General'}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm">Order: {p.displayOrder}</p>
                          <div className="flex gap-2 mt-1">
                            {p.isVisible ? (
                              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Visible</span>
                            ) : (
                              <span className="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">Hidden</span>
                            )}
                            {p.isDeleted && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Archived</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => { setSelectedPolicy(p); setShowPolicyModal(true); }} className="text-sm text-primary-container hover:underline">Edit</button>
                          {p.isDeleted ? (
                            <button onClick={() => handleAction(p._id, 'restore')} className="text-sm text-green-400 hover:underline">Restore</button>
                          ) : (
                            <button onClick={() => handleAction(p._id, 'delete')} className="text-sm text-red-400 hover:underline">Archive</button>
                          )}
                          <button onClick={() => handleAction(p._id, 'permanent_delete')} className="text-sm text-red-600 hover:underline font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {policies.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-on-surface-variant">No policies found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 404 PAGE TAB */}
          {cmsTab === 'page404' && (
            <div className="bg-[#141414] brutalist-card p-6 rounded-lg max-w-4xl">
               <h2 className="text-xl font-headline-md font-bold mb-6 border-b border-white/5 pb-2">404 Page Content</h2>
               <form onSubmit={handleSave404} className="space-y-4">
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Page Title</label>
                    <input name="title" defaultValue={page404?.title} required placeholder="e.g. Page Not Found" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Description Message</label>
                    <textarea name="subtitle" defaultValue={page404?.subtitle} required rows={3} placeholder="e.g. Looks like you've wandered into the digital comedy club..." className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">CTA Button Text</label>
                      <input name="category" defaultValue={page404?.category || 'Return Home'} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-label-caps text-on-surface-variant mb-1">CTA Destination URL</label>
                      <input name="content" defaultValue={page404?.content || '/'} required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                    </div>
                  </div>
                  <div>
                     <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Illustration / Image</label>
                     <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                     <input type="hidden" name="imageUrl" value={page404?.imageUrl || ''} />
                     {page404?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
                  </div>
                  <div className="flex justify-end pt-4">
                     <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold rounded hover:opacity-90 disabled:opacity-50">
                       {savingStatus ? 'Saving...' : 'Save 404 Page'}
                     </button>
                  </div>
               </form>
            </div>
          )}

          {/* PROFILE PAGE TAB */}
          {cmsTab === 'profile' && (
            <div className="bg-[#141414] brutalist-card p-6 rounded-lg max-w-4xl">
               <h2 className="text-xl font-headline-md font-bold mb-6 border-b border-white/5 pb-2">Profile / User Dashboard Container</h2>
               <p className="text-sm text-on-surface-variant mb-6">Manage the static wrapper content surrounding the user's dashboard (e.g. title, hero image, contact links).</p>
               <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Dashboard Header Title</label>
                    <input name="title" defaultValue={profilePage?.title} placeholder="e.g. Your Comedy Hub" required className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Support / Contact Information</label>
                    <textarea name="content" defaultValue={profilePage?.content} placeholder="e.g. Need help? Contact us at support@humourshub.com" rows={2} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Extra Bio / About Notice for Dashboard</label>
                    <textarea name="subtitle" defaultValue={profilePage?.subtitle} placeholder="e.g. Important notice for all comedians..." rows={2} className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Social Links (Comma separated URLs)</label>
                    <input name="category" defaultValue={profilePage?.category} placeholder="e.g. https://instagram.com/humourshub, https://twitter.com/humourshub" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                  </div>
                  <div>
                     <label className="block text-sm font-label-caps text-on-surface-variant mb-1">Dashboard Hero Image</label>
                     <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-2 rounded text-white" />
                     <input type="hidden" name="imageUrl" value={profilePage?.imageUrl || ''} />
                     {profilePage?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
                  </div>
                  <div className="flex justify-end pt-4">
                     <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold rounded hover:opacity-90 disabled:opacity-50">
                       {savingStatus ? 'Saving...' : 'Save Profile Page Content'}
                     </button>
                  </div>
               </form>
            </div>
          )}
        </>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-[#141414] brutalist-card rounded-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-headline-md font-bold mb-6">{selectedGallery ? 'Edit Gallery Image' : 'Add Gallery Image'}</h2>
            <form onSubmit={handleSaveGallery} className="space-y-4">
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Title / Caption</label>
                <input name="title" defaultValue={selectedGallery?.title} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Image File</label>
                <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                <input type="hidden" name="imageUrl" value={selectedGallery?.imageUrl || ''} />
                {selectedGallery?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Category</label>
                  <select name="category" defaultValue={selectedGallery?.category || 'On Stage'} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container">
                    <option value="On Stage">On Stage</option>
                    <option value="The Crowd">The Crowd</option>
                    <option value="Backstage">Backstage</option>
                    <option value="After The Show">After The Show</option>
                    <option value="Venue">Venue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Display Order</label>
                  <input name="displayOrder" type="number" defaultValue={selectedGallery?.displayOrder || 0} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
              </div>
              <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Visibility</label>
                  <select name="isVisible" defaultValue={selectedGallery?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container">
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowGalleryModal(false)} className="px-6 py-2 border border-white/10 text-on-surface-variant rounded font-bold text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold text-sm rounded hover:opacity-90 disabled:opacity-50">
                  {savingStatus ? 'Saving...' : 'Save Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Past Show Modal */}
      {showPastShowModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-[#141414] brutalist-card rounded-lg p-8 w-full max-w-lg">
            <h2 className="text-xl font-headline-md font-bold mb-6">{selectedPastShow ? 'Edit Past Show' : 'Add Past Show'}</h2>
            <form onSubmit={handleSavePastShow} className="space-y-4">
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Show Title</label>
                <input name="title" defaultValue={selectedPastShow?.title} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Date (e.g. 15 NOV 2023)</label>
                  <input name="date" defaultValue={selectedPastShow?.metadata?.date} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Venue/Status (e.g. Sold Out)</label>
                  <input name="venue" defaultValue={selectedPastShow?.metadata?.venue} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Description</label>
                <textarea name="description" defaultValue={selectedPastShow?.content} required rows={3} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Image</label>
                <input type="file" name="imageFile" accept="image/*" className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                <input type="hidden" name="imageUrl" value={selectedPastShow?.imageUrl || ''} />
                {selectedPastShow?.imageUrl && <p className="text-xs text-on-surface-variant mt-1">Leave empty to keep current image</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Display Order (e.g. 12)</label>
                  <input name="displayOrder" type="number" defaultValue={selectedPastShow?.displayOrder || 0} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Visibility</label>
                  <select name="isVisible" defaultValue={selectedPastShow?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container">
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowPastShowModal(false)} className="px-6 py-2 border border-white/10 text-on-surface-variant rounded font-bold text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold text-sm rounded hover:opacity-90 disabled:opacity-50">
                  {savingStatus ? 'Saving...' : 'Save Past Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-[#141414] brutalist-card rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <h2 className="text-xl font-headline-md font-bold mb-6">{selectedPolicy ? 'Edit Policy' : 'Add Policy'}</h2>
            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Policy Title</label>
                <input name="title" defaultValue={selectedPolicy?.title} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Category / Group</label>
                  <input name="category" defaultValue={selectedPolicy?.category || 'General'} required className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
                <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Display Order</label>
                  <input name="displayOrder" type="number" defaultValue={selectedPolicy?.displayOrder || 0} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Policy Content (Markdown/HTML supported)</label>
                <textarea name="content" defaultValue={selectedPolicy?.content} required rows={10} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container font-mono text-sm" />
              </div>
              <div>
                  <label className="block text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase">Visibility</label>
                  <select name="isVisible" defaultValue={selectedPolicy?.isVisible !== false ? 'true' : 'false'} className="w-full bg-[#080808] border border-white/10 p-3 rounded-lg text-white outline-none focus:border-primary-container">
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowPolicyModal(false)} className="px-6 py-2 border border-white/10 text-on-surface-variant rounded font-bold text-sm hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" disabled={savingStatus} className="px-6 py-2 bg-primary-container text-[#0A0A0A] font-bold text-sm rounded hover:opacity-90 disabled:opacity-50">
                  {savingStatus ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
