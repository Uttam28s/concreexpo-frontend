'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { materialApi } from '@/lib/api';
import { Material, PaginatedResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Boxes,
  Package,
  AlertTriangle,
} from 'lucide-react';

export default function MaterialsPage() {
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    reorderLevel: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [page, searchTerm]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await materialApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      const data = response.data as PaginatedResponse<Material>;
      setMaterials(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        reorderLevel: material.reorderLevel?.toString() || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        name: '',
        reorderLevel: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const submitData = {
        name: formData.name,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
      };

      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, submitData);
        toast.success('Material updated successfully');
      } else {
        await materialApi.create(submitData);
        toast.success('Material created successfully');
      }

      setIsDialogOpen(false);
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save material');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await materialApi.delete(id);
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete material');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Material Master</h1>
          <p className="text-slate-400 mt-1">Manage materials and inventory items</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="gradient-primary text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search materials by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            All Materials ({materials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <Boxes className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400">No materials found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first material'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Material Name</TableHead>
                      <TableHead className="text-slate-300">Unit</TableHead>
                      <TableHead className="text-slate-300">Reorder Level</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow
                        key={material.id}
                        className="border-slate-800 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">{material.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {material.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {material.reorderLevel ? (
                            <div className="flex items-center text-slate-300 text-sm">
                              <AlertTriangle className="w-3 h-3 mr-1.5 text-amber-400" />
                              {material.reorderLevel} {material.unit}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              material.isActive
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }
                          >
                            {material.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(material)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(material.id, material.name)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingMaterial
                ? 'Update material information'
                : 'Create a new material for inventory'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Material Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="Wall Putty, Tile Adhesive, etc."
              />
            </div>

            {/* Unit (read-only info) */}
            <div className="space-y-2">
              <Label className="text-slate-200">Unit</Label>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <span className="text-slate-300">Bucket</span>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  Fixed Unit
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                All materials are measured in buckets
              </p>
            </div>

            {/* Reorder Level */}
            <div className="space-y-2">
              <Label htmlFor="reorderLevel" className="text-slate-200">
                Reorder Level (Optional)
              </Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) =>
                  setFormData({ ...formData, reorderLevel: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-slate-100"
                placeholder="e.g., 20"
              />
              <p className="text-xs text-slate-500">
                Alert when stock falls below this level
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formLoading}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="gradient-primary text-white"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingMaterial ? (
                  'Update Material'
                ) : (
                  'Create Material'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
