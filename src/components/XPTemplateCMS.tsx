import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Trash2, GripVertical, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface XPTemplate {
  id: string;
  image_url: string;
  section: 'pre_divider_weekly' | 'post_divider_weekly' | 'all_time';
  sort_order: number;
  is_new: boolean;
  is_default: boolean;
  created_at: string;
}

const SECTION_LABELS: Record<string, string> = {
  pre_divider_weekly: 'Pre-Divider Weekly',
  post_divider_weekly: 'Post-Divider Weekly',
  all_time: 'All-Time',
};

const SECTIONS = ['pre_divider_weekly', 'post_divider_weekly', 'all_time'] as const;

interface XPTemplateCMSProps {
  password: string;
}

export const XPTemplateCMS: React.FC<XPTemplateCMSProps> = ({ password }) => {
  const [templates, setTemplates] = useState<XPTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<XPTemplate | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/manage-xp-templates`;

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(baseUrl, {
        headers: { 'apikey': anonKey },
      });
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, anonKey]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const getTemplatesForSection = (section: string) =>
    templates
      .filter((t) => t.section === section)
      .sort((a, b) => a.sort_order - b.sort_order);

  const handleUpload = async (section: string, file: File) => {
    setUploading(section);
    try {
      const sectionTemplates = getTemplatesForSection(section);
      const maxOrder = sectionTemplates.length > 0
        ? Math.max(...sectionTemplates.map((t) => t.sort_order))
        : -1;

      const formData = new FormData();
      formData.append('password', password);
      formData.append('file', file);
      formData.append('section', section);
      formData.append('sort_order', String(maxOrder + 1));

      const res = await fetch(`${baseUrl}?action=upload`, {
        method: 'POST',
        headers: { 'apikey': anonKey },
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Template uploaded!');
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleToggle = async (id: string, field: 'is_new' | 'is_default', value: boolean) => {
    try {
      const res = await fetch(`${baseUrl}?action=update`, {
        method: 'POST',
        headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id, [field]: value }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`${baseUrl}?action=delete`, {
        method: 'POST',
        headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Template deleted');
      await fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleDragStart = (template: XPTemplate) => {
    setDragItem(template);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, targetSection: string) => {
    e.preventDefault();
    setDragOverId(targetId);
    setDragOverSection(targetSection);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDragOverId(null);
    setDragOverSection(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string, targetSection: string) => {
    e.preventDefault();
    if (!dragItem) return;

    const newTemplates = [...templates];
    const dragIdx = newTemplates.findIndex((t) => t.id === dragItem.id);
    const targetIdx = newTemplates.findIndex((t) => t.id === targetId);

    if (dragIdx === -1 || targetIdx === -1) return;

    // Update section if moving between sections
    newTemplates[dragIdx] = {
      ...newTemplates[dragIdx],
      section: targetSection as XPTemplate['section'],
    };

    // Remove and insert at target position
    const [moved] = newTemplates.splice(dragIdx, 1);
    const newTargetIdx = newTemplates.findIndex((t) => t.id === targetId);
    newTemplates.splice(newTargetIdx, 0, moved);

    // Recalculate sort orders per section
    const items: { id: string; sort_order: number; section?: string }[] = [];
    for (const section of SECTIONS) {
      const sectionItems = newTemplates.filter((t) => t.section === section);
      sectionItems.forEach((item, idx) => {
        item.sort_order = idx;
        items.push({ id: item.id, sort_order: idx, section: item.section });
      });
    }

    setTemplates(newTemplates);
    setDragItem(null);
    setDragOverId(null);
    setDragOverSection(null);

    try {
      const res = await fetch(`${baseUrl}?action=reorder`, {
        method: 'POST',
        headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, items }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      toast.error('Reorder failed');
      await fetchTemplates();
    }
  };

  const handleDropOnSection = async (e: React.DragEvent, section: string) => {
    e.preventDefault();
    if (!dragItem) return;

    // Moving to an empty section or to end of section
    const sectionTemplates = getTemplatesForSection(section);

    const newTemplates = [...templates];
    const dragIdx = newTemplates.findIndex((t) => t.id === dragItem.id);
    newTemplates[dragIdx] = {
      ...newTemplates[dragIdx],
      section: section as XPTemplate['section'],
      sort_order: sectionTemplates.length,
    };

    setTemplates(newTemplates);
    setDragItem(null);
    setDragOverId(null);
    setDragOverSection(null);

    const items: { id: string; sort_order: number; section: string }[] = [];
    for (const s of SECTIONS) {
      const sItems = newTemplates.filter((t) => t.section === s).sort((a, b) => a.sort_order - b.sort_order);
      sItems.forEach((item, idx) => {
        items.push({ id: item.id, sort_order: idx, section: item.section });
      });
    }

    try {
      const res = await fetch(`${baseUrl}?action=reorder`, {
        method: 'POST',
        headers: { 'apikey': anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, items }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      toast.error('Reorder failed');
      await fetchTemplates();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">XP Card Templates</h2>

      {SECTIONS.map((section) => {
        const sectionTemplates = getTemplatesForSection(section);
        return (
          <div
            key={section}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
            onDragOver={(e) => { e.preventDefault(); setDragOverSection(section); }}
            onDrop={(e) => handleDropOnSection(e, section)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {SECTION_LABELS[section]}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({sectionTemplates.length} templates)
                </span>
              </h3>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[section] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(section, file);
                    e.target.value = '';
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRefs.current[section]?.click()}
                  disabled={uploading === section}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {uploading === section ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>

            {sectionTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                Drag templates here or upload new ones
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sectionTemplates.map((template) => (
                  <div
                    key={template.id}
                    draggable
                    onDragStart={() => handleDragStart(template)}
                    onDragOver={(e) => handleDragOver(e, template.id, section)}
                    onDrop={(e) => handleDrop(e, template.id, section)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                      dragOverId === template.id
                        ? 'border-red-500 scale-105'
                        : 'border-gray-200 dark:border-gray-600'
                    } ${dragItem?.id === template.id ? 'opacity-50' : ''}`}
                  >
                    {/* Drag handle */}
                    <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>

                    {/* Badges */}
                    <div className="absolute top-1 right-1 z-10 flex gap-1">
                      {template.is_new && (
                        <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                      {template.is_default && (
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    {/* Image */}
                    <img
                      src={template.image_url}
                      alt="Template"
                      className="w-full aspect-[8/5] object-cover"
                      loading="lazy"
                    />

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(template.id, 'is_new', !template.is_new)}
                          className={`p-1 rounded transition-colors ${
                            template.is_new
                              ? 'bg-white text-black'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                          title="Toggle NEW badge"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(template.id, 'is_default', !template.is_default)}
                          className={`p-1 rounded transition-colors ${
                            template.is_default
                              ? 'bg-yellow-400 text-black'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                          title="Set as default"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
